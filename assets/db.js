// Barber Real-time Database Layer (Hybrid Firebase / LocalStorage SaaS Model)

window.escapeHTML = function(str) {
    if(typeof str !== 'string' || !str) return str;
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
    );
};
class BarberDB {
    constructor() {
        this.listeners = new Map();
        
        // Multi-tenant configuration
        const urlParams = new URLSearchParams(window.location.search);
        let urlTenant = urlParams.get('shop') || urlParams.get('id') || urlParams.get('tgWebAppStartParam');

        // Parse Telegram location hash (#tgWebAppData=...&tgWebAppStartParam=...)
        if (!urlTenant && window.location.hash) {
            try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                urlTenant = hashParams.get('tgWebAppStartParam') || hashParams.get('startapp') || hashParams.get('start_param');
            } catch(e) {}
        }

        // Check Telegram WebApp SDK start_param fallback
        if (!urlTenant && typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const tgStart = window.Telegram.WebApp.initDataUnsafe.start_param;
            if (tgStart) {
                urlTenant = tgStart.replace(/^shop_/, '');
            }
        }

        const urlShopName = urlParams.get('shopName') || '';
        this.rawUrlTenant = urlTenant || '';
        this.urlShopName = urlShopName;

        if (urlTenant) {
            try {
                const globalTenants = JSON.parse(localStorage.getItem('global_saas_tenants') || '[]');
                urlTenant = this._resolveTenantIdFromCatalog(urlTenant, urlShopName, globalTenants);
            } catch (e) {}
            this.tenantId = urlTenant;
            try { localStorage.setItem('tenant_id', urlTenant); } catch(e) {}
        } else {
            this.tenantId = localStorage.getItem('tenant_id') || 'markazibarbershop1';
        }
        this.useFirebase = false;
        this.fs = null; // Firestore reference
        
        this.collections = {
            bookings: 'barber_bookings',
            masters: 'barber_masters',
            services: 'barber_services',
            settings: 'barber_settings',
            products: 'barber_products',
            reviews: 'barber_reviews'
        };
        
        // Support cross-tab sync for LocalStorage mode
        window.addEventListener('storage', (e) => {
            if(!this.useFirebase && e.key && e.key.startsWith(this.tenantId)) {
                const type = e.key.replace(this.tenantId + '_', '');
                this._notifyListeners(type);
            }
        });
        
        this.initPromise = this._initFirebase();
    }
    
    _resolveTenantIdFromCatalog(rawTenant, urlShopName, tenantsList) {
        if (!rawTenant || !Array.isArray(tenantsList) || tenantsList.length === 0) return rawTenant;
        const rawStr = String(rawTenant).trim();
        const shopStr = String(urlShopName || '').trim();
        const shopLower = shopStr.toLowerCase();

        // 1. Exact tenant ID match
        const exact = tenantsList.find(t => String(t.id) === rawStr);
        if (exact && exact.id) return String(exact.id);

        // 2. Bound catalogId match
        const byCat = tenantsList.find(t => t.catalogId && String(t.catalogId) === rawStr);
        if (byCat && byCat.id) return String(byCat.id);

        // 3. URL shopName matches a tenant ID (e.g. ?id=shop_179...&shopName=0203) or tenant shopName
        if (shopStr) {
            const byShopId = tenantsList.find(t => String(t.id) === shopStr);
            if (byShopId && byShopId.id) return String(byShopId.id);

            const byShopTitle = tenantsList.find(t => t.shopName && String(t.shopName).trim().toLowerCase() === shopLower);
            if (byShopTitle && byShopTitle.id) return String(byShopTitle.id);
        }

        // 4. Check custom map locations & BARBERSHOPS_DATA for point name matching tenant ID or shopName
        try {
            const customLocs = JSON.parse(localStorage.getItem('barber_custom_map_locations') || '{}');
            const locObj = customLocs[rawStr] || (Array.isArray(window.BARBERSHOPS_DATA) ? window.BARBERSHOPS_DATA.find(s => String(s.id) === rawStr) : null);
            if (locObj && locObj.name) {
                const locName = String(locObj.name).trim();
                const locLower = locName.toLowerCase();
                const byLocId = tenantsList.find(t => String(t.id) === locName);
                if (byLocId && byLocId.id) return String(byLocId.id);

                const byLocTitle = tenantsList.find(t => t.shopName && String(t.shopName).trim().toLowerCase() === locLower);
                if (byLocTitle && byLocTitle.id) return String(byLocTitle.id);
            }
        } catch (e) {}

        return rawStr;
    }

    async _initFirebase() {
        const configStr = `{
            "apiKey": "AIzaSyDQvE3XhMCae6rmpYMhmTA057KG0CuT0t4",
            "authDomain": "barberuz-1a897.firebaseapp.com",
            "projectId": "barberuz-1a897",
            "storageBucket": "barberuz-1a897.firebasestorage.app",
            "messagingSenderId": "69731333006",
            "appId": "1:69731333006:web:0ab8c1feefa9b76234eadf",
            "measurementId": "G-ZW0TBKREBH"
        }`;
        
        // Timeout: if Firebase doesn't connect in 5s, fall back to localStorage
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase connection timeout (5s)')), 5000));
        
        try {
            const firebaseInit = (async () => {
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
                const { getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                this.fsTools = { doc, setDoc, getDoc, onSnapshot, runTransaction };
                
                const config = JSON.parse(configStr);
                const app = initializeApp(config);
                this.fs = getFirestore(app);
                this.app = app;
                
                // Verify connection with a test read and sync global tenants for catalogId -> numeric tenantId resolution
                const testRef = doc(this.fs, `global/saas`);
                const testSnap = await Promise.race([
                    getDoc(testRef),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore read timeout')), 5000))
                ]);
                if (testSnap && testSnap.exists() && Array.isArray(testSnap.data().tenants)) {
                    const remoteTenants = testSnap.data().tenants;
                    try { localStorage.setItem('global_saas_tenants', JSON.stringify(remoteTenants)); } catch (e) {}
                    const resolved = this._resolveTenantIdFromCatalog(this.rawUrlTenant || this.tenantId, this.urlShopName, remoteTenants);
                    if (resolved && resolved !== this.tenantId) {
                        this.tenantId = String(resolved);
                        try { localStorage.setItem('tenant_id', this.tenantId); } catch (e) {}
                    }
                }
                
                this.useFirebase = true;
                console.log("🔥 Firebase SaaS Connected (Tenant:", this.tenantId, ")");
            })();
            
            await Promise.race([firebaseInit, timeout]);
        } catch(e) {
            this.useFirebase = false;
            console.warn("⚠️ Firebase offline/timeout. Using localStorage.", e.message);
        }
    }

    async _get(type, fallback = []) {
        await this.initPromise;
        if (this.useFirebase) {
            try {
                const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);
                const snap = await Promise.race([
                    this.fsTools.getDoc(docRef),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('Read timeout')), 5000))
                ]);
                if (snap.exists()) {
                    const data = snap.data().items || fallback;
                    // Cache to localStorage for offline fallback
                    try { localStorage.setItem(`${this.tenantId}_${type}_cache`, JSON.stringify(data)); } catch(e) {}
                    return data;
                }
                return fallback;
            } catch(e) {
                console.warn('⚠️ Firebase read failed, trying localStorage cache:', e.message);
                let cached = localStorage.getItem(`${this.tenantId}_${type}_cache`) || localStorage.getItem(`${this.tenantId}_${type}`);
                if(!cached) cached = localStorage.getItem(type);
                return cached ? JSON.parse(cached) : fallback;
            }
        } else {
            return new Promise(resolve => {
                setTimeout(() => {
                    let d = localStorage.getItem(`${this.tenantId}_${type}`);
                    if(!d) d = localStorage.getItem(type); // Backward compatibility reading old keys
                    resolve(d ? JSON.parse(d) : fallback);
                }, 50);
            });
        }
    }


    async _save(type, data) {
        await this.initPromise;
        if (this.useFirebase) {
            try {
                const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);
                // Timeout for save — if it takes too long, save locally as fallback
                await Promise.race([
                    this.fsTools.setDoc(docRef, { items: data }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('Save timeout')), 5000))
                ]);
                return true;
            } catch(e) {
                console.warn('⚠️ Firebase save failed, saving to localStorage:', e.message);
                localStorage.setItem(`${this.tenantId}_${type}`, JSON.stringify(data));
                this._notifyListeners(type);
                return true;
            }
        } else {
            localStorage.setItem(`${this.tenantId}_${type}`, JSON.stringify(data));
            this._notifyListeners(type); // Notify own tab as well
            return true;
        }
    }

    async subscribe(type, callback) {
        await this.initPromise;
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);

        if (this.useFirebase) {
            const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);
            this.fsTools.onSnapshot(docRef, (doc) => {
                let data;
                if (doc.exists()) {
                    data = doc.data().items;
                    // If items is undefined/null, determine fallback by type
                    if (data === undefined || data === null) {
                        data = (type === this.collections.settings) ? {} : [];
                    }
                } else {
                    data = (type === this.collections.settings) ? {} : [];
                }
                this.listeners.get(type).forEach(cb => cb(data));
            }, (error) => {
                console.warn('⚠️ onSnapshot error for', type, error.message);
            });
        } else {
            this._get(type).then(data => callback(data));
        }
    }

    async _notifyListeners(type) {
        if (this.listeners.has(type)) {
            this._get(type).then(data => {
                this.listeners.get(type).forEach(cb => cb(data));
            });
        }
    }

    // Specific Getters
    async getBookings() { return this._get(this.collections.bookings, []); }
    async getMasters() { return this._get(this.collections.masters, []); } 
    async getServices() { return this._get(this.collections.services, []); }
    async getSettings() { return this._get(this.collections.settings, {}); }
    async getProducts() { return this._get(this.collections.products, []); }
    async getReviews() { return this._get(this.collections.reviews, []); }

    // Specific Setters
    async saveBookings(data) { return this._save(this.collections.bookings, data); }
    _sanitizeBookingEntry(entry) {
        const o = { ...entry };
        if (typeof o.name === 'string') o.name = window.escapeHTML(o.name.trim());
        if (typeof o.phone === 'string') o.phone = window.escapeHTML(o.phone.trim());
        if (o.comment && typeof o.comment === 'string') o.comment = window.escapeHTML(o.comment);
        if (!o.timestamp) o.timestamp = new Date().toISOString();
        return o;
    }

    /**
     * Атомарное добавление записи: проверка слота совпадает с UI + транзакция Firestore против гонок.
     */
    async commitNewBooking(rawEntry, ctx) {
        await this.initPromise;
        const BL = typeof window !== 'undefined' ? window.BookingLogic : null;
        if (!BL) throw Object.assign(new Error('BookingLogic module missing'), { code: 'NO_LOGIC' });

        const type = this.collections.bookings;
        const safe = this._sanitizeBookingEntry(rawEntry);
        const cand = {
            date: safe.date,
            time: safe.time,
            masterId: safe.masterId,
            serviceKey: safe.serviceKey,
            name: safe.name,
            phone: safe.phone
        };

        if (!ctx || !ctx.masters || !ctx.services || !ctx.settings) {
            throw Object.assign(new Error('commitNewBooking requires ctx: { masters, services, settings }'), { code: 'BAD_CTX' });
        }

        if (!this.useFirebase) {
            const all = await this.getBookings();
            const err = BL.validateNewBooking(all, cand, ctx);
            if (err) {
                const e = err === 'SLOT_TAKEN'
                    ? new Error('Выбранное время только что заняли.')
                    : new Error(typeof err === 'string' ? err : 'Не удалось создать запись');
                e.code = err;
                throw e;
            }

            // Умная групповая бронь: 1-я и 2-я запись подтверждаются сразу, 3-я и 4-я требуют подтверждения админа
            const activeCount = BL.getActiveBookingsForPhone(all, safe.phone).length;
            if (activeCount >= 2 && !ctx.allowAdminBypass) {
                safe.status = 'pending_confirmation';
                safe.isGroupBooking = true;
                safe.groupIndex = activeCount + 1;
            } else if (!safe.status) {
                safe.status = 'confirmed';
            }

            all.push(safe);
            await this._save(type, all);
            return { ok: true, items: all, entry: safe };
        }

        const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);

        await this.fsTools.runTransaction(this.fs, async (transaction) => {
            const snap = await transaction.get(docRef);
            let items = snap.exists() ? (snap.data().items || []) : [];
            if (!Array.isArray(items)) items = [];

            const err = BL.validateNewBooking(items, cand, ctx);
            if (err) {
                const e = err === 'SLOT_TAKEN'
                    ? new Error('Выбранное время только что заняли.')
                    : new Error(typeof err === 'string' ? err : 'Не удалось создать запись');
                e.code = err;
                throw e;
            }

            const activeCount = BL.getActiveBookingsForPhone(items, safe.phone).length;
            if (activeCount >= 2 && !ctx.allowAdminBypass) {
                safe.status = 'pending_confirmation';
                safe.isGroupBooking = true;
                safe.groupIndex = activeCount + 1;
            } else if (!safe.status) {
                safe.status = 'confirmed';
            }

            transaction.set(docRef, { items: [...items, safe] });
        });

        let finalItems = await this._get(type, []);
        return { ok: true, items: finalItems, entry: safe };
    }

    async addBooking(booking) {
        if(booking.name) booking.name = window.escapeHTML(booking.name);
        if(booking.phone) booking.phone = window.escapeHTML(booking.phone);
        if(booking.comment) booking.comment = window.escapeHTML(booking.comment);
        
        let all = await this.getBookings();
        all.push(booking);
        return this.saveBookings(all);
    }
    async saveMasters(data) { return this._save(this.collections.masters, data); }
    async saveServices(data) { return this._save(this.collections.services, data); }
    async saveSettings(data) { return this._save(this.collections.settings, data); }
    async saveProducts(data) { return this._save(this.collections.products, data); }
    async saveReviews(data) { return this._save(this.collections.reviews, data); }

    // --- SaaS GLOBAL ARCHITECTURE ---
    async getGlobalTenants() {
        await this.initPromise;
        let localList = [];
        try {
            localList = JSON.parse(localStorage.getItem('global_saas_tenants') || '[]');
        } catch (e) {}

        if (!this.useFirebase) return localList;
        try {
            const docRef = this.fsTools.doc(this.fs, `global/saas`);
            const snap = await Promise.race([
                this.fsTools.getDoc(docRef),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global tenants read timeout')), 5000))
            ]);
            const remoteList = snap.exists() ? (snap.data().tenants || []) : [];
            if (remoteList.length > 0) {
                try { localStorage.setItem('global_saas_tenants', JSON.stringify(remoteList)); } catch (e) {}
                return remoteList;
            }
            return localList;
        } catch(e) {
            console.warn('⚠️ getGlobalTenants failed:', e.message);
            return localList;
        }
    }

    async saveGlobalTenants(tenantsList) {
        await this.initPromise;
        try {
            localStorage.setItem('global_saas_tenants', JSON.stringify(tenantsList));
        } catch (e) {}
        if(!this.useFirebase) { return true; }
        try {
            const docRef = this.fsTools.doc(this.fs, `global/saas`);
            await Promise.race([
                this.fsTools.setDoc(docRef, { tenants: tenantsList }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global tenants save timeout')), 5000))
            ]);
            return true;
        } catch(e) {
            console.warn('⚠️ saveGlobalTenants failed:', e.message);
            return true;
        }
    }

    async getGlobalSettings() {
        await this.initPromise;
        if(!this.useFirebase) return JSON.parse(localStorage.getItem('global_saas_settings') || '{}');
        try {
            const docRef = this.fsTools.doc(this.fs, `global/settings`);
            const snap = await Promise.race([
                this.fsTools.getDoc(docRef),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global settings read timeout')), 5000))
            ]);
            const data = snap.exists() ? snap.data() : {};
            // Cache globally for offline fallback
            try { localStorage.setItem('global_saas_settings', JSON.stringify(data)); } catch(e) {}
            return data;
        } catch(e) {
            console.warn('⚠️ getGlobalSettings failed:', e.message);
            return JSON.parse(localStorage.getItem('global_saas_settings') || '{}');
        }
    }

    async saveGlobalSettings(data) {
        await this.initPromise;
        if(!this.useFirebase) { localStorage.setItem('global_saas_settings', JSON.stringify(data)); return true; }
        try {
            const docRef = this.fsTools.doc(this.fs, `global/settings`);
            await Promise.race([
                this.fsTools.setDoc(docRef, data),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global settings save timeout')), 5000))
            ]);
            return true;
        } catch(e) {
            console.warn('⚠️ saveGlobalSettings failed:', e.message);
            localStorage.setItem('global_saas_settings', JSON.stringify(data));
            return true;
        }
    }

    async getAccessRequests() {
        await this.initPromise;
        const localReqs = JSON.parse(localStorage.getItem('global_access_requests') || '[]');
        if (!this.useFirebase) return localReqs;
        try {
            const docRef = this.fsTools.doc(this.fs, `global/access_requests`);
            const snap = await Promise.race([
                this.fsTools.getDoc(docRef),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Access requests read timeout')), 5000))
            ]);
            const remoteReqs = snap.exists() ? (snap.data().requests || []) : [];
            if (remoteReqs.length > 0 || localReqs.length === 0) {
                try { localStorage.setItem('global_access_requests', JSON.stringify(remoteReqs)); } catch (e) {}
                return remoteReqs;
            }
            return localReqs;
        } catch (e) {
            console.warn('⚠️ getAccessRequests failed:', e.message);
            return localReqs;
        }
    }

    async saveAccessRequests(requestsList) {
        await this.initPromise;
        try {
            localStorage.setItem('global_access_requests', JSON.stringify(requestsList));
        } catch (e) {}
        if (!this.useFirebase) return true;
        try {
            const docRef = this.fsTools.doc(this.fs, `global/access_requests`);
            await Promise.race([
                this.fsTools.setDoc(docRef, { requests: requestsList }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Access requests save timeout')), 5000))
            ]);
            return true;
        } catch (e) {
            console.warn('⚠️ saveAccessRequests failed:', e.message);
            return true;
        }
    }

    async seedTenantSettings(targetTenantId, settingsObj, servicesList) {
        await this.initPromise;
        const tid = String(targetTenantId);
        try {
            localStorage.setItem(tid + '_barber_settings', JSON.stringify(settingsObj || {}));
            if (Array.isArray(servicesList) && servicesList.length > 0) {
                localStorage.setItem(tid + '_barber_services', JSON.stringify(servicesList));
            }
        } catch (e) {}
        if (!this.useFirebase) return true;
        try {
            const setRef = this.fsTools.doc(this.fs, `tenants/${tid}/data/barber_settings`);
            await Promise.race([
                this.fsTools.setDoc(setRef, { items: settingsObj || {}, updatedAt: new Date().toISOString() }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('seedTenantSettings timeout')), 5000))
            ]);
            if (Array.isArray(servicesList) && servicesList.length > 0) {
                const srvRef = this.fsTools.doc(this.fs, `tenants/${tid}/data/barber_services`);
                await Promise.race([
                    this.fsTools.setDoc(srvRef, { items: servicesList, updatedAt: new Date().toISOString() }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('seedTenantServices timeout')), 5000))
                ]);
            }
        } catch (e) {
            console.warn('⚠️ seedTenantSettings remote sync fallback:', e.message);
        }
        return true;
    }

    /**
     * Подписка на произвольный документ в tenants/{tenantId}/data/{docName} (например, last_push)
     */
    async subscribeRawDoc(docName, callback) {
        await this.initPromise;
        if (!this.useFirebase || !this.fsTools || !this.fs) return () => {};
        const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${docName}`);
        return this.fsTools.onSnapshot(docRef, (snap) => {
            callback(snap.exists() ? snap.data() : null);
        }, (error) => {
            console.warn('⚠️ subscribeRawDoc error for', docName, error.message);
        });
    }

    // ================= PARTNER / ADMIN FIREBASE AUTH & APPROVAL HELPERS =================

    normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    getSuperAdminEmails() {
        const base = ['neymff007@gmail.com'];
        const extra = Array.isArray(this._extraSuperAdminEmails) ? this._extraSuperAdminEmails : [];
        return Array.from(new Set(base.concat(extra).map(e => this.normalizeEmail(e)).filter(Boolean)));
    }

    isSuperAdminEmail(email) {
        const norm = this.normalizeEmail(email);
        if (!norm) return false;
        return this.getSuperAdminEmails().includes(norm);
    }

    matchTenantOwner(tenant, user) {
        if (!tenant || !user) return false;
        const uUid = String(user.uid || '').trim();
        const uEmail = this.normalizeEmail(user.email);
        if (!uEmail && !uUid) return false;
        if (this.isSuperAdminEmail(uEmail)) return true;
        const tUid = String(tenant.ownerUid || '').trim();
        const tEmail = this.normalizeEmail(tenant.ownerEmail);
        if (tUid && uUid && tUid === uUid) return true;
        if (tEmail && uEmail && tEmail.includes('@') && tEmail === uEmail) return true;
        return false;
    }

    resolvePartnerTenants(user, tenantsList, preferredRole) {
        if (!user || !Array.isArray(tenantsList)) return [];
        const roleNorm = preferredRole ? String(preferredRole).trim() : '';
        const uUid = String(user.uid || '').trim();
        const uEmail = this.normalizeEmail(user.email);
        return tenantsList.filter(t => {
            if (roleNorm && (t.role || 'owner') !== roleNorm) return false;
            const tUid = String(t.ownerUid || '').trim();
            const tEmail = this.normalizeEmail(t.ownerEmail);
            return (tUid && uUid && tUid === uUid) ||
                   (tEmail && uEmail && tEmail.includes('@') && tEmail === uEmail);
        });
    }

    resolvePartnerTenant(user, tenantsList, preferredRole, preferredTenantId) {
        if (!user || !Array.isArray(tenantsList)) return null;
        const roleNorm = preferredRole ? String(preferredRole).trim() : '';
        const prefId = preferredTenantId ? String(preferredTenantId).trim() : '';
        const roleMatches = (t) => !roleNorm || (t.role || 'owner') === roleNorm;

        if (prefId) {
            const exact = tenantsList.find(t => String(t.id) === prefId && roleMatches(t) && this.matchTenantOwner(t, user));
            if (exact) return exact;
        }
        const directMatches = this.resolvePartnerTenants(user, tenantsList, roleNorm);
        return directMatches.length ? directMatches[0] : null;
    }

    mapAuthError(err) {
        const code = String((err && err.code) || '');
        const map = {
            'auth/email-already-in-use': 'Этот Email уже зарегистрирован. Нажмите «Войти» или введите пароль от этого аккаунта.',
            'auth/invalid-credential': 'Неверный Email или пароль. Проверьте данные или нажмите «Забыли пароль?».',
            'auth/wrong-password': 'Неверный пароль. Попробуйте ещё раз или сбросьте пароль.',
            'auth/user-not-found': 'Аккаунт с таким Email не найден. Нажмите «Зарегистрироваться и запросить доступ».',
            'auth/invalid-email': 'Введите корректный Email (например, name@gmail.com).',
            'auth/weak-password': 'Пароль слишком короткий — минимум 6 символов.',
            'auth/too-many-requests': 'Слишком много попыток входа. Подождите 1–2 минуты или сбросьте пароль.',
            'auth/popup-closed-by-user': 'Окно входа Google было закрыто до завершения.',
            'auth/cancelled-popup-request': 'Предыдущий запрос входа Google был отменён.',
            'auth/operation-not-allowed': 'Вход по Email и паролю ещё не включён в настройках Firebase.',
            'auth/network-request-failed': 'Ошибка сети. Проверьте подключение к интернету.'
        };
        if (map[code]) return map[code];
        return (err && err.message) ? err.message : 'Ошибка авторизации. Попробуйте ещё раз.';
    }

    async _loadAuthSDK() {
        await this.initPromise;
        if (!this.app) throw new Error('Firebase ещё не подключён');
        if (!this._authInitPromise) {
            this._authInitPromise = (async () => {
                const authTools = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
                this.auth = authTools.getAuth(this.app);
                this.authTools = authTools;
                return { auth: this.auth, authTools: this.authTools };
            })();
        }
        return this._authInitPromise;
    }

    async getCurrentAuthUser(timeoutMs = 2500) {
        try {
            const { auth, authTools } = await this._loadAuthSDK();
            if (typeof auth.authStateReady === 'function') {
                await Promise.race([
                    auth.authStateReady(),
                    new Promise(r => setTimeout(r, timeoutMs))
                ]);
                return auth.currentUser || null;
            }
            return await new Promise((resolve) => {
                let settled = false;
                const timer = setTimeout(() => {
                    if (!settled) { settled = true; resolve(auth.currentUser || null); }
                }, timeoutMs);
                const unsub = authTools.onAuthStateChanged(auth, (user) => {
                    if (!settled) {
                        settled = true;
                        clearTimeout(timer);
                        try { unsub(); } catch (_) {}
                        resolve(user || null);
                    }
                }, () => {
                    if (!settled) { settled = true; clearTimeout(timer); resolve(null); }
                });
            });
        } catch (e) {
            console.warn('⚠️ getCurrentAuthUser failed:', e.message);
            return null;
        }
    }

    async signInWithEmail(email, password) {
        const cleanEmail = this.normalizeEmail(email);
        if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Введите корректный Email (например, name@gmail.com).');
        if (!password || String(password).length < 4) throw new Error('Введите пароль.');
        const { auth, authTools } = await this._loadAuthSDK();
        try {
            const cred = await authTools.signInWithEmailAndPassword(auth, cleanEmail, String(password));
            return cred.user;
        } catch (err) {
            const friendly = new Error(this.mapAuthError(err));
            friendly.code = err && err.code;
            throw friendly;
        }
    }

    async registerOrSignInWithEmail(email, password) {
        const cleanEmail = this.normalizeEmail(email);
        if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Введите корректный Email (например, name@gmail.com).');
        if (!password || String(password).length < 6) throw new Error('Придумайте пароль длиной минимум 6 символов.');
        const { auth, authTools } = await this._loadAuthSDK();
        try {
            const cred = await authTools.createUserWithEmailAndPassword(auth, cleanEmail, String(password));
            return { user: cred.user, created: true };
        } catch (err) {
            if (err && err.code === 'auth/email-already-in-use') {
                try {
                    const signInCred = await authTools.signInWithEmailAndPassword(auth, cleanEmail, String(password));
                    return { user: signInCred.user, created: false };
                } catch (signInErr) {
                    const wrongPass = signInErr && (signInErr.code === 'auth/wrong-password' || signInErr.code === 'auth/invalid-credential');
                    const friendly = new Error(wrongPass
                        ? 'Этот Email уже зарегистрирован с другим паролем. Введите пароль от этого аккаунта или сбросьте его.'
                        : this.mapAuthError(signInErr));
                    friendly.code = signInErr && signInErr.code;
                    throw friendly;
                }
            }
            const friendly = new Error(this.mapAuthError(err));
            friendly.code = err && err.code;
            throw friendly;
        }
    }

    async sendResetPassword(email) {
        const cleanEmail = this.normalizeEmail(email);
        if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Введите Email, на который нужно отправить письмо для сброса пароля.');
        const { auth, authTools } = await this._loadAuthSDK();
        try {
            await authTools.sendPasswordResetEmail(auth, cleanEmail);
            return true;
        } catch (err) {
            const friendly = new Error(this.mapAuthError(err));
            friendly.code = err && err.code;
            throw friendly;
        }
    }

    async signInPartnerWithGoogle() {
        const { auth, authTools } = await this._loadAuthSDK();
        const provider = new authTools.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            const cred = await authTools.signInWithPopup(auth, provider);
            return cred.user;
        } catch (err) {
            const friendly = new Error(this.mapAuthError(err));
            friendly.code = err && err.code;
            throw friendly;
        }
    }

    async signOutAuth() {
        try {
            const { auth, authTools } = await this._loadAuthSDK();
            if (auth && auth.currentUser) {
                await authTools.signOut(auth);
            }
        } catch (e) {
            console.warn('⚠️ signOutAuth failed:', e.message);
        }
    }

    async bindEmailToTenant(tenantId, user, extraFields = {}) {
        const cleanId = String(tenantId || '').trim();
        const cleanEmail = this.normalizeEmail((user && user.email) || extraFields.ownerEmail);
        const uid = String((user && user.uid) || extraFields.ownerUid || '').trim();
        if (!cleanId || !cleanEmail || !cleanEmail.includes('@')) {
            throw new Error('Недостаточно данных для привязки Email к кабинету.');
        }
        const list = await this.getGlobalTenants();
        const idx = list.findIndex(t => String(t.id) === cleanId);
        if (idx === -1) throw new Error(`Кабинет ID ${cleanId} не найден в базе.`);
        const cur = list[idx];
        const updated = {
            ...cur,
            ownerEmail: cleanEmail,
            ownerUid: uid || cur.ownerUid || '',
            email: (cur.email && cur.email !== '—') ? cur.email : cleanEmail,
            emailBoundAt: new Date().toISOString(),
            ...extraFields
        };
        list[idx] = updated;
        await this.saveGlobalTenants(list);
        return updated;
    }

    async subscribeAccessRequests(callback) {
        await this.initPromise;
        if (!this.useFirebase || !this.fsTools || !this.fs) return () => {};
        const docRef = this.fsTools.doc(this.fs, 'global', 'access_requests');
        return this.fsTools.onSnapshot(docRef, (snap) => {
            const data = snap.exists() ? snap.data() : null;
            const list = (data && Array.isArray(data.requests)) ? data.requests : [];
            callback(list);
        }, (error) => {
            console.warn('⚠️ subscribeAccessRequests error:', error.message);
        });
    }

    // ================= VERIFIED VISIT REVIEWS & CLIENT FAVORITES =================

    normalizePhoneTail(rawPhone) {
        const digits = String(rawPhone || '').replace(/\D/g, '');
        if (digits.length < 6) return '';
        return digits.length > 9 ? digits.slice(-9) : digits;
    }

    hashPhoneSig(rawPhone) {
        const tail = this.normalizePhoneTail(rawPhone);
        if (!tail) return '';
        let h1 = 0x811c9dc5;
        let h2 = 5381;
        for (let i = 0; i < tail.length; i++) {
            const ch = tail.charCodeAt(i);
            h1 ^= ch;
            h1 = Math.imul(h1, 0x01000193);
            h2 = ((h2 << 5) + h2 + ch) | 0;
        }
        return 'ps_' + (h1 >>> 0).toString(36) + '_' + (h2 >>> 0).toString(36);
    }

    _phoneTailMatches(phoneA, phoneB) {
        const a = this.normalizePhoneTail(phoneA);
        const b = this.normalizePhoneTail(phoneB);
        if (!a || !b) return false;
        if (a === b) return true;
        const cmpLen = Math.min(a.length, b.length, 7);
        return cmpLen >= 6 && a.slice(-cmpLen) === b.slice(-cmpLen);
    }

    findCompletedBookingForReview(bookings, criteria = {}) {
        const list = Array.isArray(bookings) ? bookings : [];
        if (list.length === 0) return null;

        const targetMaster = criteria.masterId ? String(criteria.masterId) : '';
        const targetBookingId = criteria.bookingId ? String(criteria.bookingId) : '';
        const targetUid = criteria.authUid ? String(criteria.authUid).trim() : '';
        const targetPhoneSig = criteria.phoneSig ? String(criteria.phoneSig).trim() : '';
        const targetPhoneDigits = this.normalizePhoneTail(criteria.phoneDigits || '');
        const isSolo = Boolean(criteria.isSolo);

        const hasIdentity = Boolean(targetBookingId || targetUid || targetPhoneSig || targetPhoneDigits);
        if (!hasIdentity) return null;

        let exactMasterHit = null;
        let fallbackHit = null;

        for (const b of list) {
            if (!b || b.status !== 'completed') continue;

            const bMaster = b.masterId ? String(b.masterId) : '';
            const sameMaster = targetMaster && bMaster && bMaster === targetMaster;
            const compatibleMaster = !targetMaster || isSolo || !bMaster || bMaster === 'any' || sameMaster;
            if (!compatibleMaster) continue;

            const identityMatches =
                (targetBookingId && String(b.id) === targetBookingId) ||
                (targetUid && b.authUid && String(b.authUid).trim() === targetUid) ||
                (targetPhoneSig && this.hashPhoneSig(b.phone) === targetPhoneSig) ||
                (targetPhoneDigits && this._phoneTailMatches(b.phone, targetPhoneDigits));

            if (!identityMatches) continue;
            if (sameMaster) {
                exactMasterHit = b;
                break;
            }
            if (!fallbackHit) fallbackHit = b;
        }

        return exactMasterHit || fallbackHit;
    }

    isReviewVerifiedVisit(review, bookings, isSolo = false) {
        if (!review || typeof review !== 'object') return false;
        const list = Array.isArray(bookings) ? bookings : null;
        if (list && list.length > 0) {
            return Boolean(this.findCompletedBookingForReview(list, {
                bookingId: review.verifiedBookingId || review.bookingId,
                authUid: review.authUid,
                phoneSig: review.phoneSig,
                masterId: review.masterId,
                isSolo
            }));
        }
        return Boolean(review.verifiedVisit);
    }

    _favKeySet(itemOrId) {
        const keys = new Set();
        const addKey = (val) => {
            const s = String(val || '').trim();
            if (!s) return;
            keys.add(s);
            if (s.startsWith('solo_')) keys.add(s.slice(5));
        };
        if (itemOrId && typeof itemOrId === 'object') {
            addKey(itemOrId.id);
            addKey(itemOrId.targetId);
            addKey(itemOrId.tenantId);
        } else {
            addKey(itemOrId);
        }
        return keys;
    }

    normalizeFavoriteItem(item) {
        if (!item || typeof item !== 'object') return null;
        const id = String(item.id || item.targetId || item.tenantId || '').trim();
        const targetId = String(item.targetId || item.tenantId || item.id || '').trim();
        if (!id && !targetId) return null;
        const cleanTarget = targetId.startsWith('solo_') ? targetId.slice(5) : targetId;
        return {
            id: id || cleanTarget,
            targetId: cleanTarget || id,
            tenantId: String(item.tenantId || cleanTarget || '').replace(/^solo_/, ''),
            name: String(item.name || item.title || 'Барбершоп').trim(),
            title: String(item.title || item.name || 'Барбершоп').trim(),
            kind: String(item.kind || (item.isSolo ? 'Соло-мастер' : 'Барбершоп')),
            city: String(item.city || ''),
            address: String(item.address || ''),
            avatar: String(item.avatar || ''),
            isSolo: Boolean(item.isSolo),
            rating: Number(item.rating) || 0,
            reviews: Number(item.reviews) || 0,
            savedAt: Number(item.savedAt) || Date.now()
        };
    }

    getClientFavoritesLocal() {
        try {
            const raw = JSON.parse(localStorage.getItem('barber_client_favorites') || '[]');
            if (!Array.isArray(raw)) return [];
            const dedup = [];
            const seen = new Set();
            for (const row of raw) {
                const norm = this.normalizeFavoriteItem(row);
                if (!norm) continue;
                const keys = this._favKeySet(norm);
                let dup = false;
                for (const k of keys) { if (seen.has(k)) { dup = true; break; } }
                if (dup) continue;
                keys.forEach(k => seen.add(k));
                dedup.push(norm);
            }
            return dedup;
        } catch (e) {
            return [];
        }
    }

    _getClientFavDeletedLocal() {
        try {
            const raw = JSON.parse(localStorage.getItem('barber_client_favorites_deleted') || '{}');
            return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
        } catch (e) {
            return {};
        }
    }

    _saveClientFavStateLocal(items, deletedMap) {
        try {
            localStorage.setItem('barber_client_favorites', JSON.stringify(items || []));
            if (deletedMap && typeof deletedMap === 'object') {
                const entries = Object.entries(deletedMap)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .slice(0, 60);
                localStorage.setItem('barber_client_favorites_deleted', JSON.stringify(Object.fromEntries(entries)));
            }
            localStorage.setItem('barber_client_favorites_ts', String(Date.now()));
        } catch (e) {}
    }

    isClientFavorite(idOrItem, listOpt) {
        const list = Array.isArray(listOpt) ? listOpt : this.getClientFavoritesLocal();
        const targetKeys = this._favKeySet(idOrItem);
        if (targetKeys.size === 0) return false;
        return list.some(item => {
            const itemKeys = this._favKeySet(item);
            for (const k of targetKeys) {
                if (itemKeys.has(k)) return true;
            }
            return false;
        });
    }

    async _pushClientFavsToRemote(user, items, deletedMap) {
        if (!user || !user.uid || !this.useFirebase || !this.fs || !this.fsTools) return;
        try {
            const docRef = this.fsTools.doc(this.fs, 'global', `client_favs_${user.uid}`);
            await Promise.race([
                this.fsTools.setDoc(docRef, {
                    uid: user.uid,
                    items: Array.isArray(items) ? items : [],
                    deleted: deletedMap || {},
                    updatedAt: Date.now()
                }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Favorites sync timeout')), 5000))
            ]);
        } catch (e) {
            console.warn('⚠️ _pushClientFavsToRemote failed:', e.message);
        }
    }

    async toggleClientFavorite(itemInput, authUserOpt) {
        const norm = this.normalizeFavoriteItem(itemInput);
        if (!norm) return { added: false, items: this.getClientFavoritesLocal() };

        const current = this.getClientFavoritesLocal();
        const deleted = this._getClientFavDeletedLocal();
        const keys = this._favKeySet(norm);
        const exists = this.isClientFavorite(norm, current);
        const now = Date.now();
        let nextList;

        if (exists) {
            nextList = current.filter(row => {
                const rk = this._favKeySet(row);
                for (const k of keys) { if (rk.has(k)) return false; }
                return true;
            });
            keys.forEach(k => { deleted[k] = now; });
        } else {
            norm.savedAt = now;
            keys.forEach(k => { delete deleted[k]; });
            nextList = [norm, ...current];
        }

        this._saveClientFavStateLocal(nextList, deleted);
        try {
            window.dispatchEvent(new CustomEvent('barber-favorites-changed', {
                detail: { items: nextList, added: !exists, item: norm }
            }));
        } catch (_) {}

        const user = authUserOpt || (this.auth && this.auth.currentUser) || null;
        if (user && user.uid) {
            this._pushClientFavsToRemote(user, nextList, deleted);
        }
        return { added: !exists, items: nextList };
    }

    async syncClientFavorites(authUserOpt) {
        await this.initPromise;
        const localItems = this.getClientFavoritesLocal();
        const localDeleted = this._getClientFavDeletedLocal();
        let user = authUserOpt || (this.auth && this.auth.currentUser) || null;
        if (!user && this.useFirebase) {
            user = await this.getCurrentAuthUser(1200);
        }
        if (!user || !user.uid || !this.useFirebase || !this.fs || !this.fsTools) {
            return localItems;
        }

        try {
            const docRef = this.fsTools.doc(this.fs, 'global', `client_favs_${user.uid}`);
            const snap = await Promise.race([
                this.fsTools.getDoc(docRef),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Favorites fetch timeout')), 5000))
            ]);
            const remoteData = snap.exists() ? (snap.data() || {}) : {};
            const remoteItems = Array.isArray(remoteData.items) ? remoteData.items : [];
            const remoteDeleted = (remoteData.deleted && typeof remoteData.deleted === 'object') ? remoteData.deleted : {};

            const mergedDeleted = { ...remoteDeleted };
            for (const [k, ts] of Object.entries(localDeleted)) {
                mergedDeleted[k] = Math.max(Number(mergedDeleted[k]) || 0, Number(ts) || 0);
            }

            const combined = [...remoteItems, ...localItems];
            const bestByCanon = new Map();
            const aliasToCanon = new Map();

            for (const raw of combined) {
                const item = this.normalizeFavoriteItem(raw);
                if (!item) continue;
                const keys = this._favKeySet(item);

                let maxDelTs = 0;
                let canon = '';
                for (const k of keys) {
                    maxDelTs = Math.max(maxDelTs, Number(mergedDeleted[k]) || 0);
                    if (!canon && aliasToCanon.has(k)) canon = aliasToCanon.get(k);
                }
                if (maxDelTs >= item.savedAt) continue;

                if (!canon) canon = item.targetId || item.id;
                keys.forEach(k => aliasToCanon.set(k, canon));
                const prev = bestByCanon.get(canon);
                if (!prev || item.savedAt > prev.savedAt) {
                    bestByCanon.set(canon, item);
                }
            }

            const mergedList = Array.from(bestByCanon.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
            this._saveClientFavStateLocal(mergedList, mergedDeleted);

            if (mergedList.length !== remoteItems.length || localItems.length > 0) {
                await this._pushClientFavsToRemote(user, mergedList, mergedDeleted);
            }

            try {
                window.dispatchEvent(new CustomEvent('barber-favorites-changed', {
                    detail: { items: mergedList, synced: true }
                }));
            } catch (_) {}
            return mergedList;
        } catch (e) {
            console.warn('⚠️ syncClientFavorites failed:', e.message);
            return localItems;
        }
    }
}

const db = new BarberDB();
window.appDB = db;

// ═══════════════════════════════════════════════════════════
// UNIFIED LANGUAGE + 5-CURRENCY ENGINE (KGS, UZS, KZT, RUB, USD)
// Auto-detection on entry + 1 unified selector (Lang + Currency)
// ═══════════════════════════════════════════════════════════
window.BarberCurrency = (function() {
    const CURRENCIES = {
        KGS: { code: 'KGS', symbol: 'сом', short: 'с', flag: '🇰🇬', label: '🇰🇬 KGS', fullLabel: '🇰🇬 KGS (сом)', rateFromKGS: 1, step: 10 },
        UZS: { code: 'UZS', symbol: 'сум', short: 'сум', flag: '🇺🇿', label: '🇺🇿 UZS', fullLabel: '🇺🇿 UZS (сум)', rateFromKGS: 145, step: 1000 },
        KZT: { code: 'KZT', symbol: '₸', short: '₸', flag: '🇰🇿', label: '🇰🇿 KZT', fullLabel: '🇰🇿 KZT (₸)', rateFromKGS: 5.8, step: 50 },
        RUB: { code: 'RUB', symbol: 'руб', short: '₽', flag: '🇷🇺', label: '🇷🇺 RUB', fullLabel: '🇷🇺 RUB (руб)', rateFromKGS: 1.1, step: 10 },
        USD: { code: 'USD', symbol: '$', short: '$', flag: '🇺🇸', label: '🇺🇸 USD', fullLabel: '🇺🇸 USD ($)', rateFromKGS: 1 / 87.5, step: 0.5 }
    };

    const UZ_CITIES = ['Ташкент', 'Самарканд', 'Бухара', 'Фергана', 'Андижан', 'Наманган', 'Коканд', 'Чирчик', 'Алмалык', 'Навои', 'Карши', 'Нукус', 'Ургенч', 'Термез'];
    const KZ_CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Атырау', 'Актау', 'Костанай', 'Семей'];

    function detectTimezoneCountryCurr() {
        try {
            const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
            if (tz.includes('tashkent') || tz.includes('samarkand')) return 'UZS';
            if (tz.includes('almaty') || tz.includes('qyzylorda') || tz.includes('aqtobe') || tz.includes('aqtau') || tz.includes('atyrau') || tz.includes('oral') || tz.includes('qostanay')) return 'KZT';
            if (tz.includes('bishkek')) return 'KGS';
        } catch (e) {}
        return 'KGS';
    }

    function detectCountryCurrency(shopOrId, city, country) {
        const idStr = String((shopOrId && shopOrId.id) || shopOrId || '').toLowerCase();
        const ctry = String((shopOrId && (shopOrId.country || shopOrId.countryCode)) || country || '').toLowerCase();
        const cty = String((shopOrId && shopOrId.city) || city || '');
        if (idStr.startsWith('uz-') || ctry.includes('узбек') || ctry === 'uz' || UZ_CITIES.includes(cty)) return 'UZS';
        if (idStr.startsWith('kz-') || ctry.includes('казах') || ctry === 'kz' || KZ_CITIES.includes(cty)) return 'KZT';
        if (idStr.startsWith('kg-') || ctry.includes('кыргыз') || ctry === 'kg') return 'KGS';
        return null;
    }

    function currencyForLang(lang) {
        if (lang === 'en') return 'USD';
        if (lang === 'uz') return 'UZS';
        if (lang === 'kz') return 'KZT';
        if (lang === 'kg') return 'KGS';
        if (lang === 'ru') return 'RUB';
        return 'RUB';
    }

    // Auto-detect initial language & currency on first visit
    (function initAutoDetect() {
        try {
            if (!localStorage.getItem('barber_lang') && !localStorage.getItem('adminLang')) {
                const navLang = ((navigator.language || (navigator.languages && navigator.languages[0]) || 'ru').toLowerCase());
                let detectedLang = 'ru';
                if (navLang.startsWith('uz')) detectedLang = 'uz';
                else if (navLang.startsWith('kk') || navLang.startsWith('kz')) detectedLang = 'kz';
                else if (navLang.startsWith('ky') || navLang.startsWith('kg')) detectedLang = 'kg';
                else if (navLang.startsWith('en')) detectedLang = 'en';
                localStorage.setItem('barber_lang', detectedLang);
                localStorage.setItem('adminLang', detectedLang);
            }
            const curLang = localStorage.getItem('barber_lang') || localStorage.getItem('adminLang') || 'ru';
            localStorage.setItem('barber_currency', currencyForLang(curLang));
        } catch (e) {}
    })();

    function getActive() {
        const curLang = localStorage.getItem('barber_lang') || localStorage.getItem('adminLang');
        if (curLang) return currencyForLang(curLang);
        const saved = localStorage.getItem('barber_currency');
        return (saved && CURRENCIES[saved]) ? saved : 'RUB';
    }

    function updateUnifiedSelectLabels() {
        document.querySelectorAll('#lang-select, #langSelect').forEach(sel => {
            if (!sel || !sel.options) return;
            Array.from(sel.options).forEach(opt => {
                const isFull = opt.textContent.includes('Русский') || opt.textContent.includes('English') || opt.textContent.includes('Кыргызча');
                if (opt.value === 'ru') opt.textContent = isFull ? `🇷🇺 Русский · руб` : `🇷🇺 RU · руб`;
                else if (opt.value === 'kg') opt.textContent = isFull ? `🇰🇬 Кыргызча · сом` : `🇰🇬 KG · сом`;
                else if (opt.value === 'uz') opt.textContent = isFull ? `🇺🇿 O'zbek · сум` : `🇺🇿 UZ · сум`;
                else if (opt.value === 'kz') opt.textContent = isFull ? `🇰🇿 Қазақша · ₸` : `🇰🇿 KZ · ₸`;
                else if (opt.value === 'en') opt.textContent = isFull ? `🇬🇧 English · $` : `🇬🇧 EN · $`;
            });
        });
    }

    function syncSelects(code) {
        updateUnifiedSelectLabels();
    }

    function setActive(code, isManual) {
        if (!CURRENCIES[code]) code = 'RUB';
        localStorage.setItem('barber_currency', code);
        syncSelects(code);
        window.dispatchEvent(new CustomEvent('barber:currency', { detail: { currency: code } }));
        return code;
    }

    function syncByLang(lang) {
        const targetCurr = currencyForLang(lang);
        localStorage.setItem('barber_currency', targetCurr);
        updateUnifiedSelectLabels();
        window.dispatchEvent(new CustomEvent('barber:currency', { detail: { currency: targetCurr } }));
        return targetCurr;
    }

    function autoSelectByCountry(shopOrCountry, city) {
        const curLang = localStorage.getItem('barber_lang') || localStorage.getItem('adminLang') || 'ru';
        const targetCurr = currencyForLang(curLang);
        localStorage.setItem('barber_currency', targetCurr);
        updateUnifiedSelectLabels();
        return targetCurr;
    }

    function convert(amount, fromCode, toCode) {
        const num = Number(amount) || 0;
        if (num === 0) return 0;
        const from = CURRENCIES[fromCode] || CURRENCIES.KGS;
        const to = CURRENCIES[toCode || getActive()] || CURRENCIES.KGS;
        if (from.code === to.code) return num;
        const inKgs = num / from.rateFromKGS;
        const raw = inKgs * to.rateFromKGS;
        if (to.code === 'USD') {
            return raw >= 10 ? Math.round(raw) : Math.round(raw * 2) / 2;
        }
        if (to.step > 1 && raw >= to.step * 2) {
            return Math.round(raw / to.step) * to.step;
        }
        return Math.round(raw);
    }

    function format(amount, fromCode, useShort, toCode) {
        const targetCode = toCode || getActive();
        const c = CURRENCIES[targetCode] || CURRENCIES.KGS;
        const val = convert(amount, fromCode || 'KGS', targetCode);
        const sym = useShort ? c.short : c.symbol;
        if (c.code === 'USD') {
            const strVal = Number.isInteger(val) ? String(val) : val.toFixed(2).replace(/\.00$/, '');
            return '$' + strVal;
        }
        return val.toLocaleString('ru-RU') + ' ' + sym;
    }

    function symbol(useShort, code) {
        const c = CURRENCIES[code || getActive()] || CURRENCIES.KGS;
        return useShort ? c.short : c.symbol;
    }

    return {
        CURRENCIES,
        getActive,
        setActive,
        syncByLang,
        autoSelectByCountry,
        detectCountryCurrency,
        convert,
        format,
        symbol,
        syncSelects,
        updateUnifiedSelectLabels
    };
})();


