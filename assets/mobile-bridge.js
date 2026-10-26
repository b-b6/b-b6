/**
 * Unified Multi-Tenant Barber SaaS Mobile Bridge (iOS / Android / Web)
 * Supports:
 * - Session Persistence (AsyncStorage / Capacitor Preferences / localStorage)
 * - Role Routing (Client, Owner, Solo-Master)
 * - Deferred Deep Linking (Universal Links / Android App Links / Install Referrer)
 * - Strict Client-Only Geolocation Permission Gate
 * - Live Geolocation Pin Sync between Admin/Barber & barbermap_kg.html
 * - FCM Push Notifications & Real-time Booking Alerts
 */
(function () {
    'use strict';

    const SESSION_KEY = 'barber_saas_session';
    const DEFERRED_LINK_KEY = 'barber_deferred_deeplink_id';
    const CUSTOM_LOCATIONS_KEY = 'barber_custom_map_locations';
    const FCM_TOKENS_KEY = 'barber_fcm_tokens';

    // Native WebView / Capacitor / React Native postMessage helper
    function postToNative(type, payload) {
        try {
            const msg = JSON.stringify({ type, payload, timestamp: Date.now() });
            if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
                window.ReactNativeWebView.postMessage(msg);
            }
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                if (type === 'SAVE_SESSION') {
                    window.Capacitor.Plugins.Preferences.set({ key: SESSION_KEY, value: JSON.stringify(payload) });
                } else if (type === 'CLEAR_SESSION') {
                    window.Capacitor.Plugins.Preferences.remove({ key: SESSION_KEY });
                }
            }
        } catch (e) {
            console.warn('Native bridge postMessage error:', e);
        }
    }

    const BarberMobileBridge = {
        SESSION_KEY,
        DEFERRED_LINK_KEY,
        CUSTOM_LOCATIONS_KEY,

        // ─── 1. SESSION PERSISTENCE (Owner & Master Auto-Login) ───
        getSession() {
            try {
                const raw = localStorage.getItem(SESSION_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (parsed && parsed.role && parsed.tenantId) {
                    return parsed;
                }
            } catch (e) {}
            return null;
        },

        saveSession(sessionData) {
            const payload = {
                role: sessionData.role, // 'owner' | 'master'
                tenantId: sessionData.tenantId,
                shopName: sessionData.shopName || sessionData.tenantId,
                masterId: sessionData.masterId || 'solo_master_1',
                masterName: sessionData.masterName || sessionData.shopName || 'Мастер',
                token: sessionData.token || ('tok_' + Date.now() + '_' + Math.random().toString(36).slice(2)),
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
            localStorage.setItem('tenant_id', payload.tenantId);
            if (payload.role === 'owner') {
                sessionStorage.setItem('adminAuth', 'true');
            } else if (payload.role === 'master') {
                sessionStorage.setItem('barberSoloAuth', 'true');
            }
            postToNative('SAVE_SESSION', payload);
            return payload;
        },

        logout() {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem('adminAuth');
            sessionStorage.removeItem('barberSoloAuth');
            postToNative('CLEAR_SESSION', null);
            window.location.href = 'app.html?logged_out=1';
        },

        // ─── 2. DEFERRED DEEP LINKING (Universal Links / App Links) ───
        captureIncomingDeepLink() {
            try {
                const params = new URLSearchParams(window.location.search);
                // Check direct ?book_id= or Play Install Referrer ?referrer=id%3D...
                let deepId = params.get('book_id') || params.get('deeplink_id');
                const referrer = params.get('referrer');
                if (!deepId && referrer) {
                    const refParams = new URLSearchParams(decodeURIComponent(referrer));
                    deepId = refParams.get('id') || refParams.get('book_id');
                }
                if (deepId) {
                    localStorage.setItem(DEFERRED_LINK_KEY, deepId);
                    return deepId;
                }
            } catch (e) {}
            return localStorage.getItem(DEFERRED_LINK_KEY) || null;
        },

        consumeDeferredDeepLink() {
            const id = this.captureIncomingDeepLink();
            if (id) {
                localStorage.removeItem(DEFERRED_LINK_KEY);
                return id;
            }
            return null;
        },

        getUniversalBookLink(tenantId, isSoloMaster) {
            const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
            const extra = isSoloMaster ? '&solo=1' : '';
            return `${base}book.html?id=${encodeURIComponent(tenantId)}${extra}`;
        },

        // ─── 3. STRICT CLIENT-ONLY GPS PERMISSION GATE ───
        requestClientLocation(callback) {
            postToNative('REQUEST_CLIENT_GPS', {});
            if (!navigator.geolocation) {
                callback({ granted: false, lat: null, lon: null });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = {
                        granted: true,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };
                    sessionStorage.setItem('client_gps_coords', JSON.stringify(coords));
                    callback(coords);
                },
                () => {
                    sessionStorage.setItem('client_gps_coords', JSON.stringify({ granted: false }));
                    callback({ granted: false, lat: null, lon: null });
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
            );
        },

        // ─── 4. CUSTOM BARBERSHOP GEOLOCATION SYNC (Admin -> BarberMap KG) ───
        getCustomLocationsLocal() {
            try {
                return JSON.parse(localStorage.getItem(CUSTOM_LOCATIONS_KEY) || '{}');
            } catch (e) {
                return {};
            }
        },

        async saveBarbershopLocation(tenantId, locData) {
            const all = this.getCustomLocationsLocal();
            const entry = {
                id: String(tenantId),
                name: locData.name || locData.shopName || 'Барбершоп',
                city: locData.city || 'Бишкек',
                address: locData.address || 'Адрес указан на карте',
                lat: parseFloat(locData.lat),
                lon: parseFloat(locData.lon ?? locData.lng),
                rating: parseFloat(locData.rating) || 5.0,
                reviews: parseInt(locData.reviews) || 25,
                hours: locData.hours || `${locData.openTime || '10:00'} - ${locData.closeTime || '21:00'}`,
                phone: locData.phone || '',
                updatedAt: new Date().toISOString()
            };
            all[entry.id] = entry;
            localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(all));

            // Also persist to Firebase global registry so all clients see the pin on barbermap_kg.html
            try {
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, 'global/data_locations');
                    const snap = await getDoc(ref);
                    const remoteMap = snap.exists() ? (snap.data().items || {}) : {};
                    remoteMap[entry.id] = entry;
                    await setDoc(ref, { items: remoteMap });
                }
            } catch (e) {
                console.warn('Firebase map location sync fallback to local:', e);
            }
            return entry;
        },

        async deleteBarbershopLocation(pointId) {
            const all = this.getCustomLocationsLocal();
            delete all[String(pointId)];
            localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(all));
            try {
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, 'global/data_locations');
                    const snap = await getDoc(ref);
                    if (snap.exists() && snap.data().items) {
                        const remoteMap = snap.data().items;
                        delete remoteMap[String(pointId)];
                        await setDoc(ref, { items: remoteMap });
                    }
                }
            } catch (e) {}
            return true;
        },

        async syncRemoteLocationsToMap() {
            try {
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, 'global/data_locations');
                    const snap = await getDoc(ref);
                    if (snap.exists() && snap.data().items) {
                        const merged = Object.assign({}, this.getCustomLocationsLocal(), snap.data().items);
                        localStorage.setItem(CUSTOM_LOCATIONS_KEY, JSON.stringify(merged));
                        return merged;
                    }
                }
            } catch (e) {}
            return this.getCustomLocationsLocal();
        },

        // ─── 5. FCM PUSH NOTIFICATIONS & BOOKING ALERTS ───
        async registerPushNotifications(tenantId, role) {
            postToNative('REGISTER_FCM', { tenantId, role });
            try {
                if ('Notification' in window && Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
                if ('serviceWorker' in navigator) {
                    await navigator.serviceWorker.register('sw.js').catch(() => {});
                }
            } catch (e) {}
        },

        async sendBookingPushNotification(tenantId, booking) {
            const title = '🔔 Новая запись!';
            const body = `Новая запись: ${booking.name || 'Клиент'}, ${booking.service || 'Стрижка'}, ${booking.date || ''} в ${booking.time || ''}`;

            // 1. Notify Native Wrapper (React Native / Capacitor FCM Bridge)
            postToNative('SEND_FCM_PUSH', {
                tenantId,
                title,
                body,
                booking
            });

            // 2. Write push event to Firestore `tenants/{tenantId}/data/fcm_notifications` so connected Owner & Master devices receive instant push with sound
            try {
                if (window.appDB && window.appDB.useFirebase && window.appDB.fs) {
                    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    const ref = doc(window.appDB.fs, `tenants/${tenantId}/data/last_push`);
                    await setDoc(ref, {
                        id: booking.id || String(Date.now()),
                        title,
                        body,
                        booking,
                        timestamp: Date.now()
                    });
                }
            } catch (e) {}
        },

        playNotificationSound() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.14);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.45);
            } catch (e) {}
        },

        showLocalNotification(title, body) {
            try {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title || '✂️ Новая запись!', { body: body || '' });
                }
            } catch (e) {}
        }
    };

    window.BarberMobileBridge = BarberMobileBridge;
})();
