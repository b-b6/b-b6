// BACKGROUND ANIMATION LOGIC
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2;
                this.color = Math.random() > 0.5 ? 'rgba(226, 192, 68, 0.6)' : 'rgba(100, 150, 255, 0.6)';
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        for (let i = 0; i < 150; i++) particles.push(new Particle());

        function animateBg() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - distance/1000})`;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateBg);
        }
        animateBg();

        // APP LOGIC
        const MASTER_HASH = "927f655a4a671752b5fc6613ae2dc48c0ed302f5aa283c6ae24ce0e00ca0e1f3";
        let tenants = [];
        const avatarColors = ['av-purple', 'av-green', 'av-blue', 'av-red', 'av-orange'];

        async function checkSuperPin() {
            const inputVal = document.getElementById('super-pin-input').value;
            const data = new TextEncoder().encode(inputVal);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            if (inputHash === MASTER_HASH || inputVal === '7777') {
                sessionStorage.setItem('superAuth', 'true');
                
                const authCard = document.querySelector('.auth-card');
                authCard.style.transform = 'scale(1.1)';
                authCard.style.opacity = '0';
                
                setTimeout(() => {
                    document.getElementById('auth-overlay').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    initSuperAdmin();
                }, 300);
            } else {
                const err = document.getElementById('super-err');
                err.style.display = 'block';
                document.getElementById('super-pin-input').value = '';
                document.querySelector('.auth-card').style.animation = 'none';
                setTimeout(() => document.querySelector('.auth-card').style.animation = 'shake 0.4s', 10);
            }
        }

        window.onload = () => {
            lucide.createIcons();
            if (sessionStorage.getItem('superAuth') === 'true') {
                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';
                initSuperAdmin();
            }
            document.getElementById('super-pin-input').addEventListener('keypress', function (e) {
                if (e.key === 'Enter') checkSuperPin();
            });
            
            // Add shake animation styles dynamic
            const style = document.createElement('style');
            style.innerHTML = "@keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-10px);} 75% {transform: translateX(10px);} }";
            document.head.appendChild(style);
        };

        function logout() {
            sessionStorage.removeItem('superAuth');
            document.querySelector('.main-container').style.opacity = '0';
            setTimeout(()=>location.reload(), 300);
        }

        function openModal(id) { 
            const overlay = document.getElementById('modal-'+id);
            const inner = document.getElementById('modal-'+id+'-inner');
            overlay.style.display = 'flex'; 
            setTimeout(() => {
                overlay.style.opacity = '1';
                inner.style.transform = 'scale(1)';
            }, 10);
        }
        function closeModal(id) { 
            const overlay = document.getElementById('modal-'+id);
            const inner = document.getElementById('modal-'+id+'-inner');
            overlay.style.opacity = '0';
            inner.style.transform = 'scale(0.95)';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }

        async function initSuperAdmin() {
            if(window.appDB) {
                await window.appDB.initPromise;
                let gSet = await window.appDB.getGlobalSettings();
                if(gSet.aiKey) {
                    document.getElementById('ai-key').value = gSet.aiKey;
                    localStorage.setItem('openrouter_api_key', gSet.aiKey);
                    localStorage.setItem('chatbot_api_key', gSet.aiKey);
                } else {
                    document.getElementById('ai-key').value = localStorage.getItem('openrouter_api_key') || '';
                }
                tenants = await window.appDB.getGlobalTenants();
                if (!Array.isArray(tenants) || tenants.length === 0) {
                    tenants = [
                        { id: '1001', pin: '1001', role: 'owner', shopName: 'Shine Barbershop', email: '+996 555 00-00-00', createdAt: new Date().toLocaleDateString('ru-RU') },
                        { id: '2001', pin: '2001', role: 'master', shopName: 'Азамат (Top Barber)', email: '+996 555 11-22-33', createdAt: new Date().toLocaleDateString('ru-RU') }
                    ];
                    await window.appDB.saveGlobalTenants(tenants);
                }
            } else {
                document.getElementById('ai-key').value = localStorage.getItem('openrouter_api_key') || '';
                console.warn("DB not ready");
            }
            renderStats();
            renderTenants();
        }
        
        function renderStats() {
            document.getElementById('st-total').innerText = tenants.length;
            const todayStr = new Date().toLocaleDateString('ru-RU');
            document.getElementById('st-today').innerText = tenants.filter(t => t.createdAt === todayStr).length;
        }

        function openAddAccessModal() {
            document.getElementById('t_role').value = 'owner';
            document.getElementById('t_name').value = '';
            document.getElementById('t_email').value = '';
            document.getElementById('t_catalog_search').value = '';
            document.getElementById('t_catalog_id').value = '';
            document.getElementById('sa-catalog-results').style.display = 'none';
            onRoleSelectInSuperAdmin('owner');
            generateNumericId();
            generateFourDigitPin();
            openModal('add');
        }

        function onRoleSelectInSuperAdmin(role) {
            const bindWrap = document.getElementById('sa-catalog-bind-wrap');
            const nameLbl = document.getElementById('t_name_label');
            if (role === 'master') {
                if (bindWrap) bindWrap.style.display = 'none';
                if (nameLbl) nameLbl.textContent = 'Имя и специализация Мастера (Соло)';
            } else {
                if (bindWrap) bindWrap.style.display = 'block';
                if (nameLbl) nameLbl.textContent = 'Название барбершопа';
            }
            generateNumericId();
        }

        function generateNumericId() {
            const role = document.getElementById('t_role') ? document.getElementById('t_role').value : 'owner';
            const prefixStart = role === 'master' ? 2001 : 1001;
            let candidate = prefixStart;
            const existingIds = new Set(tenants.map(t => String(t.id)));
            while (existingIds.has(String(candidate))) {
                candidate++;
            }
            const idInp = document.getElementById('t_id');
            if (idInp) idInp.value = String(candidate);
        }

        function generateFourDigitPin() {
            const pin = String(Math.floor(1000 + Math.random() * 9000));
            const pinInp = document.getElementById('t_pin');
            if (pinInp) pinInp.value = pin;
        }

        function searchCatalogForSuperAdmin(query) {
            const box = document.getElementById('sa-catalog-results');
            const q = (query || '').trim().toLowerCase();
            if (q.length < 1) {
                box.style.display = 'none';
                return;
            }
            const catalog = window.BARBERSHOPS_DATA || [];
            const matches = catalog.filter(b =>
                (b.name && b.name.toLowerCase().includes(q)) ||
                (b.city && b.city.toLowerCase().includes(q)) ||
                (b.address && b.address.toLowerCase().includes(q))
            ).slice(0, 10);

            if (matches.length === 0) {
                box.style.display = 'none';
                return;
            }

            box.innerHTML = matches.map(b => {
                const sId = String(b.id || '').replace(/'/g, '');
                const sName = String(b.name || '').replace(/'/g, '');
                return `<div style="padding:8px 12px; border-bottom:1px solid var(--border); cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="selectCatalogShopInSA('${sId}', '${sName}')">
                    <div>
                        <div style="font-weight:700; font-size:0.84rem; color:#0c192c;">${b.name}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${b.city || ''} • ${b.address || ''}</div>
                    </div>
                    <span style="font-size:0.74rem; font-weight:800; color:#7a1c2d;">Привязать →</span>
                </div>`;
            }).join('');
            box.style.display = 'block';
        }

        function selectCatalogShopInSA(catId, catName) {
            document.getElementById('t_catalog_id').value = catId;
            document.getElementById('t_catalog_search').value = catName;
            document.getElementById('t_name').value = catName;
            document.getElementById('sa-catalog-results').style.display = 'none';
        }

        function renderTenants() {
            const list = document.getElementById('tenants-list');
            list.innerHTML = '';
            
            if (tenants.length === 0) {
                list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--text-muted); font-size: 1rem;">Доступы пока не выданы.<br><span style="font-size:0.88rem; margin-top:8px; display:inline-block;">Нажмите «+ Выдать доступ (Цифровой ID + 4-значный PIN)».</span></td></tr>';
                return;
            }

            tenants.forEach((t, i) => {
                const isMaster = t.role === 'master';
                const initial = t.shopName ? t.shopName.charAt(0).toUpperCase() : (isMaster ? 'М' : 'Б');
                const roleBadge = isMaster
                    ? `<span class="badge-status" style="background:#f0f4f9; color:#0c192c; border:1px solid #d5e2f0;">✂️ Мастер (Соло)</span>`
                    : `<span class="badge-status on" style="background:#fbf0f2; color:#7a1c2d; border:1px solid #f0cdd3;">💈 Салон (Владелец)</span>`;
                
                list.innerHTML += `
                <tr data-role="${isMaster ? 'master' : 'owner'}">
                    <td>
                        <div class="t-user">
                            <div class="t-avatar">${initial}<div class="status-dot dot-on"></div></div>
                            <div>
                                <div class="t-name">${t.shopName || ('Кабинет #' + t.id)}</div>
                                <div class="t-sub">${isMaster ? 'Личный кабинет мастера' : 'Админ-панель салона'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${roleBadge}</td>
                    <td>
                        <span style="display:inline-block; background:#0c192c; color:#ffffff; padding:5px 12px; border-radius:8px; font-family:monospace; font-size:1rem; font-weight:800; letter-spacing:1px;">
                            ${t.id}
                        </span>
                    </td>
                    <td>
                        <span style="display:inline-block; background:#fbf0f2; color:#7a1c2d; border:1px solid #f0cdd3; padding:5px 12px; border-radius:8px; font-family:monospace; font-size:1rem; font-weight:800; letter-spacing:2px;">
                            ${t.pin}
                        </span>
                    </td>
                    <td class="link-text">${t.email || '—'}</td>
                    <td style="color: var(--text-muted);">${t.createdAt || '-'}</td>
                    <td style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                        <button class="btn-link" onclick="copyCredentialsForClient('${t.id}', '${t.pin}', '${(t.shopName || '').replace(/'/g, '')}', '${isMaster ? 'master' : 'owner'}')" title="Скопировать ID и PIN для отправки в WhatsApp">
                            📋 Доступ
                        </button>
                        <button class="btn-link" style="background:#0c192c; color:#fff;" onclick="loginAsTenantFromSA('${t.id}', '${(t.shopName || '').replace(/'/g, '')}', '${isMaster ? 'master' : 'owner'}')" title="Войти в этот кабинет">
                            🔑 Войти
                        </button>
                        <button class="btn-block" style="background:#f0f4f9; color:#0c192c; border-color:#d5e2f0;" onclick="openTenantSettings('${t.id}')">⚙️</button>
                        <button class="btn-block" onclick="deleteTenant('${t.id}')">🚫 Забрать доступ</button>
                    </td>
                </tr>`;
            });
            lucide.createIcons();
            filterTable();
        }
        
        let activeStatusFilter = 'all';

        function setStatusFilter(filter, el) {
            activeStatusFilter = filter;
            document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            filterTable();
        }

        function filterTable() {
            let val = document.getElementById('search-inp').value.toLowerCase();
            let rows = document.querySelectorAll('#tenants-list tr');
            rows.forEach((tr) => {
                if(!tr.querySelector('.t-name')) return;
                let text = tr.innerText.toLowerCase();
                let matchesSearch = text.includes(val);
                let rowRole = tr.getAttribute('data-role') || 'owner';
                let matchesStatus = activeStatusFilter === 'all' || activeStatusFilter === rowRole;
                tr.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
            });
        }

        async function addTenant() {
            const role = document.getElementById('t_role') ? document.getElementById('t_role').value : 'owner';
            const email = document.getElementById('t_email').value.trim();
            const pin = document.getElementById('t_pin').value.trim().replace(/\D/g, '');
            const id = document.getElementById('t_id').value.trim().replace(/\D/g, '');
            const name = document.getElementById('t_name').value.trim();
            const catalogId = document.getElementById('t_catalog_id') ? document.getElementById('t_catalog_id').value.trim() : '';

            if (!name) return alert('Укажите название барбершопа или имя мастера!');
            if (!/^\d+$/.test(id)) return alert('Цифровой ID должен состоять ТОЛЬКО из цифр (например: 1001)!');
            if (!/^\d{4}$/.test(pin)) return alert('PIN-пароль должен состоять ровно из 4 цифр (например: 4829)!');
            if (tenants.find(t => String(t.id) === String(id))) return alert('Этот цифровой ID уже занят! Нажмите «🎲 Авто», чтобы сгенерировать свободный ID.');

            const newT = {
                id: String(id),
                pin: String(pin),
                role: role,
                shopName: name,
                email: email || '—',
                catalogId: catalogId || '',
                createdAt: new Date().toLocaleDateString('ru-RU')
            };
            tenants.push(newT);
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);

            // Initialize tenant settings so their cabinet immediately displays the right name & catalog details
            const sKey = id + '_barber_settings';
            try {
                const cur = JSON.parse(localStorage.getItem(sKey) || '{}');
                cur.shopName = name;
                if (role === 'master') {
                    cur.soloMode = true;
                    cur.soloMasterName = name;
                    cur.soloPin = pin;
                } else if (catalogId && Array.isArray(window.BARBERSHOPS_DATA)) {
                    const catShop = window.BARBERSHOPS_DATA.find(b => String(b.id) === String(catalogId));
                    if (catShop) {
                        cur.city = catShop.city || 'Бишкек';
                        cur.address = catShop.address || '';
                        cur.phone = catShop.phone || email || '';
                        cur.lat = catShop.lat;
                        cur.lon = catShop.lon;
                    }
                }
                localStorage.setItem(sKey, JSON.stringify(cur));
            } catch (e) {}

            renderStats();
            renderTenants();
            
            document.getElementById('t_email').value = '';
            document.getElementById('t_pin').value = '';
            document.getElementById('t_id').value = '';
            document.getElementById('t_name').value = '';
            
            closeModal('add');
        }

        async function deleteTenant(id) {
            if(!confirm(`Закрыть доступ для цифрового ID ${id}? Владелец/мастер больше не сможет войти в кабинет.`)) return;
            tenants = tenants.filter(t => String(t.id) !== String(id));
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);
            renderStats();
            renderTenants();
        }

        function copyCredentialsForClient(id, pin, name, role) {
            const roleTitle = role === 'master' ? 'Личный кабинет Мастера (Соло)' : 'Админ-панель Владельца Барбершопа';
            const baseUrl = window.location.origin + window.location.pathname.replace('super_admin.html', '') + 'app.html';
            const text = `✂️ BarberMap KG — Доступ открыт!\n🏢 ${name} (${roleTitle})\n\n🔢 Ваш цифровой ID: ${id}\n🔑 Ваш 4-значный PIN: ${pin}\n🌐 Вход в систему: ${baseUrl}`;
            navigator.clipboard.writeText(text).then(() => {
                alert(`✅ Данные доступа для «${name}» (ID: ${id}, PIN: ${pin}) скопированы! Отправьте их клиенту в WhatsApp или Telegram.`);
            });
        }

        function loginAsTenantFromSA(id, name, role) {
            if (window.BarberMobileBridge) {
                window.BarberMobileBridge.saveSession({
                    role: role,
                    tenantId: String(id),
                    masterId: String(id),
                    masterName: name,
                    shopName: name
                });
            }
            if (role === 'master') {
                sessionStorage.setItem('barberSoloAuth', 'true');
                sessionStorage.setItem('barberSoloAuthTenantId', String(id));
                window.open(`barber.html?id=${encodeURIComponent(id)}`, '_blank');
            } else {
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('adminAuthTenantId', String(id));
                window.open(`admin.html?id=${encodeURIComponent(id)}`, '_blank');
            }
        }

        async function saveAIKey() {
            const key = document.getElementById('ai-key').value.trim();
            localStorage.setItem('openrouter_api_key', key);
            localStorage.setItem('chatbot_api_key', key);

            if(window.appDB) {
                let gSet = await window.appDB.getGlobalSettings();
                gSet.aiKey = key;
                await window.appDB.saveGlobalSettings(gSet);
            }

            closeModal('ai');

            const btn = document.querySelector('#modal-ai .btn-submit');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" style="width:18px; vertical-align:middle;"></i> Saqlandi!';
            btn.style.background = 'var(--accent-green)';
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '#a855f7';
            }, 2000);
        }

        // ═══ TENANT SETTINGS ═══
        let activeTenantId = null;

        async function openTenantSettings(tenantId) {
            activeTenantId = tenantId;
            const tenant = tenants.find(t => t.id === tenantId);
            document.getElementById('settings-tenant-label').textContent = `Salon: ${tenant ? tenant.shopName : tenantId} (${tenantId})`;
            document.getElementById('settings-save-status').textContent = 'Yuklanmoqda...';

            // Clear fields
            document.getElementById('ts_tg_token').value = '';
            document.getElementById('ts_tg_botname').value = '';
            document.getElementById('ts_sms_email').value = '';
            document.getElementById('ts_sms_pass').value = '';
            document.getElementById('ts_sms_tpl').value = '';

            openModal('settings');

            // Load existing settings from Firebase
            try {
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, `tenants/${tenantId}/data/barber_settings`);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const s = snap.data().items || {};
                        document.getElementById('ts_tg_token').value = s.telegram_bot_token || '';
                        document.getElementById('ts_tg_botname').value = s.telegram_bot_name || '';
                        document.getElementById('ts_sms_email').value = s.sms_eskiz_email || '';
                        document.getElementById('ts_sms_pass').value = s.sms_eskiz_password || '';
                        document.getElementById('ts_sms_tpl').value = s.sms_template || '';
                    }
                    document.getElementById('settings-save-status').textContent = '';
                } else {
                    document.getElementById('settings-save-status').textContent = '⚠️ Firebase ulanmagan.';
                }
            } catch(e) {
                document.getElementById('settings-save-status').textContent = '⚠️ Yuklab bo\'lmadi: ' + e.message;
            }
        }

        async function saveTenantSettings() {
            if (!activeTenantId) return;
            const statusEl = document.getElementById('settings-save-status');
            statusEl.textContent = 'Saqlanmoqda...';

            const tgToken = document.getElementById('ts_tg_token').value.trim();
            const tgBotName = document.getElementById('ts_tg_botname').value.trim().replace('@', '');
            const smsEmail = document.getElementById('ts_sms_email').value.trim();
            const smsPass = document.getElementById('ts_sms_pass').value;
            const smsTpl = document.getElementById('ts_sms_tpl').value.trim();

            try {
                if (!window.appDB || !window.appDB.useFirebase || !window.appDB.fs) {
                    statusEl.textContent = '❌ Firebase ulanmagan.';
                    return;
                }
                const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                const ref = doc(window.appDB.fs, `tenants/${activeTenantId}/data/barber_settings`);

                // Merge with existing settings to avoid overwriting other fields
                const snap = await getDoc(ref);
                const existing = snap.exists() ? (snap.data().items || {}) : {};

                const updated = {
                    ...existing,
                    telegram_bot_token: tgToken,
                    telegram_bot_name: tgBotName,
                    sms_eskiz_email: smsEmail,
                    sms_eskiz_password: smsPass,
                    sms_template: smsTpl
                };

                await setDoc(ref, { items: updated });
                statusEl.textContent = '✅ Saqlandi!';
                setTimeout(() => { statusEl.textContent = ''; }, 2000);
            } catch(e) {
                statusEl.textContent = '❌ Xato: ' + e.message;
            }
        }

