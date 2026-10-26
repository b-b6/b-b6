/**
 * Персональный кабинет Соло-Мастера (barber.html?id={tenant_id})
 * - Одноколоночная сетка записей на сегодня (только личные слоты)
 * - Личная статистика и автоподсчет заработка по % (без доступа к чужим кассам)
 * - Личный статус («Активен / Пауза») и выбор рабочих дней (ПН-ВС)
 * - Собственные услуги, цены и личный QR-код (без шага выбора мастера при записи)
 */

let soloProfile = {
    id: 1,
    name: 'Топ-Мастер',
    spec: 'Fade • Борода • Классика',
    active: true,
    workDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
    workStart: '10:00',
    workEnd: '21:00',
    commissionPct: 60,
    pin: '1111'
};

let soloBookingsCache = [];
let soloServicesCache = [];
let lastSeenPushTs = Date.now();

function getTodayIso() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

window.addEventListener('DOMContentLoaded', async () => {
    const dateInput = document.getElementById('solo-schedule-date');
    if (dateInput) dateInput.value = getTodayIso();

    const tenantId = String(window.appDB ? window.appDB.tenantId : '');
    const savedSession = window.BarberMobileBridge ? window.BarberMobileBridge.getSession() : null;

    // STRICT TENANT ISOLATION FOR SOLO MASTER:
    // Verify that this numeric ID was issued in Super Admin and that the current session is authenticated for this exact ID.
    let tenants = [];
    try {
        tenants = window.appDB && window.appDB.getGlobalTenants
            ? await window.appDB.getGlobalTenants()
            : JSON.parse(localStorage.getItem('global_saas_tenants') || '[]');
    } catch (e) {}
    if (!Array.isArray(tenants) || tenants.length === 0) {
        tenants = [
            { id: '1001', email: '1001', pin: '1001', role: 'owner', shopName: 'Shine Barbershop', catalogId: 'shine_barbershop' },
            { id: '2001', email: '2001', pin: '2001', role: 'master', shopName: 'Азамат (Top Barber)' }
        ];
    }

    const masterRecord = tenants.find(t => String(t.id) === tenantId && t.role === 'master');
    const isAuthedForThisMaster = Boolean(
        masterRecord &&
        /^\d+$/.test(tenantId) &&
        (
            (sessionStorage.getItem('barberSoloAuth') === 'true' && sessionStorage.getItem('barberSoloAuthTenantId') === tenantId) ||
            (savedSession && savedSession.role === 'master' && String(savedSession.tenantId) === tenantId)
        )
    );

    if (!isAuthedForThisMaster) {
        sessionStorage.removeItem('barberSoloAuth');
        sessionStorage.removeItem('barberSoloAuthTenantId');
        window.location.replace('app.html?switch_role=1');
        return;
    }

    sessionStorage.setItem('barberSoloAuth', 'true');
    sessionStorage.setItem('barberSoloAuthTenantId', tenantId);

    const badge = document.getElementById('master-tenant-badge');
    if (badge) badge.textContent = `ID: ${tenantId}`;

    // Register push notifications for master role
    if (window.BarberMobileBridge && window.BarberMobileBridge.registerPushNotifications) {
        window.BarberMobileBridge.registerPushNotifications(tenantId, 'master');
    }

    await loadSoloStateFromDB(masterRecord);
    renderSoloHeader();
    renderWorkDaysUI();
    await renderSoloServices();
    await refreshBookingsAndRender();
    renderSoloQRCode();
    initSubscriptions();
});

const DAY_CODE_TO_NUM = { 'ВС': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };

function mapWorkDaysToNumbers(daysArr) {
    if (!Array.isArray(daysArr)) return [1, 2, 3, 4, 5, 6];
    return daysArr.map(d => DAY_CODE_TO_NUM[d]).filter(n => typeof n === 'number');
}

async function loadSoloStateFromDB(masterRecord) {
    if (!window.appDB) return;
    try {
        const settings = (await window.appDB.getSettings()) || {};
        const masters = (await window.appDB.getMasters()) || [];
        const primaryMaster = masters[0] || { id: 1, name: 'Мастер', spec: 'Барбер' };

        const defaultName = (masterRecord && masterRecord.shopName) || ('Топ-Мастер #' + (window.appDB.tenantId || '1'));
        const defaultPin = (masterRecord && masterRecord.pin) || '1111';
        soloProfile = {
            id: primaryMaster.id || 1,
            name: settings.soloMasterName || (primaryMaster.name && primaryMaster.name !== 'Мастер' ? primaryMaster.name : defaultName),
            spec: settings.soloMasterSpec || (primaryMaster.spec && primaryMaster.spec !== 'Барбер' ? primaryMaster.spec : 'Fade • Борода • Классика'),
            active: settings.soloMasterActive !== undefined ? Boolean(settings.soloMasterActive) : true,
            workDays: Array.isArray(settings.soloWorkDays) ? settings.soloWorkDays : ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
            workStart: settings.soloWorkStart || settings.workStart || settings.openTime || '10:00',
            workEnd: settings.soloWorkEnd || settings.workEnd || settings.closeTime || '21:00',
            commissionPct: Number(settings.soloCommissionPct || primaryMaster.commission || primaryMaster.share || 60),
            pin: settings.soloPin || settings.adminPin || defaultPin
        };

        if (!settings.soloMode || !settings.soloMasterName) {
            await window.appDB.saveSettings({
                ...settings,
                soloMode: true,
                soloMasterName: soloProfile.name,
                soloMasterSpec: soloProfile.spec,
                soloMasterActive: soloProfile.active,
                soloWorkDays: soloProfile.workDays,
                workingDays: mapWorkDaysToNumbers(soloProfile.workDays),
                openTime: soloProfile.workStart,
                closeTime: soloProfile.workEnd,
                soloPin: soloProfile.pin
            });
        }

        const nameInput = document.getElementById('solo-name-input');
        const specInput = document.getElementById('solo-spec-input');
        const pinInput = document.getElementById('solo-pin-input');
        const commInput = document.getElementById('solo-commission-input');
        const startInput = document.getElementById('solo-work-start');
        const endInput = document.getElementById('solo-work-end');

        if (nameInput) nameInput.value = soloProfile.name;
        if (specInput) specInput.value = soloProfile.spec;
        if (pinInput) pinInput.value = soloProfile.pin;
        if (commInput) commInput.value = soloProfile.commissionPct;
        if (startInput) startInput.value = soloProfile.workStart;
        if (endInput) endInput.value = soloProfile.workEnd;
    } catch (e) {
        console.warn('loadSoloStateFromDB error:', e);
    }
}

function renderSoloHeader() {
    const titleEl = document.getElementById('master-display-name');
    const avatarEl = document.getElementById('master-avatar-letter');
    const statusBtn = document.getElementById('status-toggle-btn');
    const statusText = document.getElementById('status-toggle-text');

    if (titleEl) titleEl.textContent = soloProfile.name;
    if (avatarEl) avatarEl.textContent = (soloProfile.name || 'М').charAt(0).toUpperCase();

    if (statusBtn && statusText) {
        if (soloProfile.active) {
            statusBtn.className = 'status-toggle-btn active';
            statusText.textContent = 'Активен';
        } else {
            statusBtn.className = 'status-toggle-btn paused';
            statusText.textContent = 'На паузе';
        }
    }
}

window.toggleMasterActiveStatus = function () {
    soloProfile.active = !soloProfile.active;
    renderSoloHeader();
    saveSoloProfile(false);
};

function renderWorkDaysUI() {
    document.querySelectorAll('#workdays-selector .day-btn').forEach(btn => {
        const day = btn.getAttribute('data-day');
        btn.classList.toggle('on', soloProfile.workDays.includes(day));
    });
}

window.toggleWorkDay = function (dayCode) {
    const idx = soloProfile.workDays.indexOf(dayCode);
    if (idx >= 0) {
        if (soloProfile.workDays.length > 1) {
            soloProfile.workDays.splice(idx, 1);
        }
    } else {
        soloProfile.workDays.push(dayCode);
    }
    renderWorkDaysUI();
    saveSoloProfile(false);
};

window.saveSoloProfile = async function (showToast) {
    const nameInput = document.getElementById('solo-name-input');
    const specInput = document.getElementById('solo-spec-input');
    const pinInput = document.getElementById('solo-pin-input');
    const commInput = document.getElementById('solo-commission-input');
    const startInput = document.getElementById('solo-work-start');
    const endInput = document.getElementById('solo-work-end');

    if (showToast && pinInput) {
        const cleanPin = pinInput.value.replace(/\D/g, '').trim();
        if (!/^\d{4}$/.test(cleanPin)) {
            alert('PIN-код для входа должен состоять ровно из 4 цифр!');
            return;
        }
        soloProfile.pin = cleanPin;
    } else if (pinInput && /^\d{4}$/.test(pinInput.value.replace(/\D/g, '').trim())) {
        soloProfile.pin = pinInput.value.replace(/\D/g, '').trim();
    }

    if (nameInput && nameInput.value.trim()) soloProfile.name = nameInput.value.trim();
    if (specInput && specInput.value.trim()) soloProfile.spec = specInput.value.trim();
    if (commInput) soloProfile.commissionPct = Math.min(100, Math.max(1, Number(commInput.value) || 60));
    if (startInput && startInput.value) soloProfile.workStart = startInput.value;
    if (endInput && endInput.value) soloProfile.workEnd = endInput.value;

    const numericWorkingDays = mapWorkDaysToNumbers(soloProfile.workDays);

    if (window.appDB) {
        try {
            const settings = (await window.appDB.getSettings()) || {};
            const updatedSettings = {
                ...settings,
                soloMode: true,
                soloMasterName: soloProfile.name,
                soloMasterSpec: soloProfile.spec,
                soloMasterActive: soloProfile.active,
                active: soloProfile.active,
                soloWorkDays: soloProfile.workDays,
                workingDays: numericWorkingDays,
                soloWorkStart: soloProfile.workStart,
                soloWorkEnd: soloProfile.workEnd,
                workStart: soloProfile.workStart,
                workEnd: soloProfile.workEnd,
                openTime: soloProfile.workStart,
                closeTime: soloProfile.workEnd,
                soloCommissionPct: soloProfile.commissionPct,
                soloPin: soloProfile.pin
            };
            await window.appDB.saveSettings(updatedSettings);

            const masters = (await window.appDB.getMasters()) || [];
            const updatedMaster = {
                id: soloProfile.id || 1,
                name: soloProfile.name,
                spec: soloProfile.spec,
                rating: '5.0',
                reviews: 45,
                commission: soloProfile.commissionPct,
                share: soloProfile.commissionPct,
                active: soloProfile.active,
                workDays: soloProfile.workDays,
                workingDays: numericWorkingDays
            };
            if (masters.length === 0) {
                await window.appDB.saveMasters([updatedMaster]);
            } else {
                masters[0] = { ...masters[0], ...updatedMaster };
                await window.appDB.saveMasters(masters);
            }

            // Sync updated name & 4-digit PIN to global_saas_tenants so app.html login & Super Admin stay in sync
            if (window.appDB.getGlobalTenants && window.appDB.saveGlobalTenants) {
                const tenants = await window.appDB.getGlobalTenants();
                const myT = Array.isArray(tenants) ? tenants.find(t => String(t.id) === String(window.appDB.tenantId)) : null;
                if (myT) {
                    myT.shopName = soloProfile.name;
                    if (/^\d{4}$/.test(String(soloProfile.pin))) {
                        myT.pin = String(soloProfile.pin);
                    }
                    await window.appDB.saveGlobalTenants(tenants);
                }
            }
        } catch (e) {
            console.error('saveSoloProfile error:', e);
        }
    }

    renderSoloHeader();
    renderSoloSchedule();
    if (showToast) {
        alert('✅ Настройки соло-мастера сохранены!');
    }
};

// ================= SINGLE-COLUMN SCHEDULE & PERSONAL EARNINGS =================
window.shiftScheduleDate = function (daysDelta) {
    const dateInput = document.getElementById('solo-schedule-date');
    if (!dateInput) return;
    const cur = dateInput.value ? new Date(dateInput.value) : new Date();
    cur.setDate(cur.getDate() + daysDelta);
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    renderSoloSchedule();
};

async function refreshBookingsAndRender() {
    if (window.appDB) {
        try {
            soloBookingsCache = (await window.appDB.getBookings()) || [];
        } catch (e) {
            console.warn('refreshBookingsAndRender error:', e);
        }
    }
    renderSoloSchedule();
}

function getSoloBookingsForDate(dateStr) {
    return soloBookingsCache.filter(b => {
        if (b.date !== dateStr) return false;
        if (b.status === 'cancelled') return false;
        if (!b.masterId || String(b.masterId) === String(soloProfile.id) || b.masterName === soloProfile.name) {
            return true;
        }
        return true;
    });
}

window.renderSoloSchedule = function () {
    const dateInput = document.getElementById('solo-schedule-date');
    const dateStr = (dateInput && dateInput.value) ? dateInput.value : getTodayIso();
    const bookings = getSoloBookingsForDate(dateStr);

    // Update personal stats & commission auto-calculation
    const completedOrActive = bookings.filter(b => b.status !== 'cancelled');
    const completedCount = bookings.filter(b => b.status === 'completed').length;
    const grossSum = completedOrActive.reduce((acc, b) => acc + (Number(b.price) || 0), 0);
    const pct = Number(soloProfile.commissionPct) || 60;
    const netEarnings = Math.round(grossSum * (pct / 100));

    const statCountEl = document.getElementById('stat-today-count');
    const statCompEl = document.getElementById('stat-completed-count');
    const statGrossEl = document.getElementById('stat-gross-sum');
    const statPctEl = document.getElementById('stat-commission-pct');
    const statNetEl = document.getElementById('stat-net-earnings');

    if (statCountEl) statCountEl.textContent = String(completedOrActive.length);
    if (statCompEl) statCompEl.textContent = `${completedCount} завершено`;
    if (statGrossEl) statGrossEl.textContent = `${grossSum.toLocaleString('ru-RU')} с`;
    if (statPctEl) statPctEl.textContent = String(pct);
    if (statNetEl) statNetEl.textContent = `${netEarnings.toLocaleString('ru-RU')} с`;

    // Build 1-column hourly slots from workStart to workEnd
    const startH = parseInt((soloProfile.workStart || '10:00').split(':')[0], 10) || 10;
    const endH = parseInt((soloProfile.workEnd || '21:00').split(':')[0], 10) || 21;

    const slotsSet = new Set();
    for (let h = startH; h <= endH; h++) {
        slotsSet.add(`${String(h).padStart(2, '0')}:00`);
    }
    bookings.forEach(b => {
        if (b.time) slotsSet.add(b.time);
    });

    const sortedTimes = Array.from(slotsSet).sort();

    const container = document.getElementById('solo-slots-container');
    if (!container) return;

    container.innerHTML = sortedTimes.map(timeStr => {
        const booking = bookings.find(b => b.time === timeStr);
        if (booking) {
            const isDone = booking.status === 'completed';
            const clientName = booking.name || booking.clientName || 'Клиент';
            const clientPhone = booking.phone || booking.clientPhone || '—';
            const serviceName = booking.service || booking.serviceName || 'Стрижка';
            const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
            const masterCut = Math.round((Number(booking.price) || 0) * (pct / 100));
            return `
                <div class="slot-row ${isDone ? 'completed' : 'booked'}">
                    <div class="slot-time">${timeStr}</div>
                    <div class="slot-info">
                        <div class="slot-client">
                            ${clientName}
                            <span style="font-size: 11.5px; color: var(--gold); font-weight: 800; margin-left: 6px;">
                                +${masterCut} с (${booking.price || 0} с)
                            </span>
                        </div>
                        <div class="slot-service">
                            ✂️ ${serviceName} • 📞 ${clientPhone}
                        </div>
                    </div>
                    <div class="slot-actions">
                        ${!isDone ? `<button class="btn-gold" style="padding: 6px 10px; font-size: 11.5px;" onclick="markSoloBookingDone('${booking.id}')" title="Отметить выполненным">✓ Готово</button>` : `<span style="color: var(--green); font-size: 12px; font-weight: 800;">✓ Оплачено</span>`}
                        ${cleanPhone ? `<a href="https://wa.me/${cleanPhone}" target="_blank" class="btn-outline" style="padding: 6px 9px; text-decoration: none;">WA</a>` : ''}
                        <button class="btn-outline" style="padding: 6px 9px; color: #f87171;" onclick="cancelSoloBooking('${booking.id}')" title="Отменить запись">✕</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="slot-row free">
                    <div class="slot-time" style="color: var(--text-muted);">${timeStr}</div>
                    <div class="slot-info" style="display: flex; align-items: center;">
                        <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">Свободное окно</span>
                    </div>
                    <div class="slot-actions">
                        <button class="btn-outline" onclick="openAddBookingModal('${timeStr}')">+ Записать</button>
                    </div>
                </div>
            `;
        }
    }).join('');
};

window.markSoloBookingDone = async function (bookingId) {
    if (!window.appDB) return;
    const bookings = (await window.appDB.getBookings()) || [];
    const b = bookings.find(x => String(x.id) === String(bookingId));
    if (b) {
        b.status = 'completed';
        await window.appDB.saveBookings(bookings);
        soloBookingsCache = bookings;
        renderSoloSchedule();
    }
};

window.cancelSoloBooking = async function (bookingId) {
    if (!window.appDB) return;
    if (!confirm('Отменить эту запись?')) return;
    const bookings = (await window.appDB.getBookings()) || [];
    const b = bookings.find(x => String(x.id) === String(bookingId));
    if (b) {
        b.status = 'cancelled';
        await window.appDB.saveBookings(bookings);
        soloBookingsCache = bookings;
        renderSoloSchedule();
    }
};

window.openAddBookingModal = async function (prefillTime) {
    const modal = document.getElementById('manual-booking-modal');
    const srvSelect = document.getElementById('mb-service-select');
    const timeInput = document.getElementById('mb-time-input');
    if (prefillTime && timeInput) timeInput.value = prefillTime;

    if (srvSelect && window.appDB) {
        if (!soloServicesCache.length) {
            soloServicesCache = (await window.appDB.getServices()) || [];
        }
        srvSelect.innerHTML = soloServicesCache.map(s => {
            const title = s.name || (s.strings && s.strings.ru ? s.strings.ru.title : 'Услуга');
            return `<option value="${s.id}">${title} — ${s.price} сом</option>`;
        }).join('');
    }
    if (modal) modal.classList.add('show');
};

window.closeAddBookingModal = function () {
    const modal = document.getElementById('manual-booking-modal');
    if (modal) modal.classList.remove('show');
};

window.saveManualSoloBooking = async function () {
    if (!window.appDB) return;
    const clientName = document.getElementById('mb-client-name').value.trim() || 'Клиент';
    const clientPhone = document.getElementById('mb-client-phone').value.trim() || '+996 555 00-00-00';
    const srvId = document.getElementById('mb-service-select').value;
    const timeVal = document.getElementById('mb-time-input').value || '14:00';
    const dateVal = document.getElementById('solo-schedule-date').value || getTodayIso();

    const services = soloServicesCache.length ? soloServicesCache : ((await window.appDB.getServices()) || []);
    const srv = services.find(s => String(s.id) === String(srvId)) || services[0] || { id: 1, name: 'Мужская стрижка', price: 600, duration: 45 };
    const srvName = srv.name || (srv.strings && srv.strings.ru ? srv.strings.ru.title : 'Мужская стрижка');

    const newBooking = {
        id: Date.now().toString(),
        name: clientName,
        phone: clientPhone,
        clientName: clientName,
        clientPhone: clientPhone,
        service: srvName,
        serviceName: srvName,
        serviceKey: srv.id,
        masterId: soloProfile.id,
        masterName: soloProfile.name,
        date: dateVal,
        time: timeVal,
        price: Number(srv.price) || 600,
        duration: Number(srv.duration) || 45,
        status: 'confirmed'
    };

    await window.appDB.addBooking(newBooking);
    soloBookingsCache = (await window.appDB.getBookings()) || [];
    closeAddBookingModal();
    renderSoloSchedule();
};

// ================= PERSONAL SERVICES & PRICES =================
const DEFAULT_SOLO_SERVICES = [
    { id: 'solo_srv_1', name: 'Мужская стрижка', price: 600, duration: 45, strings: { ru: { title: 'Мужская стрижка', desc: 'Индивидуальная стрижка с мытьем головы и укладкой' } } },
    { id: 'solo_srv_2', name: 'Стрижка + Борода', price: 900, duration: 60, strings: { ru: { title: 'Стрижка + Борода', desc: 'Полный комплекс: стрижка волос и оформление бороды' } } },
    { id: 'solo_srv_3', name: 'Моделирование бороды', price: 400, duration: 30, strings: { ru: { title: 'Моделирование бороды', desc: 'Придание формы и контуринг опасной бритвой' } } },
    { id: 'solo_srv_4', name: 'Детская стрижка', price: 500, duration: 30, strings: { ru: { title: 'Детская стрижка', desc: 'Стильная стрижка для мальчиков до 12 лет' } } }
];

window.renderSoloServices = async function () {
    const listEl = document.getElementById('solo-services-list');
    if (!listEl || !window.appDB) return;
    if (!soloServicesCache.length) {
        soloServicesCache = (await window.appDB.getServices()) || [];
    }
    if (!soloServicesCache.length) {
        soloServicesCache = DEFAULT_SOLO_SERVICES;
        await window.appDB.saveServices(soloServicesCache);
    }
    const services = soloServicesCache;

    listEl.innerHTML = services.map(s => {
        const title = s.name || (s.strings && s.strings.ru ? s.strings.ru.title : 'Услуга');
        return `
        <div class="service-item">
            <div>
                <div style="font-size: 14.5px; font-weight: 800; color: var(--text-main);">${title}</div>
                <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">⏱ ${s.duration || 45} мин</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" class="form-input" style="width: 95px; padding: 7px 10px; text-align: right; color: var(--gold); font-weight: 800;" value="${s.price || 500}" onchange="updateSoloServicePrice('${s.id}', this.value)">
                <span style="font-size: 12px; color: var(--text-muted); font-weight: 700;">сом</span>
                <button class="btn-outline" style="padding: 7px 10px; color: #f87171;" onclick="deleteSoloService('${s.id}')">🗑</button>
            </div>
        </div>
    `;}).join('');
};

window.addSoloService = async function () {
    const nameEl = document.getElementById('new-srv-name');
    const priceEl = document.getElementById('new-srv-price');
    const durEl = document.getElementById('new-srv-dur');

    const name = nameEl.value.trim();
    const price = Number(priceEl.value);
    const duration = Number(durEl.value) || 45;

    if (!name || !price) {
        alert('Укажите название услуги и цену');
        return;
    }

    const services = (await window.appDB.getServices()) || [];
    services.push({
        id: 'srv_' + Date.now(),
        name,
        price,
        duration,
        icon: '✂️',
        strings: {
            ru: { title: name, desc: 'Индивидуальная работа мастера' }
        }
    });
    await window.appDB.saveServices(services);
    soloServicesCache = services;
    nameEl.value = '';
    priceEl.value = '';
    await renderSoloServices();
};

window.updateSoloServicePrice = async function (id, newPrice) {
    const services = (await window.appDB.getServices()) || [];
    const item = services.find(s => String(s.id) === String(id));
    if (item) {
        item.price = Number(newPrice) || 0;
        await window.appDB.saveServices(services);
        soloServicesCache = services;
        renderSoloSchedule();
    }
};

window.deleteSoloService = async function (id) {
    let services = (await window.appDB.getServices()) || [];
    if (services.length <= 1) {
        alert('Должна остаться хотя бы одна услуга');
        return;
    }
    services = services.filter(s => String(s.id) !== String(id));
    await window.appDB.saveServices(services);
    soloServicesCache = services;
    await renderSoloServices();
};

// ================= PERSONAL QR CODE (SKIPS MASTER SELECTION STEP) =================
function getSoloBookingUrl() {
    const tenantId = window.appDB ? window.appDB.tenantId : 'default';
    if (window.BarberMobileBridge && window.BarberMobileBridge.getUniversalBookLink) {
        return window.BarberMobileBridge.getUniversalBookLink(tenantId, true);
    }
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    return `${base}/book.html?id=${encodeURIComponent(tenantId)}&solo=1`;
}

function renderSoloQRCode() {
    const url = getSoloBookingUrl();
    const input = document.getElementById('solo-direct-link');
    if (input) input.value = url;

    const qrBox = document.getElementById('solo-qr-container');
    if (qrBox && window.QRCode) {
        qrBox.innerHTML = '';
        new QRCode(qrBox, {
            text: url,
            width: 180,
            height: 180,
            colorDark: '#06141B',
            colorLight: '#ffffff'
        });
    }
}

window.copySoloLink = function () {
    const url = getSoloBookingUrl();
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => alert('📋 Личная ссылка скопирована!'));
    } else {
        alert(url);
    }
};

window.openSoloClientPreview = function () {
    const tenantId = window.appDB ? window.appDB.tenantId : 'default';
    window.open(`index.html?id=${encodeURIComponent(tenantId)}&solo=1`, '_blank');
};

// ================= TABS & LOGOUT =================
window.switchSoloTab = function (tabId, btnEl) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
};

window.logoutMasterSession = function () {
    if (window.BarberMobileBridge) {
        window.BarberMobileBridge.logout();
    } else {
        window.location.href = 'app.html?switch_role=1';
    }
};

// ================= REAL-TIME PUSH NOTIFICATION & DB SUBSCRIPTIONS =================
function initSubscriptions() {
    if (window.appDB) {
        if (window.appDB.subscribe) {
            window.appDB.subscribe(window.appDB.collections.bookings, (data) => {
                soloBookingsCache = data || [];
                renderSoloSchedule();
            });
            window.appDB.subscribe(window.appDB.collections.services, (data) => {
                soloServicesCache = data || [];
                renderSoloServices();
            });
        }
    }

    try {
        if (!window.firebase || !firebase.firestore || !window.appDB) return;
        const db = firebase.firestore();
        const tenantId = String(window.appDB.tenantId);
        db.collection('tenants').doc(tenantId).collection('data').doc('last_push').onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            if (data && data.timestamp > lastSeenPushTs) {
                lastSeenPushTs = data.timestamp;
                if (window.BarberMobileBridge) {
                    window.BarberMobileBridge.playNotificationSound();
                    window.BarberMobileBridge.showLocalNotification(
                        data.title || '✂️ Новая запись!',
                        data.body || ''
                    );
                }
            }
            refreshBookingsAndRender();
        });
    } catch (e) {}
}
