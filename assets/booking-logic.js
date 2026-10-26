/**
 * Единая логика сетки слотов (шаг 30 мин), ночных смен и отключения прошедшего времени.
 */
(function BookingLogic(global) {
    const STEP_MIN = 30;

    function getLocalIsoDate(d = new Date()) {
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
    }

    function parseTimeToMinutes(timeStr, defaultMins) {
        if (!timeStr || typeof timeStr !== 'string') return defaultMins;
        const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
        if (!m) return defaultMins;
        const hh = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10);
        if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 24 || mm < 0 || mm > 59) return defaultMins;
        return hh * 60 + mm;
    }

    function buildRawAvailableTimesWithMeta(openTime, closeTime) {
        let openMins = parseTimeToMinutes(openTime, 10 * 60);
        let closeMins = parseTimeToMinutes(closeTime, 21 * 60);

        openMins = Math.floor(openMins / STEP_MIN) * STEP_MIN;
        closeMins = Math.round(closeMins / STEP_MIN) * STEP_MIN;

        if (closeMins <= openMins) {
            // Если указано закрытие ночью (00:00 – 04:00), считаем это переходом через полночь (+24ч)
            if (closeMins <= 4 * 60) {
                closeMins += 24 * 60;
            } else {
                closeMins = Math.max(openMins + 60, 21 * 60);
            }
        }

        const slots = [];
        for (let m = openMins; m < closeMins; m += STEP_MIN) {
            const wrapped = m % (24 * 60);
            const hh = String(Math.floor(wrapped / 60)).padStart(2, '0');
            const mm = String(wrapped % 60).padStart(2, '0');
            slots.push({
                time: `${hh}:${mm}`,
                minuteOffset: m
            });
        }
        return slots;
    }

    function buildRawAvailableTimes(openTime, closeTime) {
        return buildRawAvailableTimesWithMeta(openTime, closeTime).map(s => s.time);
    }

    function isSlotInPast(isoDate, slotMinuteOffset, nowDate = new Date()) {
        if (!isoDate) return false;
        const todayIso = getLocalIsoDate(nowDate);
        if (isoDate < todayIso) return true;
        if (isoDate > todayIso) return false;
        const nowMins = nowDate.getHours() * 60 + nowDate.getMinutes();
        return slotMinuteOffset <= nowMins;
    }

    function serviceDuration(serviceKey, allServices) {
        const list = Array.isArray(allServices) ? allServices : [];
        const bSrv = list.find(s => String(s.id) === String(serviceKey));
        return bSrv && bSrv.duration ? Number(bSrv.duration) : 60;
    }

    /**
     * Карта занятости по дате (как в index renderTimes).
     */
    function buildBookedMapForDate(existingBookings, date, rawAvailableTimes, allServices) {
        const bookedMap = {};
        const list = Array.isArray(existingBookings) ? existingBookings : [];
        const services = Array.isArray(allServices) ? allServices : [];
        list
            .filter(b => b.status !== 'cancelled' && b.date === date)
            .forEach(b => {
                let sDur = serviceDuration(b.serviceKey, services);
                if (!b.serviceKey && b.service) {
                    const byTitle = services.find(s => s.strings && s.strings.ru && s.strings.ru.title === b.service);
                    if (byTitle && byTitle.duration) sDur = Number(byTitle.duration);
                }
                const bSlots = Math.max(1, Math.ceil(sDur / STEP_MIN));
                const tIdx = rawAvailableTimes.indexOf(b.time);
                if (tIdx === -1) return;
                for (let k = 0; k < bSlots; k++) {
                    if (tIdx + k < rawAvailableTimes.length) {
                        const bkTime = rawAvailableTimes[tIdx + k];
                        if (!bookedMap[bkTime]) bookedMap[bkTime] = [];
                        bookedMap[bkTime].push(b.masterId);
                    }
                }
            });
        return bookedMap;
    }

    /**
     * true = слот с этой стартовой меткой занят (как disabled в UI).
     */
    function slotIntervalBlocked(bookedMap, rawAvailableTimes, timeStart, masterId, numMasters, durMinutes) {
        const blocksNeeded = Math.max(1, Math.ceil((durMinutes || 60) / STEP_MIN));
        const index = rawAvailableTimes.indexOf(timeStart);
        if (index === -1 || index + blocksNeeded > rawAvailableTimes.length) return true;

        for (let k = 0; k < blocksNeeded; k++) {
            const checkTime = rawAvailableTimes[index + k];
            const slotsBooked = bookedMap[checkTime] || [];
            if (masterId === 'any') {
                if (slotsBooked.length >= numMasters || slotsBooked.includes('any')) return true;
            } else {
                if (slotsBooked.includes(masterId) || slotsBooked.includes('any')) return true;
            }
        }
        return false;
    }

    function normalizePhone(phone) {
        if (!phone || typeof phone !== 'string') return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 9) {
            return digits.slice(-9); // берём значащие 9 цифр, исключая различия префиксов +996, 0555 и 996555
        }
        return digits;
    }

    function normalizeName(name) {
        if (!name || typeof name !== 'string') return '';
        return name.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function intervalsOverlap(startA, durA, startB, durB) {
        const endA = startA + (durA || 60);
        const endB = startB + (durB || 60);
        return Math.max(startA, startB) < Math.min(endA, endB);
    }

    function getActiveBookingsForPhone(existingItems, phone, nowDate = new Date()) {
        const normPhone = normalizePhone(phone);
        if (!normPhone) return [];
        const todayIso = getLocalIsoDate(nowDate);
        const list = Array.isArray(existingItems) ? existingItems : [];
        return list.filter(b => {
            if (b.status === 'cancelled') return false;
            if (!b.date || b.date < todayIso) return false;
            return normalizePhone(b.phone) === normPhone;
        });
    }

    /**
     * @param {Array} existingItems — все записи (в т.ч. cancelled — отфильтруем)
     * @param {object} candidate — { date, time, masterId, serviceKey, name, phone }
     * @param {object} ctx — { masters, services, settings, allowPast, allowAdminBypass }
     * @returns {string|null} — null если ок, иначе код ошибки
     */
    function validateNewBooking(existingItems, candidate, ctx) {
        const masters = ctx.masters || [];
        const services = ctx.services || [];
        const settings = ctx.settings || { openTime: '10:00', closeTime: '21:00' };

        if (!candidate || !candidate.date || !candidate.time || !candidate.masterId) {
            return 'INVALID_BOOKING_PAYLOAD';
        }

        const dur = serviceDuration(candidate.serviceKey, services);
        const slotsMeta = buildRawAvailableTimesWithMeta(settings.openTime, settings.closeTime);
        const rawAvailableTimes = slotsMeta.map(s => s.time);

        if (!ctx.allowPast) {
            const foundSlot = slotsMeta.find(s => s.time === candidate.time);
            if (foundSlot && isSlotInPast(candidate.date, foundSlot.minuteOffset)) {
                return '⏰ Это время уже прошло. Пожалуйста, выберите актуальное время.';
            }
        }

        const existing = (existingItems || []).filter(b => b.status !== 'cancelled');

        // 3. Защита от спама и лимиты по номеру телефона (если не ручной ввод админа)
        if (!ctx.allowAdminBypass && candidate.phone) {
            const activeForPhone = getActiveBookingsForPhone(existing, candidate.phone);

            // Квота: максимум 4 активные записи на один номер
            if (activeForPhone.length >= 4) {
                return '⚠️ На этот номер телефона уже оформлено 4 активные записи (максимум для онлайн-бронирования). Для записи большего количества людей свяжитесь с администратором напрямую.';
            }

            // Запрет наложения времени для одного и того же человека
            const candStartMins = parseTimeToMinutes(candidate.time, 0);
            const candNormName = normalizeName(candidate.name);

            const hasDoubleBooking = activeForPhone.some(b => {
                if (b.date !== candidate.date) return false;
                const bStartMins = parseTimeToMinutes(b.time, 0);
                const bDur = serviceDuration(b.serviceKey, services);
                const overlaps = intervalsOverlap(candStartMins, dur, bStartMins, bDur);
                if (!overlaps) return false;

                // Если имена совпадают — это один и тот же человек (дубль)
                // Если имена разные (например, отец и сын: «Азамат» и «Тимур») — разрешаем!
                const bNormName = normalizeName(b.name);
                if (!candNormName || !bNormName) return true;
                return candNormName === bNormName;
            });

            if (hasDoubleBooking) {
                return '⚠️ На этот номер и имя уже есть запись на пересекающееся время. Если вы записываете другого человека (друга или сына), укажите его имя в поле «Ваше имя».';
            }
        }

        const bookedMap = buildBookedMapForDate(existing, candidate.date, rawAvailableTimes, services);
        const numMasters = Math.max(1, masters.filter(m => m.active !== false).length || masters.length);

        if (slotIntervalBlocked(bookedMap, rawAvailableTimes, candidate.time, candidate.masterId, numMasters, dur)) {
            return 'SLOT_TAKEN';
        }
        return null;
    }

    global.BookingLogic = {
        STEP_MIN,
        getLocalIsoDate,
        parseTimeToMinutes,
        buildRawAvailableTimesWithMeta,
        buildRawAvailableTimes,
        isSlotInPast,
        buildBookedMapForDate,
        slotIntervalBlocked,
        validateNewBooking,
        serviceDuration,
        normalizePhone,
        normalizeName,
        intervalsOverlap,
        getActiveBookingsForPhone
    };
})(typeof window !== 'undefined' ? window : globalThis);
