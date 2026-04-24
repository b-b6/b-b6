// Barber Real-time Database Layer (Hybrid Firebase / LocalStorage SaaS Model)

class BarberDB {
    constructor() {
        this.listeners = new Map();
        
        // Multi-tenant configuration
        const urlParams = new URLSearchParams(window.location.search);
        const urlTenant = urlParams.get('id');
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
        
        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
            const { getFirestore, doc, setDoc, getDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            this.fsTools = { doc, setDoc, getDoc, onSnapshot };
            
            const config = JSON.parse(configStr);
            const app = initializeApp(config);
            this.fs = getFirestore(app);
            this.useFirebase = true;
            console.log("🔥 Firebase SaaS Connected (Tenant:", this.tenantId, ")");
        } catch(e) {
            console.error("Failed to init Firebase. Falling back to local.", e);
        }
    }

    async _get(type, fallback = []) {
        await this.initPromise;
        if (this.useFirebase) {
            const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);
            const snap = await this.fsTools.getDoc(docRef);
            if (snap.exists()) {
                return snap.data().items || fallback;
            }
            return fallback;
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
            const docRef = this.fsTools.doc(this.fs, `tenants/${this.tenantId}/data/${type}`);
            await this.fsTools.setDoc(docRef, { items: data });
            return true;
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
                const data = doc.exists() ? (doc.data().items || []) : [];
                this.listeners.get(type).forEach(cb => cb(data)); // Push updates to UI
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
    async addBooking(booking) {
        let all = await this.getBookings();
        all.push(booking);
        return this.saveBookings(all);
    }
    async saveMasters(data) { return this._save(this.collections.masters, data); }
    async saveServices(data) { return this._save(this.collections.services, data); }
    async saveSettings(data) { return this._save(this.collections.settings, data); }
    async saveProducts(data) { return this._save(this.collections.products, data); }
    async saveReviews(data) { return this._save(this.collections.reviews, data); }
}

const db = new BarberDB();
window.appDB = db;
