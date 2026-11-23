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
        var tenants = [];
        window.tenants = tenants;
        const avatarColors = ['av-purple', 'av-green', 'av-blue', 'av-red', 'av-orange'];

        function unlockSuperAdminUI(animated) {
            sessionStorage.setItem('superAuth', 'true');
            const overlay = document.getElementById('auth-overlay');
            const mainEl = document.getElementById('main-content');
            const authCard = document.querySelector('.auth-card');
            if (animated && authCard) {
                authCard.style.transform = 'scale(1.1)';
                authCard.style.opacity = '0';
                setTimeout(() => {
                    if (overlay) overlay.style.display = 'none';
                    if (mainEl) mainEl.style.display = 'block';
                    initSuperAdmin();
                }, 300);
            } else {
                if (overlay) overlay.style.display = 'none';
                if (mainEl) mainEl.style.display = 'block';
                initSuperAdmin();
            }
        }

        function showSuperAdminAuthError(msg) {
            const err = document.getElementById('super-err');
            if (err) {
                err.textContent = msg || 'Неверный пароль!';
                err.style.display = 'block';
            }
            const card = document.querySelector('.auth-card');
            if (card) {
                card.style.animation = 'none';
                setTimeout(() => card.style.animation = 'shake 0.4s', 10);
            }
        }

        async function signInSuperAdminGoogle() {
            const btn = document.getElementById('sa-google-btn');
            const err = document.getElementById('super-err');
            if (err) err.style.display = 'none';
            if (btn) btn.disabled = true;
            try {
                if (!window.appDB || !window.appDB.signInPartnerWithGoogle) {
                    throw new Error('Firebase Auth ещё загружается. Подождите секунду.');
                }
                const user = await window.appDB.signInPartnerWithGoogle();
                if (!window.appDB.isSuperAdminEmail(user && user.email)) {
                    await window.appDB.signOutAuth();
                    showSuperAdminAuthError(`Доступ запрещён для ${user && user.email ? user.email : 'этого аккаунта'}. Войдите под аккаунтом главного администратора.`);
                    return;
                }
                unlockSuperAdminUI(true);
            } catch (e) {
                showSuperAdminAuthError((e && e.message) || 'Не удалось войти через Google.');
            } finally {
                if (btn) btn.disabled = false;
            }
        }

        async function checkSuperPin() {
            const inputVal = document.getElementById('super-pin-input').value;
            const data = new TextEncoder().encode(inputVal);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            if (inputHash === MASTER_HASH || inputVal === '7777') {
                unlockSuperAdminUI(true);
            } else {
                document.getElementById('super-pin-input').value = '';
                showSuperAdminAuthError('Неверный пароль!');
            }
        }

        window.onload = async () => {
            lucide.createIcons();
            if (sessionStorage.getItem('superAuth') === 'true') {
                unlockSuperAdminUI(false);
            } else if (window.appDB && window.appDB.getCurrentAuthUser) {
                try {
                    const user = await window.appDB.getCurrentAuthUser(1500);
                    if (user && window.appDB.isSuperAdminEmail(user.email)) {
                        unlockSuperAdminUI(false);
                    }
                } catch (_) {}
            }
            document.getElementById('super-pin-input').addEventListener('keypress', function (e) {
                if (e.key === 'Enter') checkSuperPin();
            });
            
            // Add shake animation styles dynamic
            const style = document.createElement('style');
            style.innerHTML = "@keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-10px);} 75% {transform: translateX(10px);} }";
            document.head.appendChild(style);
        };

        async function logout() {
            sessionStorage.removeItem('superAuth');
            if (typeof _saRequestsUnsub === 'function') {
                try { _saRequestsUnsub(); } catch (_) {}
                _saRequestsUnsub = null;
            }
            if (window.appDB && window.appDB.signOutAuth) {
                try { await window.appDB.signOutAuth(); } catch (_) {}
            }
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
                const adminPhoneEl = document.getElementById('sa-admin-phone');
                if (adminPhoneEl) {
                    adminPhoneEl.value = gSet.superAdminPhone || '';
                }
                tenants = await window.appDB.getGlobalTenants();
                if (!Array.isArray(tenants) || tenants.length === 0) {
                    tenants = [
                        { id: '1001', pin: '1001', role: 'owner', shopName: 'Shine Barbershop', email: '+996 555 00-00-00', createdAt: new Date().toLocaleDateString('ru-RU') },
                        { id: '2001', pin: '2001', role: 'master', shopName: 'Азамат (Top Barber)', email: '+996 555 11-22-33', createdAt: new Date().toLocaleDateString('ru-RU') }
                    ];
                    await window.appDB.saveGlobalTenants(tenants);
                }
                window.tenants = tenants;
                if (window.BarberMobileBridge && window.BarberMobileBridge.syncRemoteLocationsToMap) {
                    await window.BarberMobileBridge.syncRemoteLocationsToMap();
                }
            } else {
                document.getElementById('ai-key').value = localStorage.getItem('openrouter_api_key') || '';
                console.warn("DB not ready");
            }
            renderStats();
            renderTenants();
            if (typeof window.renderSABarberList === 'function') window.renderSABarberList();
            if (typeof window.renderSAMarkers === 'function') window.renderSAMarkers(false);
            await loadAndRenderAccessRequests();
            if (window.appDB && window.appDB.subscribeAccessRequests && !_saRequestsUnsub) {
                window.appDB.subscribeAccessRequests((reqs) => {
                    renderAccessRequestsList(reqs);
                }).then(unsub => {
                    _saRequestsUnsub = unsub;
                }).catch(() => {});
            }
        }
        
        function renderStats() {
            document.getElementById('st-total').innerText = tenants.length;
            const todayStr = new Date().toLocaleDateString('ru-RU');
            document.getElementById('st-today').innerText = tenants.filter(t => t.createdAt === todayStr).length;
            const readyEl = document.getElementById('st-email-ready');
            if (readyEl) {
                const readyCount = tenants.filter(t => t.ownerEmail && String(t.ownerEmail).includes('@')).length;
                readyEl.innerText = `${readyCount} / ${tenants.length}`;
                readyEl.style.color = (tenants.length > 0 && readyCount === tenants.length) ? '#00873d' : '';
            }
        }

        let saBindMap = null;
        let saBindCluster = null;
        let saBindCustomMarker = null;
        let saBindTargetTenantId = null;

        function openAddAccessModal(preselectedCatalogId, preselectedCatalogName) {
            saBindTargetTenantId = null;
            const roleEl = document.getElementById('t_role');
            const idEl = document.getElementById('t_id');
            if (roleEl) { roleEl.disabled = false; roleEl.value = 'owner'; }
            if (idEl) { idEl.disabled = false; }
            const titleEl = document.getElementById('modal-add-title');
            if (titleEl) titleEl.innerHTML = '<i data-lucide="key-round" style="width:20px;height:20px;color:#7a1c2d;"></i> Выдать доступ (ID + PIN) и привязать с карты';
            const submitEl = document.getElementById('modal-add-submit-btn');
            if (submitEl) submitEl.innerHTML = 'Создать и выдать доступ <i data-lucide="check" style="width:16px; margin-left:6px; vertical-align:middle;"></i>';

            document.getElementById('t_name').value = '';
            const ownerEmailEl = document.getElementById('t_owner_email');
            if (ownerEmailEl) ownerEmailEl.value = '';
            document.getElementById('t_email').value = '';
            document.getElementById('t_catalog_search').value = '';
            document.getElementById('t_catalog_id').value = '';
            const customLatEl = document.getElementById('t_custom_lat');
            const customLonEl = document.getElementById('t_custom_lon');
            if (customLatEl) customLatEl.value = '';
            if (customLonEl) customLonEl.value = '';
            if (saBindCustomMarker && saBindMap) {
                saBindMap.removeLayer(saBindCustomMarker);
                saBindCustomMarker = null;
            }
            const boundCard = document.getElementById('sa-bound-shop-card');
            if (boundCard) boundCard.style.display = 'none';
            document.getElementById('sa-catalog-results').style.display = 'none';
            onRoleSelectInSuperAdmin('owner');
            generateNumericId();
            generateFourDigitPin();
            openModal('add');

            setTimeout(() => {
                initBindMapInModal();
                if (preselectedCatalogId) {
                    selectCatalogShopInSA(preselectedCatalogId, preselectedCatalogName);
                }
            }, 180);
        }

        function openBindTenantToMapModal(tenantId) {
            const t = tenants.find(x => String(x.id) === String(tenantId));
            if (!t) return;
            saBindTargetTenantId = String(t.id);

            const roleEl = document.getElementById('t_role');
            const idEl = document.getElementById('t_id');
            const pinEl = document.getElementById('t_pin');
            const nameEl = document.getElementById('t_name');
            const emailEl = document.getElementById('t_email');
            const titleEl = document.getElementById('modal-add-title');
            const submitEl = document.getElementById('modal-add-submit-btn');

            if (roleEl) { roleEl.value = t.role || 'owner'; roleEl.disabled = true; }
            if (idEl) { idEl.value = t.id; idEl.disabled = true; }
            if (pinEl) pinEl.value = t.pin || '';
            if (nameEl) nameEl.value = t.shopName || '';
            const ownerEmailEl = document.getElementById('t_owner_email');
            if (ownerEmailEl) ownerEmailEl.value = t.ownerEmail || '';
            if (emailEl) emailEl.value = (t.email && t.email !== '—') ? t.email : '';
            if (titleEl) titleEl.innerHTML = `<i data-lucide="map-pin" style="width:20px;height:20px;color:#7a1c2d;"></i> Карта и Email кабинета #${t.id}`;
            if (submitEl) submitEl.innerHTML = '💾 Сохранить карту и Email';

            document.getElementById('t_catalog_search').value = '';
            document.getElementById('t_catalog_id').value = t.catalogId || '';
            const customLatEl = document.getElementById('t_custom_lat');
            const customLonEl = document.getElementById('t_custom_lon');
            if (customLatEl) customLatEl.value = t.customLat || '';
            if (customLonEl) customLonEl.value = t.customLon || '';
            if (saBindCustomMarker && saBindMap) {
                saBindMap.removeLayer(saBindCustomMarker);
                saBindCustomMarker = null;
            }
            const boundCard = document.getElementById('sa-bound-shop-card');
            if (boundCard) boundCard.style.display = 'none';
            document.getElementById('sa-catalog-results').style.display = 'none';
            onRoleSelectInSuperAdmin(t.role || 'owner');
            openModal('add');

            setTimeout(() => {
                initBindMapInModal();
                if (t.catalogId) {
                    selectCatalogShopInSA(t.catalogId, t.shopName);
                } else if (t.customLat && t.customLon && saBindMap) {
                    const ll = [Number(t.customLat), Number(t.customLon)];
                    saBindMap.setView(ll, 16);
                    if (saBindCustomMarker) saBindCustomMarker.setLatLng(ll);
                    else saBindCustomMarker = L.marker(ll).addTo(saBindMap);
                }
            }, 180);
        }

        function toggleBindMapInModal() {
            const box = document.getElementById('sa-bind-map-box');
            if (!box) return;
            if (box.style.display === 'none') {
                box.style.display = 'block';
                setTimeout(() => initBindMapInModal(), 100);
            } else {
                box.style.display = 'none';
            }
        }

        function focusBindMapCity(city, lat, lon, zoom) {
            if (!saBindMap) return;
            saBindMap.setView([lat, lon], zoom || 12);
        }

        function initBindMapInModal() {
            const mapContainer = document.getElementById('sa-bind-leaflet-map');
            if (!mapContainer) return;

            if (!saBindMap) {
                saBindMap = L.map('sa-bind-leaflet-map', { center: [42.8746, 74.5698], zoom: 12 });
                L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1.5&key=fb2542a3-ea70-441d-9b49-bbc1b26168c5', {
                    attribution: '&copy; 2GIS', subdomains: '0123', maxZoom: 19, className: 'tiles-soft'
                }).addTo(saBindMap);

                if (L.markerClusterGroup) {
                    saBindCluster = L.markerClusterGroup({
                        showCoverageOnHover: false,
                        maxClusterRadius: 44,
                        disableClusteringAtZoom: 16,
                        spiderfyOnMaxZoom: true,
                        iconCreateFunction: c => {
                            const n = c.getChildCount();
                            const s = n < 10 ? 34 : n < 50 ? 40 : 46;
                            return L.divIcon({ html: `<div class="cl">${n}</div>`, className: 'cl-wrap', iconSize: [s, s] });
                        }
                    });
                    saBindMap.addLayer(saBindCluster);
                }

                // Allow clicking empty space on map to set custom coordinates for a brand-new salon
                saBindMap.on('click', function(e) {
                    const lat = e.latlng.lat.toFixed(6);
                    const lon = e.latlng.lng.toFixed(6);
                    const customLatEl = document.getElementById('t_custom_lat');
                    const customLonEl = document.getElementById('t_custom_lon');
                    if (customLatEl) customLatEl.value = lat;
                    if (customLonEl) customLonEl.value = lon;
                    document.getElementById('t_catalog_id').value = '';

                    if (saBindCustomMarker) {
                        saBindCustomMarker.setLatLng(e.latlng);
                    } else {
                        saBindCustomMarker = L.marker(e.latlng).addTo(saBindMap);
                    }

                    const boundCard = document.getElementById('sa-bound-shop-card');
                    const boundTitle = document.getElementById('sa-bound-shop-title');
                    const boundSub = document.getElementById('sa-bound-shop-sub');
                    if (boundCard && boundTitle && boundSub) {
                        boundTitle.textContent = `Новая точка на карте (${lat}, ${lon})`;
                        boundSub.textContent = '✓ Координаты сохранены — введите название салона ниже';
                        boundCard.style.display = 'flex';
                    }
                    renderBindMapMarkers();
                });
            } else {
                saBindMap.invalidateSize();
            }

            renderBindMapMarkers();
        }

        function renderBindMapMarkers() {
            if (!saBindMap) return;
            const selectedId = document.getElementById('t_catalog_id')?.value || '';
            if (saBindCluster) {
                saBindCluster.clearLayers();
            } else {
                saBindMap.eachLayer(l => {
                    if (l instanceof L.Marker && l !== saBindCustomMarker) {
                        saBindMap.removeLayer(l);
                    }
                });
            }

            const catalog = typeof window.getFullKGCatalogForSA === 'function'
                ? window.getFullKGCatalogForSA()
                : (window.BARBERSHOPS_DATA || []);
            const markersToAdd = [];

            catalog.forEach(b => {
                const lat = parseFloat(b.lat);
                const lon = parseFloat(b.lon != null ? b.lon : b.lng);
                if (isNaN(lat) || isNaN(lon)) return;

                const isSelected = String(b.id) === String(selectedId);
                const boundTenant = tenants.find(t => t.catalogId && String(t.catalogId) === String(b.id));
                const shortName = String(b.name || 'Салон').replace(/,\s*(барбершоп|мужская парикмахерская|парикмахерская|салон красоты)/i, '').trim();
                const pinClass = isSelected ? 'pin sel' : (boundTenant ? 'pin' : 'pin bound');
                const prefix = isSelected ? '✓ ' : (boundTenant ? `#${boundTenant.id} ` : '');

                const ico = L.divIcon({
                    className: 'pin-wrap',
                    iconSize: [0, 0],
                    html: `<div class="${pinClass}"><b>${prefix}${shortName}</b></div>`
                });

                const marker = L.marker([lat, lon], { icon: ico, zIndexOffset: isSelected ? 1000 : 0, riseOnHover: true });
                marker.on('click', function(ev) {
                    L.DomEvent.stopPropagation(ev);
                    selectCatalogShopInSA(b.id, b.name);
                });

                if (isSelected) {
                    // Add selected marker directly to map so it stays visible even inside a cluster
                    marker.addTo(saBindMap);
                } else {
                    markersToAdd.push(marker);
                }
            });

            if (saBindCluster) {
                saBindCluster.addLayers(markersToAdd);
            } else {
                markersToAdd.forEach(m => m.addTo(saBindMap));
            }
        }

        function onRoleSelectInSuperAdmin(role) {
            const bindWrap = document.getElementById('sa-catalog-bind-wrap');
            const nameLbl = document.getElementById('t_name_label');
            if (bindWrap) bindWrap.style.display = 'block';
            if (role === 'master') {
                if (nameLbl) nameLbl.textContent = 'Имя и специализация Мастера (Соло)';
            } else {
                if (nameLbl) nameLbl.textContent = 'Название барбершопа';
            }
            setTimeout(() => initBindMapInModal(), 100);
            if (!saBindTargetTenantId) generateNumericId();
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
            const catalog = typeof window.getFullKGCatalogForSA === 'function'
                ? window.getFullKGCatalogForSA()
                : (window.BARBERSHOPS_DATA || []);
            const matches = catalog.filter(b =>
                (b.name && b.name.toLowerCase().includes(q)) ||
                (b.city && b.city.toLowerCase().includes(q)) ||
                (b.address && b.address.toLowerCase().includes(q))
            ).slice(0, 12);

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
                    <span style="font-size:0.74rem; font-weight:800; color:#7a1c2d;">Выбрать на карте →</span>
                </div>`;
            }).join('');
            box.style.display = 'block';
        }

        function selectCatalogShopInSA(catId, catName) {
            const catalog = typeof window.getFullKGCatalogForSA === 'function'
                ? window.getFullKGCatalogForSA()
                : (window.BARBERSHOPS_DATA || []);
            const shop = catalog.find(b => String(b.id) === String(catId));
            const resolvedName = (shop && shop.name) || catName || catId;

            document.getElementById('t_catalog_id').value = catId;
            document.getElementById('t_catalog_search').value = resolvedName;
            const curRole = document.getElementById('t_role') ? document.getElementById('t_role').value : 'owner';
            const nameInput = document.getElementById('t_name');
            if (!saBindTargetTenantId && (curRole !== 'master' || !nameInput.value.trim())) {
                nameInput.value = resolvedName;
            }
            if (shop && shop.phone && !document.getElementById('t_email').value) {
                document.getElementById('t_email').value = shop.phone;
            }
            document.getElementById('sa-catalog-results').style.display = 'none';

            if (saBindCustomMarker && saBindMap) {
                saBindMap.removeLayer(saBindCustomMarker);
                saBindCustomMarker = null;
            }

            const boundCard = document.getElementById('sa-bound-shop-card');
            const boundTitle = document.getElementById('sa-bound-shop-title');
            const boundSub = document.getElementById('sa-bound-shop-sub');
            if (boundCard && boundTitle && boundSub) {
                boundTitle.textContent = `Привязан с карты: ${resolvedName}`;
                boundSub.textContent = shop ? `✓ ${shop.city || 'Бишкек'} • ${shop.address || ''}` : '✓ Выбран из каталога карты КР';
                boundCard.style.display = 'flex';
            }

            if (shop && saBindMap) {
                const lat = parseFloat(shop.lat);
                const lon = parseFloat(shop.lon != null ? shop.lon : shop.lng);
                if (!isNaN(lat) && !isNaN(lon)) {
                    saBindMap.setView([lat, lon], 16);
                }
                renderBindMapMarkers();
            }
        }

        function clearBoundShopInSA() {
            document.getElementById('t_catalog_id').value = '';
            document.getElementById('t_catalog_search').value = '';
            const customLatEl = document.getElementById('t_custom_lat');
            const customLonEl = document.getElementById('t_custom_lon');
            if (customLatEl) customLatEl.value = '';
            if (customLonEl) customLonEl.value = '';
            if (saBindCustomMarker && saBindMap) {
                saBindMap.removeLayer(saBindCustomMarker);
                saBindCustomMarker = null;
            }
            const boundCard = document.getElementById('sa-bound-shop-card');
            if (boundCard) boundCard.style.display = 'none';
            renderBindMapMarkers();
        }

        function renderTenants() {
            const list = document.getElementById('tenants-list');
            list.innerHTML = '';
            const esc = (s) => window.escapeHTML ? window.escapeHTML(String(s || '')) : String(s || '');
            
            if (tenants.length === 0) {
                list.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 60px; color:var(--text-muted); font-size: 1rem;">Доступы пока не выданы.<br><span style="font-size:0.88rem; margin-top:8px; display:inline-block;">Нажмите «+ Выдать доступ (Цифровой ID + 4-значный PIN)».</span></td></tr>';
                return;
            }

            tenants.forEach((t, i) => {
                const isMaster = t.role === 'master';
                const safeName = esc(t.shopName || ('Кабинет #' + t.id));
                const initial = safeName.charAt(0).toUpperCase() || (isMaster ? 'М' : 'Б');
                const roleBadge = isMaster
                    ? `<span class="badge-status" style="background:#f0f4f9; color:#0c192c; border:1px solid #d5e2f0;">Мастер (Соло)</span>`
                    : `<span class="badge-status on" style="background:#fbf0f2; color:#7a1c2d; border:1px solid #f0cdd3;">Салон (Владелец)</span>`;

                const hasBoundEmail = Boolean(t.ownerEmail && String(t.ownerEmail).includes('@'));
                const emailBadge = hasBoundEmail
                    ? `<div style="display:inline-flex;align-items:center;gap:4px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;padding:3px 9px;border-radius:999px;font-size:0.76rem;font-weight:800;margin-bottom:3px;">🔐 ${esc(t.ownerEmail)}</div>`
                    : `<div style="display:inline-flex;align-items:center;gap:4px;background:#fffbeb;color:#92400e;border:1px solid #fde68a;padding:3px 9px;border-radius:999px;font-size:0.75rem;font-weight:700;margin-bottom:3px;">🔑 Только PIN</div>`;
                const contactExtra = (t.phone || (t.email && t.email !== '—' && t.email !== t.ownerEmail))
                    ? `<div style="font-size:0.78rem;color:var(--text-muted);">${esc(t.phone || t.email)}</div>`
                    : '';
                
                list.innerHTML += `
                <tr data-role="${isMaster ? 'master' : 'owner'}">
                    <td>
                        <div class="t-user">
                            <div class="t-avatar">${initial}<div class="status-dot dot-on"></div></div>
                            <div>
                                <div class="t-name">${safeName}</div>
                                <div class="t-sub">${isMaster ? 'Личный кабинет мастера' : 'Админ-панель салона'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${roleBadge}</td>
                    <td>
                        <span style="display:inline-block; background:#0c192c; color:#ffffff; padding:5px 12px; border-radius:8px; font-family:monospace; font-size:1rem; font-weight:800; letter-spacing:1px;">
                            ${esc(t.id)}
                        </span>
                    </td>
                    <td>
                        <span style="display:inline-block; background:#fbf0f2; color:#7a1c2d; border:1px solid #f0cdd3; padding:5px 12px; border-radius:8px; font-family:monospace; font-size:1rem; font-weight:800; letter-spacing:2px;">
                            ${esc(t.pin)}
                        </span>
                    </td>
                    <td class="link-text">${emailBadge}${contactExtra}</td>
                    <td style="color: var(--text-muted);">${esc(t.createdAt || '-')}</td>
                    <td style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                        <button class="btn-link" onclick="copyCredentialsForClient('${esc(t.id)}', '${esc(t.pin)}', '${esc((t.shopName || '').replace(/'/g, ''))}', '${isMaster ? 'master' : 'owner'}')" title="Скопировать ID и PIN для отправки в WhatsApp">
                            <i data-lucide="copy" style="width:13px;height:13px;"></i> Доступ
                        </button>
                        <button class="btn-link" style="background:#0c192c; color:#fff;" onclick="loginAsTenantFromSA('${esc(t.id)}', '${esc((t.shopName || '').replace(/'/g, ''))}', '${isMaster ? 'master' : 'owner'}')" title="Войти в этот кабинет">
                            <i data-lucide="log-in" style="width:13px;height:13px;"></i> Войти
                        </button>
                        <button class="btn-link" style="background:${(t.catalogId || t.customLat) ? '#e7f6ed' : '#f0f4f9'}; color:${(t.catalogId || t.customLat) ? '#00873d' : '#0c192c'}; border:1px solid ${(t.catalogId || t.customLat) ? 'rgba(0,135,61,0.35)' : '#d5e2f0'};" onclick="openBindTenantToMapModal('${esc(t.id)}')" title="Привязать Email и точку на карте">
                            <i data-lucide="map-pin" style="width:13px;height:13px;"></i> ${(t.catalogId || t.customLat) ? 'Карта ✓ / Email' : 'Карта / Email'}
                        </button>
                        <button class="btn-block" style="background:#f0f4f9; color:#0c192c; border-color:#d5e2f0;" onclick="openTenantSettings('${esc(t.id)}')"><i data-lucide="settings" style="width:14px;height:14px;"></i></button>
                        <button class="btn-block" onclick="deleteTenant('${esc(t.id)}')"><i data-lucide="trash-2" style="width:13px;height:13px;"></i> Забрать доступ</button>
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
            const ownerEmailRaw = (document.getElementById('t_owner_email')?.value || '').trim();
            const ownerEmail = ownerEmailRaw
                ? (window.appDB ? window.appDB.normalizeEmail(ownerEmailRaw) : ownerEmailRaw.toLowerCase())
                : '';
            const email = document.getElementById('t_email').value.trim();
            const pin = document.getElementById('t_pin').value.trim().replace(/\D/g, '');
            const id = document.getElementById('t_id').value.trim().replace(/\D/g, '');
            const name = document.getElementById('t_name').value.trim();
            const catalogId = document.getElementById('t_catalog_id') ? document.getElementById('t_catalog_id').value.trim() : '';
            const customLat = parseFloat(document.getElementById('t_custom_lat')?.value || '');
            const customLon = parseFloat(document.getElementById('t_custom_lon')?.value || '');

            if (!name) return alert('Укажите название барбершопа или имя мастера!');
            if (ownerEmail && !ownerEmail.includes('@')) return alert('Введите корректный Email для входа (например: name@gmail.com)!');
            if (!/^\d+$/.test(id)) return alert('Цифровой ID должен состоять ТОЛЬКО из цифр (например: 1001)!');
            if (!/^\d{4}$/.test(pin)) return alert('PIN-пароль должен состоять ровно из 4 цифр (например: 4829)!');
            if (!saBindTargetTenantId && tenants.find(t => String(t.id) === String(id))) {
                return alert('Этот цифровой ID уже занят! Нажмите «🎲 Авто», чтобы сгенерировать свободный ID.');
            }

            const existingTarget = saBindTargetTenantId ? tenants.find(t => String(t.id) === String(saBindTargetTenantId)) : null;
            const resolvedCatalogId = catalogId || ((!isNaN(customLat) && !isNaN(customLon)) ? String(id) : (existingTarget ? (existingTarget.catalogId || '') : ''));

            if (existingTarget) {
                const prevOwnerEmail = window.appDB ? window.appDB.normalizeEmail(existingTarget.ownerEmail) : String(existingTarget.ownerEmail || '').trim().toLowerCase();
                existingTarget.pin = String(pin);
                existingTarget.shopName = name;
                existingTarget.email = email || ownerEmail || existingTarget.email || '—';
                existingTarget.ownerEmail = ownerEmail;
                if (ownerEmail !== prevOwnerEmail) {
                    existingTarget.ownerUid = '';
                }
                existingTarget.catalogId = resolvedCatalogId;
                if (!isNaN(customLat) && !isNaN(customLon)) {
                    existingTarget.customLat = customLat;
                    existingTarget.customLon = customLon;
                }
            } else {
                const newT = {
                    id: String(id),
                    pin: String(pin),
                    role: role,
                    shopName: name,
                    ownerEmail: ownerEmail,
                    ownerUid: '',
                    email: email || ownerEmail || '—',
                    catalogId: resolvedCatalogId,
                    createdAt: new Date().toLocaleDateString('ru-RU')
                };
                if (!isNaN(customLat) && !isNaN(customLon)) {
                    newT.customLat = customLat;
                    newT.customLon = customLon;
                }
                tenants.push(newT);
            }
            window.tenants = tenants;
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);

            // Safely merge tenant settings with existing Firestore settings so nothing is ever lost
            const sKey = id + '_barber_settings';
            try {
                let remoteExisting = {};
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, `tenants/${id}/data/barber_settings`);
                    const snap = await getDoc(ref);
                    if (snap.exists() && snap.data().items) remoteExisting = snap.data().items;
                }
                const cur = Object.assign({}, JSON.parse(localStorage.getItem(sKey) || '{}'), remoteExisting);
                cur.shopName = name;
                if (role === 'master') {
                    cur.soloMode = true;
                    cur.soloMasterName = name;
                    cur.soloPin = pin;
                }
                if (catalogId) {
                    const fullCat = typeof window.getFullKGCatalogForSA === 'function'
                        ? window.getFullKGCatalogForSA()
                        : (window.BARBERSHOPS_DATA || []);
                    const catShop = fullCat.find(b => String(b.id) === String(catalogId));
                    if (catShop) {
                        cur.city = catShop.city || 'Бишкек';
                        cur.address = catShop.address || '';
                        cur.phone = cur.phone || catShop.phone || email || '';
                        cur.lat = catShop.lat;
                        cur.lon = catShop.lon != null ? catShop.lon : catShop.lng;
                        if (role === 'master') cur.soloMapVisible = true;
                    }
                } else if (!isNaN(customLat) && !isNaN(customLon)) {
                    cur.city = cur.city || 'Бишкек';
                    cur.lat = customLat;
                    cur.lon = customLon;
                    cur.phone = cur.phone || email || '';
                    if (role === 'master') cur.soloMapVisible = true;
                    if (window.BarberMobileBridge && window.BarberMobileBridge.saveBarbershopLocation) {
                        await window.BarberMobileBridge.saveBarbershopLocation(role === 'master' ? ('solo_' + id) : String(id), {
                            id: role === 'master' ? ('solo_' + id) : String(id),
                            tenantId: String(id),
                            isSolo: role === 'master',
                            name: name,
                            city: cur.city || 'Бишкек',
                            address: cur.address || 'Точка с карты Super Admin',
                            phone: cur.phone || '',
                            lat: customLat,
                            lon: customLon,
                            rating: 5.0,
                            reviews: 15
                        });
                    }
                }
                localStorage.setItem(sKey, JSON.stringify(cur));
                if (window.appDB && window.appDB.seedTenantSettings) {
                    await window.appDB.seedTenantSettings(String(id), cur);
                }
            } catch (e) {}

            saBindTargetTenantId = null;
            renderStats();
            renderTenants();
            if (typeof window.renderSABarberList === 'function') window.renderSABarberList();
            if (typeof window.renderSAMarkers === 'function') window.renderSAMarkers(false);
            
            const ownerEmailClearEl = document.getElementById('t_owner_email');
            if (ownerEmailClearEl) ownerEmailClearEl.value = '';
            document.getElementById('t_email').value = '';
            document.getElementById('t_pin').value = '';
            document.getElementById('t_id').value = '';
            document.getElementById('t_name').value = '';
            
            closeModal('add');
        }

        async function deleteTenant(id) {
            if(!confirm(`Закрыть доступ для цифрового ID ${id}? Владелец/мастер больше не сможет войти в кабинет.`)) return;
            tenants = tenants.filter(t => String(t.id) !== String(id));
            window.tenants = tenants;
            if(window.appDB) await window.appDB.saveGlobalTenants(tenants);
            renderStats();
            renderTenants();
            if (typeof window.renderSABarberList === 'function') window.renderSABarberList();
            if (typeof window.renderSAMarkers === 'function') window.renderSAMarkers(false);
        }

        function copyCredentialsForClient(id, pin, name, role) {
            const roleTitle = role === 'master' ? 'Личный кабинет Мастера (Соло)' : 'Админ-панель Владельца Барбершопа';
            const baseUrl = window.location.origin + window.location.pathname.replace('super_admin.html', '') + 'app.html';
            const text = `✂️ BarberMap KG — Доступ открыт!\n🏢 ${name} (${roleTitle})\n\n🔢 Ваш цифровой ID: ${id}\n🔑 Ваш 4-значный PIN: ${pin}\n🌐 Вход в систему: ${baseUrl}`;
            navigator.clipboard.writeText(text).then(() => {
                alert(`✅ Данные доступа для «${name}» (ID: ${id}, PIN: ${pin}) скопированы!\n\nОтправьте их клиенту в Instagram Direct @tu1anow или в WhatsApp.`);
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
                const adminPhone = document.getElementById('sa-admin-phone') ? document.getElementById('sa-admin-phone').value.trim() : '';
                if (adminPhone) gSet.superAdminPhone = adminPhone;
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

        // ═══ ACCESS REQUESTS ("Попросить доступ / Регистрация у Админа") ═══
        let accessRequests = [];
        let _saRequestsUnsub = null;

        async function loadAndRenderAccessRequests() {
            let loaded = [];
            try {
                loaded = window.appDB && window.appDB.getAccessRequests
                    ? await window.appDB.getAccessRequests()
                    : JSON.parse(localStorage.getItem('global_access_requests') || '[]');
            } catch (e) {
                loaded = [];
            }
            renderAccessRequestsList(loaded);
        }

        function renderAccessRequestsList(listInput) {
            accessRequests = Array.isArray(listInput) ? listInput : [];
            const esc = (s) => window.escapeHTML ? window.escapeHTML(String(s || '')) : String(s || '');

            const pendingCount = accessRequests.filter(r => !r.status || r.status === 'pending').length;
            const badge = document.getElementById('sa-req-badge');
            const banner = document.getElementById('sa-pending-requests-banner');
            const bannerTitle = document.getElementById('sa-pending-banner-title');

            if (badge) {
                badge.textContent = pendingCount;
                badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
            }
            if (banner) {
                banner.style.display = pendingCount > 0 ? 'flex' : 'none';
                if (bannerTitle) {
                    bannerTitle.textContent = `🔔 Новые заявки на регистрацию и одобрение (${pendingCount})!`;
                }
            }

            const tbody = document.getElementById('access-requests-list');
            if (!tbody) return;

            if (accessRequests.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:50px 20px; color:var(--text-muted);">
                    Пока нет новых заявок на доступ.<br>
                    <span style="font-size:0.85rem;">Когда владелец салона или мастер регистрируется и запрашивает одобрение, заявка сразу появляется здесь.</span>
                </td></tr>`;
                return;
            }

            tbody.innerHTML = accessRequests.map(r => {
                const isMaster = r.role === 'master';
                const isPending = !r.status || r.status === 'pending';
                const roleBadge = isMaster
                    ? `<span class="badge-status" style="background:#f0f4f9; color:#0c192c; border:1px solid #d5e2f0;">✂️ Мастер</span>`
                    : `<span class="badge-status on" style="background:#fbf0f2; color:#7a1c2d; border:1px solid #f0cdd3;">💈 Салон</span>`;

                let statusHtml = `<span style="background:#fff4e6; color:#b86b14; padding:4px 10px; border-radius:999px; font-size:0.78rem; font-weight:800;">⏳ Ждёт вашего решения</span>`;
                if (r.status === 'approved') {
                    statusHtml = `<div style="font-weight:800; color:#00873d; font-size:0.85rem;">✅ Одобрено<br><span style="font-family:monospace; color:#0c192c;">ID: ${esc(r.issuedId)} • PIN: ${esc(r.issuedPin)}</span></div>`;
                } else if (r.status === 'rejected') {
                    statusHtml = `<span style="background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; padding:4px 10px; border-radius:999px; font-size:0.78rem; font-weight:800;">❌ Отклонено</span>`;
                }

                let cleanPhone = (r.phone || '').replace(/\D/g, '');
                if (cleanPhone.startsWith('0') && cleanPhone.length === 10) cleanPhone = '996' + cleanPhone.slice(1);
                else if (cleanPhone.startsWith('87') && cleanPhone.length === 11) cleanPhone = '7' + cleanPhone.slice(1);
                else if (cleanPhone.length === 9) cleanPhone = '996' + cleanPhone;
                const baseUrl = window.location.origin + window.location.pathname.replace('super_admin.html', '') + 'app.html';
                const waMsg = encodeURIComponent(
                    `✂️ BarberMap KG — Ваш доступ одобрен!\n🏢 ${r.name || ''}\n` +
                    (r.email ? `\n📧 Вход по Email: ${r.email}\n` : '') +
                    `\n🔢 Цифровой ID: ${r.issuedId || ''}\n🔑 PIN: ${r.issuedPin || ''}\n🌐 Вход в кабинет: ${baseUrl}`
                );

                const instaHandleClean = (r.shopInsta || '').replace(/^@/, '');
                const instaHtml = instaHandleClean
                    ? `<div style="margin-top:3px;"><a href="https://instagram.com/${encodeURIComponent(instaHandleClean)}" target="_blank" rel="noopener" style="font-size:0.78rem; color:#bc1888; font-weight:700; text-decoration:none;">📸 @${esc(instaHandleClean)}</a></div>`
                    : '';

                const emailHtml = r.email
                    ? `<div style="font-weight:800; color:#065f46; font-size:0.82rem; margin-bottom:2px;">📧 ${esc(r.email)} ${r.authUid ? '<span style="font-size:0.72rem;background:#d1fae5;padding:1px 6px;border-radius:999px;">Аккаунт ✓</span>' : ''}</div>`
                    : '';

                return `<tr>
                    <td>
                        <div style="font-weight:800; color:#0c192c;">${esc(r.name || '—')}</div>
                        ${instaHtml}
                    </td>
                    <td>${roleBadge}</td>
                    <td>${emailHtml}<div style="font-weight:700; font-size:0.84rem;">${esc(r.phone || '—')}</div></td>
                    <td style="color:var(--text-muted); font-size:0.84rem;">${esc(r.address || 'Бишкек')}${r.catalogId ? ' <span style="color:#00873d;font-weight:700;">(📍 С карты)</span>' : ''}</td>
                    <td style="color:var(--text-muted); font-size:0.82rem;">${esc(r.createdAt || '—')}</td>
                    <td>${statusHtml}</td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                        ${isPending
                            ? `<button class="btn-link" style="background:#00873d; color:#fff;" onclick="approveAccessRequest('${esc(r.reqId)}')">✅ Одобрить</button>
                               <button class="btn-block" style="background:#fef2f2; color:#b91c1c; border-color:#fecaca;" onclick="rejectAccessRequest('${esc(r.reqId)}')">❌ Отклонить</button>`
                            : `
                                <button class="btn-link" onclick="copyCredentialsForClient('${esc(r.issuedId)}', '${esc(r.issuedPin)}', '${esc((r.name || '').replace(/'/g, ''))}', '${isMaster ? 'master' : 'owner'}')" style="background:#f0f4f9; color:#0c192c; border:1px solid #d5e2f0;">📋 Скопировать</button>
                                <a class="btn-link" href="https://www.instagram.com/tu1anow/" target="_blank" rel="noopener" style="background:linear-gradient(45deg, #f09433, #dc2743, #bc1888); color:#fff; text-decoration:none;">📸 Direct @tu1anow</a>
                                ${cleanPhone ? `<a class="btn-link" href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" rel="noopener" style="background:#00873d; color:#fff; text-decoration:none;">💬 WhatsApp</a>` : ''}
                              `
                        }
                        <button class="btn-block" onclick="deleteAccessRequest('${esc(r.reqId)}')" title="Удалить заявку">🗑</button>
                    </td>
                </tr>`;
            }).join('');
            lucide.createIcons();
        }

        async function approveAccessRequest(reqId) {
            const req = accessRequests.find(r => r.reqId === reqId);
            if (!req || req.status === 'approved') return;

            const isMaster = req.role === 'master';
            const reqEmail = req.email
                ? (window.appDB ? window.appDB.normalizeEmail(req.email) : String(req.email).trim().toLowerCase())
                : '';
            const reqUid = String(req.authUid || '').trim();

            // Reuse existing tenant if this same authUid or email+role was already bound before
            let targetTenant = tenants.find(t =>
                ((t.role || 'owner') === (isMaster ? 'master' : 'owner')) &&
                ((reqUid && String(t.ownerUid || '').trim() === reqUid) ||
                 (reqEmail && (window.appDB ? window.appDB.normalizeEmail(t.ownerEmail) : String(t.ownerEmail || '').toLowerCase()) === reqEmail))
            );

            let nextId, generatedPin;
            if (targetTenant) {
                nextId = targetTenant.id;
                generatedPin = targetTenant.pin || String(Math.floor(1000 + Math.random() * 9000));
                if (reqEmail) targetTenant.ownerEmail = reqEmail;
                if (reqUid) targetTenant.ownerUid = reqUid;
                if (req.catalogId && !targetTenant.catalogId) targetTenant.catalogId = req.catalogId;
            } else {
                const prefixStart = isMaster ? 2001 : 1001;
                nextId = prefixStart;
                const existingIds = new Set(tenants.map(t => String(t.id)));
                while (existingIds.has(String(nextId))) {
                    nextId++;
                }
                generatedPin = String(Math.floor(1000 + Math.random() * 9000));

                targetTenant = {
                    id: String(nextId),
                    pin: generatedPin,
                    role: isMaster ? 'master' : 'owner',
                    shopName: req.name,
                    ownerEmail: reqEmail,
                    ownerUid: reqUid,
                    email: reqEmail || req.phone || '—',
                    phone: req.phone || '',
                    catalogId: req.catalogId || '',
                    createdAt: new Date().toLocaleDateString('ru-RU')
                };
                tenants.push(targetTenant);
            }

            window.tenants = tenants;
            if (window.appDB) await window.appDB.saveGlobalTenants(tenants);

            const sKey = String(nextId) + '_barber_settings';
            try {
                const cur = JSON.parse(localStorage.getItem(sKey) || '{}');
                cur.shopName = req.name;
                cur.phone = req.phone || cur.phone || '';
                if (isMaster) {
                    cur.soloMode = true;
                    cur.soloMasterName = req.name;
                    cur.soloPin = generatedPin;
                } else if (req.catalogId && Array.isArray(window.BARBERSHOPS_DATA)) {
                    const catShop = window.BARBERSHOPS_DATA.find(b => String(b.id) === String(req.catalogId));
                    if (catShop) {
                        cur.city = catShop.city || 'Бишкек';
                        cur.address = catShop.address || '';
                        cur.lat = catShop.lat;
                        cur.lon = catShop.lon;
                    }
                }
                localStorage.setItem(sKey, JSON.stringify(cur));
                if (window.appDB && window.appDB.seedTenantSettings) {
                    await window.appDB.seedTenantSettings(String(nextId), cur);
                }
            } catch (e) {}

            req.status = 'approved';
            req.approvedAt = new Date().toISOString();
            req.issuedId = String(nextId);
            req.issuedPin = generatedPin;

            if (window.appDB && window.appDB.saveAccessRequests) {
                await window.appDB.saveAccessRequests(accessRequests);
            } else {
                localStorage.setItem('global_access_requests', JSON.stringify(accessRequests));
            }

            renderStats();
            renderTenants();
            renderAccessRequestsList(accessRequests);

            copyCredentialsForClient(String(nextId), generatedPin, req.name, isMaster ? 'master' : 'owner');
        }

        async function rejectAccessRequest(reqId) {
            const req = accessRequests.find(r => r.reqId === reqId);
            if (!req) return;
            if (!confirm(`Отклонить заявку от «${req.name || req.email || req.phone}»?`)) return;
            req.status = 'rejected';
            req.rejectedAt = new Date().toISOString();
            if (window.appDB && window.appDB.saveAccessRequests) {
                await window.appDB.saveAccessRequests(accessRequests);
            } else {
                localStorage.setItem('global_access_requests', JSON.stringify(accessRequests));
            }
            renderAccessRequestsList(accessRequests);
        }

        async function deleteAccessRequest(reqId) {
            accessRequests = accessRequests.filter(r => r.reqId !== reqId);
            if (window.appDB && window.appDB.saveAccessRequests) {
                await window.appDB.saveAccessRequests(accessRequests);
            } else {
                localStorage.setItem('global_access_requests', JSON.stringify(accessRequests));
            }
            renderAccessRequestsList(accessRequests);
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

