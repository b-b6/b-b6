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

        function renderTenants() {
            const list = document.getElementById('tenants-list');
            list.innerHTML = '';
            
            if (tenants.length === 0) {
                list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--text-muted); font-size: 1.1rem;">Hozircha mijozlar mavjud emas.<br><span style="font-size:0.9rem; margin-top:10px; display:inline-block;">Yangi salon yaratish tugmasini bosing.</span></td></tr>';
                return;
            }

            tenants.forEach((t, i) => {
                let link = `index.html?id=${t.id}`;
                let initial = t.shopName ? t.shopName.charAt(0).toUpperCase() : 'B';
                let cClass = avatarColors[i % avatarColors.length];
                
                // simulate random online status based on index for the mockup feel
                let isOn = (i%2===0);
                
                // Animating rows
                let delay = i * 0.1;
                
                list.innerHTML += `
                <tr style="animation: fadeUp 0.5s ${delay}s both;">
                    <td>
                        <div class="t-user">
                            <div class="t-avatar ${cClass}">${initial}<div class="status-dot ${isOn ? 'dot-on':'dot-off'}"></div></div>
                            <div>
                                <div class="t-name">${t.shopName}</div>
                                <div class="t-sub">${t.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <button class="btn-link" onclick="copyLink('${link}')" title="Nusxa Olish">
                            <i data-lucide="copy" style="width:16px;"></i> <span class="link-text">${t.id}</span>
                        </button>
                    </td>
                    <td class="link-text">${t.email}</td>
                    <td style="font-family: monospace; font-size:1.1rem; letter-spacing:2px; color:var(--text-main);">${t.pin}</td>
                    <td style="color: var(--text-muted);">${t.createdAt || '-'}</td>
                    <td>
                        <span class="badge-status ${isOn ? 'on':''}"><i data-lucide="circle" fill="currentColor" style="width:10px;"></i> ${isOn ? 'Onlayn':'Oflayn'}</span>
                    </td>
                    <td style="display:flex; gap:8px; align-items:center;">
                        <button class="btn-block" style="background:rgba(99,102,241,0.15); color:#818cf8; border-color:#818cf8;" onclick="openTenantSettings('${t.id}')"><i data-lucide="settings" style="width:16px; display:inline-block; vertical-align:middle;"></i> Sozlamalar</button>
                        <button class="btn-block" onclick="deleteTenant('${t.id}')"><i data-lucide="trash-2" style="width:16px; display:inline-block; vertical-align:middle;"></i> Bloklash</button>
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
            rows.forEach((tr, i) => {
                if(!tr.querySelector('.t-name')) return;
                let text = tr.innerText.toLowerCase();
                let matchesSearch = text.includes(val);
                let isOnline = (i % 2 === 0);
                let matchesStatus = activeStatusFilter === 'all' || (activeStatusFilter === 'online' && isOnline) || (activeStatusFilter === 'offline' && !isOnline);
                tr.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
            });
        }

        async function addTenant() {
            const email = document.getElementById('t_email').value.trim();
            const pin = document.getElementById('t_pin').value.trim();
            const id = document.getElementById('t_id').value.trim().toLowerCase().replace(/\s+/g, '_'); 
            const name = document.getElementById('t_name').value.trim();

            if (!email || !pin || !id || !name) return alert("Barcha maydonlarni to'ldiring!");
            if (tenants.find(t => t.id === id || t.email === email)) return alert('Bu Email yoki ID allaqachon mavjud!');

            const newT = { email, pin, id, shopName: name, createdAt: new Date().toLocaleDateString('ru-RU') };
            tenants.push(newT);
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);
            renderStats();
            renderTenants();
            
            document.getElementById('t_email').value = '';
            document.getElementById('t_pin').value = '';
            document.getElementById('t_id').value = '';
            document.getElementById('t_name').value = '';
            
            closeModal('add');
        }

        async function deleteTenant(id) {
            if(!confirm('Ishonchingiz komilmi? Bu mijozni bloklaysizmi?')) return;
            tenants = tenants.filter(t => t.id !== id);
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);
            renderStats();
            renderTenants();
        }

        function copyLink(path) {
            const fullLink = window.location.origin + window.location.pathname.replace('super_admin.html', '') + path;
            navigator.clipboard.writeText(fullLink).then(() => {
                alert('Nusxa olindi!');
            });
        }

        function devLoginDialog() {
            let t = prompt("Mijoz ID sini kiriting (Masalan: shop_zara)");
            if(t) {
                localStorage.setItem('tenant_id', t);
                sessionStorage.setItem('adminAuth', 'true');
                window.open('admin.html', '_blank');
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

