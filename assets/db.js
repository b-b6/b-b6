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
        let urlTenant = urlParams.get('shop') || urlParams.get('id');

        // Check Telegram WebApp start_param deep link fallback
        if (!urlTenant && typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
            const tgStart = window.Telegram.WebApp.initDataUnsafe.start_param;
            if (tgStart) {
                urlTenant = tgStart.replace(/^shop_/, '');
            }
        }

        if (urlTenant) {
            localStorage.setItem('tenant_id', urlTenant);
        }
        this.tenantId = localStorage.getItem('tenant_id') || 'local_demo';
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
        
        // Timeout: if Firebase doesn't connect in 8s, fall back to localStorage
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase connection timeout (8s)')), 8000));
        
        try {
            const firebaseInit = (async () => {
                const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
                const { getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                this.fsTools = { doc, setDoc, getDoc, onSnapshot, runTransaction };
                
                const config = JSON.parse(configStr);
                const app = initializeApp(config);
                this.fs = getFirestore(app);
                this.app = app;
                
                // Verify connection with a test read
                const testRef = doc(this.fs, `global/saas`);
                await Promise.race([
                    getDoc(testRef),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore read timeout')), 6000))
                ]);
                
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
            serviceKey: safe.serviceKey
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
            all.push(safe);
            await this._save(type, all);
            return { ok: true, items: all };
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
            transaction.set(docRef, { items: [...items, safe] });
        });

        let finalItems = await this._get(type, []);
        return { ok: true, items: finalItems };
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
        if(!this.useFirebase) return JSON.parse(localStorage.getItem('global_saas_tenants') || '[]');
        try {
            const docRef = this.fsTools.doc(this.fs, `global/saas`);
            const snap = await Promise.race([
                this.fsTools.getDoc(docRef),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global tenants read timeout')), 5000))
            ]);
            return snap.exists() ? (snap.data().tenants || []) : [];
        } catch(e) {
            console.warn('⚠️ getGlobalTenants failed:', e.message);
            return JSON.parse(localStorage.getItem('global_saas_tenants') || '[]');
        }
    }

    async saveGlobalTenants(tenantsList) {
        await this.initPromise;
        if(!this.useFirebase) { localStorage.setItem('global_saas_tenants', JSON.stringify(tenantsList)); return true; }
        try {
            const docRef = this.fsTools.doc(this.fs, `global/saas`);
            await Promise.race([
                this.fsTools.setDoc(docRef, { tenants: tenantsList }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Global tenants save timeout')), 5000))
            ]);
            return true;
        } catch(e) {
            console.warn('⚠️ saveGlobalTenants failed:', e.message);
            localStorage.setItem('global_saas_tenants', JSON.stringify(tenantsList));
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
}

const db = new BarberDB();
window.appDB = db;
