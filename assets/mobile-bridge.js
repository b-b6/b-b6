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
            if (locData.isSolo) entry.isSolo = true;
            if (locData.tenantId) entry.tenantId = String(locData.tenantId);
            if (locData.spec) entry.spec = String(locData.spec);
            if (locData.avatar) entry.avatar = String(locData.avatar);
            if (locData.chairRent) entry.chairRent = locData.chairRent;
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
                        const remoteItems = snap.data().items;
                        const localItems = this.getCustomLocationsLocal();
                        // Remove solo master pins from local cache if master hid them remotely
                        Object.keys(localItems).forEach(k => {
                            if (String(k).startsWith('solo_') && !remoteItems[k]) {
                                delete localItems[k];
                            }
                        });
                        const merged = Object.assign({}, localItems, remoteItems);
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

        async sendNtfyPush({ topic, title, message, priority = 5, tags = ['scissors', 'bell'], clickUrl = '', delay = '', sequenceId = '' }) {
            const cleanTopic = String(topic || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
            if (!cleanTopic) return false;
            try {
                const payload = {
                    topic: cleanTopic,
                    title: String(title || '🔔 Новая запись!'),
                    message: String(message || ''),
                    priority: Number(priority) || 5,
                    tags: Array.isArray(tags) ? tags : ['scissors']
                };
                if (clickUrl) payload.click = clickUrl;
                if (delay !== undefined && delay !== null && delay !== '') {
                    payload.delay = typeof delay === 'number' ? String(Math.floor(delay)) : String(delay);
                }
                if (sequenceId) {
                    const cleanSeq = String(sequenceId).trim().replace(/[^a-zA-Z0-9_-]/g, '');
                    if (cleanSeq) payload.sequence_id = cleanSeq;
                }
                const res = await fetch('https://ntfy.sh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return res.ok;
            } catch (e) {
                console.warn('sendNtfyPush error:', e);
                return false;
            }
        },

        async cancelNtfyPush(topic, sequenceId) {
            const cleanTopic = String(topic || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
            const cleanSeq = String(sequenceId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
            if (!cleanTopic || !cleanSeq) return false;
            try {
                const res = await fetch(`https://ntfy.sh/${encodeURIComponent(cleanTopic)}/${encodeURIComponent(cleanSeq)}`, {
                    method: 'DELETE'
                });
                return res.ok;
            } catch (e) {
                console.warn('cancelNtfyPush error:', e);
                return false;
            }
        },

        resolveReminderMinutes(settingsObj) {
            if (!settingsObj || settingsObj.solo_reminder_minutes === undefined || settingsObj.solo_reminder_minutes === null || settingsObj.solo_reminder_minutes === '') {
                return 15;
            }
            const n = Number(settingsObj.solo_reminder_minutes);
            return Number.isFinite(n) && n >= 0 ? n : 15;
        },

        computeBookingStartMs(booking, settingsObj) {
            if (!booking || !booking.date || !booking.time) return NaN;
            const dMatch = String(booking.date).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            const tMatch = String(booking.time).trim().match(/^(\d{1,2}):(\d{2})/);
            if (!dMatch || !tMatch) return NaN;

            const yr = parseInt(dMatch[1], 10);
            const mo = parseInt(dMatch[2], 10) - 1;
            const da = parseInt(dMatch[3], 10);
            const hh = parseInt(tMatch[1], 10);
            const mm = parseInt(tMatch[2], 10);
            const dt = new Date(yr, mo, da, hh, mm, 0, 0);
            if (isNaN(dt.getTime())) return NaN;

            // Match BookingLogic night-shift rule (e.g. open 10:00, close 02:00 -> 00:30 belongs to next calendar morning)
            const st = settingsObj || {};
            const parseHHMM = (str, defMin) => {
                const m = String(str || '').trim().match(/^(\d{1,2}):(\d{2})/);
                return m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) : defMin;
            };
            const openMins = parseHHMM(st.soloWorkStart || st.workStart || st.openTime, 10 * 60);
            const closeMins = parseHHMM(st.soloWorkEnd || st.workEnd || st.closeTime, 21 * 60);
            const slotMins = hh * 60 + mm;
            if (closeMins <= openMins && closeMins <= 4 * 60 && slotMins < openMins && hh <= 4) {
                dt.setDate(dt.getDate() + 1);
            }
            return dt.getTime();
        },

        _getReminderSchedKey(tenantId) {
            return `barber_ntfy_sched_v1_${String(tenantId || 'default').replace(/[^a-zA-Z0-9_-]/g, '')}`;
        },

        _readReminderSchedMap(tenantId) {
            try {
                const raw = localStorage.getItem(this._getReminderSchedKey(tenantId));
                const parsed = raw ? JSON.parse(raw) : {};
                return (parsed && typeof parsed === 'object') ? parsed : {};
            } catch (e) {
                return {};
            }
        },

        _writeReminderSchedMap(tenantId, map) {
            try {
                const cutoff = Date.now() - 2 * 86400000;
                const pruned = {};
                const keys = Object.keys(map || {}).slice(-200);
                keys.forEach(k => {
                    const entry = map[k];
                    if (entry && (!entry.remindAtMs || entry.remindAtMs > cutoff)) {
                        pruned[k] = entry;
                    }
                });
                localStorage.setItem(this._getReminderSchedKey(tenantId), JSON.stringify(pruned));
            } catch (e) {}
        },

        _bookingReminderSeqId(booking) {
            const cleanId = String((booking && booking.id) || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
            return `brem_${cleanId}`;
        },

        async scheduleSoloMasterReminder(tenantId, booking, settingsObj, opts) {
            if (!booking || !booking.id || booking.isBreak) {
                return { scheduled: false, reason: 'invalid_booking' };
            }
            let st = settingsObj;
            if (!st && window.appDB && window.appDB.getSettings) {
                try { st = await window.appDB.getSettings(); } catch (e) {}
            }
            if (booking.status === 'cancelled' || booking.status === 'completed') {
                await this.cancelSoloMasterReminder(tenantId, booking, st);
                return { scheduled: false, reason: 'inactive_status' };
            }

            const leadMin = this.resolveReminderMinutes(st);
            if (leadMin <= 0) {
                await this.cancelSoloMasterReminder(tenantId, booking, st);
                return { scheduled: false, reason: 'disabled' };
            }

            const apptMs = this.computeBookingStartMs(booking, st);
            if (!Number.isFinite(apptMs)) {
                return { scheduled: false, reason: 'invalid_datetime' };
            }

            const remindAtMs = apptMs - leadMin * 60 * 1000;
            const diffSec = Math.floor((remindAtMs - Date.now()) / 1000);
            const seqId = this._bookingReminderSeqId(booking);
            const title = `⏰ Через ${leadMin} мин клиент (${booking.time || ''})!`;
            const body = `${booking.name || 'Клиент'} (${booking.phone || 'без тел.'})\nУслуга: ${booking.service || 'Стрижка'}\nЗапись на ${booking.date || ''} в ${booking.time || ''}`;

            const bid = String(booking.id);
            const schedMap = this._readReminderSchedMap(tenantId);
            const existing = schedMap[bid];
            const skipSame = Boolean(opts && opts.skipIfSame);
            const sameTiming = Boolean(existing && existing.remindAtMs === remindAtMs && existing.leadMin === leadMin);
            const ntfyTopic = (st && st.solo_push_topic && st.solo_push_enabled !== false) ? String(st.solo_push_topic) : '';

            // Native Expo APK local offline alarm (works for any future date > 3 days too)
            const hasNative = Boolean(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function');
            let nativeDone = Boolean(sameTiming && existing.nativeSent);
            if (hasNative && remindAtMs > Date.now() + 5000 && (!skipSame || !nativeDone)) {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'SCHEDULE_NOTIFICATION',
                        identifier: seqId,
                        title,
                        body,
                        triggerTimestampMs: remindAtMs
                    }));
                    nativeDone = true;
                } catch (e) {}
            }

            if (!ntfyTopic) {
                if (existing && existing.ntfyTopicSent) {
                    await this.cancelNtfyPush(existing.ntfyTopicSent, seqId).catch(() => {});
                }
                if (nativeDone) {
                    if (!sameTiming || !existing.nativeSent || (existing && existing.ntfyTopicSent)) {
                        schedMap[bid] = { remindAtMs, leadMin, ntfyTopicSent: '', nativeSent: true, updatedAt: Date.now() };
                        this._writeReminderSchedMap(tenantId, schedMap);
                    }
                } else if (existing) {
                    delete schedMap[bid];
                    this._writeReminderSchedMap(tenantId, schedMap);
                }
                return { scheduled: nativeDone, reason: 'ntfy_not_configured', remindAtMs, leadMin };
            }

            if (existing && existing.ntfyTopicSent && existing.ntfyTopicSent !== ntfyTopic) {
                await this.cancelNtfyPush(existing.ntfyTopicSent, seqId).catch(() => {});
            }

            // ntfy.sh supports delay from 10s up to 3 days (use 2-min margin below 3d)
            const MAX_NTFY_DELAY_SEC = 3 * 86400 - 120;
            if (diffSec < 10) {
                return { scheduled: false, reason: diffSec < 0 ? 'reminder_time_passed' : 'too_soon', remindAtMs, leadMin };
            }
            if (diffSec > MAX_NTFY_DELAY_SEC) {
                if (nativeDone && (!sameTiming || !existing.nativeSent)) {
                    schedMap[bid] = { remindAtMs, leadMin, ntfyTopicSent: '', nativeSent: true, updatedAt: Date.now() };
                    this._writeReminderSchedMap(tenantId, schedMap);
                }
                return { scheduled: false, reason: 'beyond_3d_limit', remindAtMs, leadMin };
            }

            if (skipSame && sameTiming && existing.ntfyTopicSent === ntfyTopic) {
                return { scheduled: true, reason: 'already_scheduled', remindAtMs, leadMin };
            }

            const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
            const clickUrl = `${base}barber.html?id=${encodeURIComponent(tenantId || '')}`;
            const ok = await this.sendNtfyPush({
                topic: ntfyTopic,
                title,
                message: body,
                priority: 5,
                tags: ['alarm_clock', 'scissors'],
                clickUrl,
                delay: Math.floor(remindAtMs / 1000),
                sequenceId: seqId
            });

            if (ok || nativeDone) {
                schedMap[bid] = {
                    remindAtMs,
                    leadMin,
                    ntfyTopicSent: ok ? ntfyTopic : (sameTiming ? existing.ntfyTopicSent || '' : ''),
                    nativeSent: nativeDone,
                    updatedAt: Date.now()
                };
                this._writeReminderSchedMap(tenantId, schedMap);
            }
            return { scheduled: ok, reason: ok ? 'queued_ntfy' : 'ntfy_failed', remindAtMs, leadMin };
        },

        async cancelSoloMasterReminder(tenantId, booking, settingsObj) {
            if (!booking || !booking.id) return false;
            const seqId = this._bookingReminderSeqId(booking);
            try {
                if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CANCEL_NOTIFICATION',
                        identifier: seqId
                    }));
                }
            } catch (e) {}

            let st = settingsObj;
            if (!st && window.appDB && window.appDB.getSettings) {
                try { st = await window.appDB.getSettings(); } catch (e) {}
            }
            const bid = String(booking.id);
            const schedMap = this._readReminderSchedMap(tenantId);
            const topic = (st && st.solo_push_topic) || (schedMap[bid] && (schedMap[bid].ntfyTopicSent || schedMap[bid].topic)) || '';
            delete schedMap[bid];
            this._writeReminderSchedMap(tenantId, schedMap);

            if (topic) {
                return this.cancelNtfyPush(topic, seqId);
            }
            return true;
        },

        async sendBookingPushNotification(tenantId, booking, settingsObj) {
            const isCancel = booking && booking.status === 'cancelled';
            const title = isCancel ? '❌ Клиент отменил запись' : '✂️ Новая онлайн-запись!';
            const body = `${booking.name || 'Клиент'} (${booking.phone || '—'})\n${booking.service || 'Стрижка'} • ${booking.date || ''} в ${booking.time || ''}`;

            // 1. Notify Native Wrapper (React Native / Capacitor FCM Bridge)
            postToNative('SEND_FCM_PUSH', {
                tenantId,
                title,
                body,
                booking
            });

            // 2. Write push event to Firestore `tenants/{tenantId}/data/last_push`
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

            // 3. Deliver real background Push to locked screen / over TikTok & Instagram via ntfy
            try {
                let st = settingsObj;
                if (!st && window.appDB && window.appDB.getSettings) {
                    st = await window.appDB.getSettings();
                }
                if (st && st.solo_push_topic && st.solo_push_enabled !== false) {
                    const base = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
                    const clickUrl = `${base}barber.html?id=${encodeURIComponent(tenantId)}`;
                    await this.sendNtfyPush({
                        topic: st.solo_push_topic,
                        title: isCancel ? `❌ Отмена записи (${booking.time || ''})` : `✂️ Новая запись на ${booking.time || ''}!`,
                        message: `${booking.name || 'Клиент'} (${booking.phone || 'без тел.'})\nУслуга: ${booking.service || 'Стрижка'}\nДата: ${booking.date || ''} в ${booking.time || ''}`,
                        priority: 5,
                        tags: isCancel ? ['x', 'scissors'] : ['scissors', 'bell'],
                        clickUrl
                    });
                }
            } catch (e) {}
        },

        vibrate(pattern) {
            try {
                if (navigator && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(pattern || [200, 100, 200]);
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

        playReminderSound() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const notes = [659.25, 880, 1046.5];
                notes.forEach((freq, i) => {
                    const t = ctx.currentTime + i * 0.16;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.22, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.28);
                });
            } catch (e) {}
        },

        normalizeWhatsAppPhone(rawPhone, defaultCountryCode = '996') {
            const digits = String(rawPhone || '').replace(/\D/g, '');
            if (!digits || digits.length < 9 || /^0+$/.test(digits)) return '';
            if (digits === '996555000000' || digits === '555000000') return '';

            const defCc = String(defaultCountryCode || '996').replace(/\D/g, '') || '996';
            let normalized = digits;
            if (digits.length === 10 && digits.startsWith('0')) {
                normalized = defCc + digits.slice(1);
            } else if (digits.length === 9) {
                normalized = defCc + digits;
            } else if (digits.length === 11 && digits.startsWith('8')) {
                normalized = '7' + digits.slice(1);
            }

            if (normalized.length < 11 || normalized.length > 15) return '';
            return normalized;
        },

        buildWhatsAppBookingMessage(booking, opts = {}) {
            const b = booking || {};
            const lang = String(opts.lang || 'kg').toLowerCase();
            const rawName = String(b.name || b.clientName || '').trim();
            const isGenericName = !rawName || /^(клиент|кардар|client)$/i.test(rawName);
            const shopLabel = String(opts.shopName || b.shopName || opts.masterName || b.masterName || 'BarberMap').trim();
            const masterName = String(opts.masterName || b.masterName || '').trim();
            const srvName = String(b.service || b.serviceName || '').trim();

            let priceText = String(opts.priceFormatted || '').trim();
            if (!priceText && Number(b.price) > 0) {
                const c = b.currency || 'KGS';
                if (typeof window !== 'undefined' && window.BarberCurrency && window.BarberCurrency.format) {
                    priceText = window.BarberCurrency.format(b.price, c, false, c);
                } else {
                    priceText = `${b.price} ${c === 'KGS' ? 'сом' : c}`;
                }
            }

            let dateText = String(b.date || '').trim();
            const dm = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dm) dateText = `${dm[3]}.${dm[2]}.${dm[1]}`;
            const timeText = String(b.time || '').trim();

            const cityPart = String(opts.city || '').trim();
            const addrPart = String(opts.address || '').trim();
            const isPlaceholder = !addrPart || addrPart === 'Адрес указан на карте' || addrPart === 'Точка с карты Super Admin';
            const locationText = (!isPlaceholder && cityPart && !addrPart.toLowerCase().includes(cityPart.toLowerCase()))
                ? `${cityPart}, ${addrPart}`
                : (!isPlaceholder ? addrPart : cityPart);

            const lines = [];
            if (lang === 'ru') {
                lines.push(isGenericName ? 'Здравствуйте! ✂️' : `Здравствуйте, ${rawName}! ✂️`);
                lines.push(opts.isSolo
                    ? `Вы записаны к мастеру «${shopLabel}»:`
                    : `Вы записаны в «${shopLabel}»:`);
                if (!opts.isSolo && masterName && masterName !== 'Любой') lines.push(`👤 Мастер: ${masterName}`);
                if (srvName) lines.push(`💈 Услуга: ${srvName}${priceText ? ' — ' + priceText : ''}`);
                if (dateText || timeText) lines.push(`📅 Дата: ${dateText}${timeText ? ' • 🕒 Время: ' + timeText : ''}`);
                if (locationText) lines.push(`📍 Адрес: ${locationText}`);
                if (opts.bookingUrl) lines.push(`🔗 Онлайн-запись: ${opts.bookingUrl}`);
                lines.push('');
                lines.push('Ждём вас к назначенному времени! 🤝');
            } else {
                lines.push(isGenericName ? 'Саламатсызбы! ✂️' : `Саламатсызбы, ${rawName}! ✂️`);
                lines.push(opts.isSolo
                    ? `Сиз «${shopLabel}» чеберине жазылдыңыз:`
                    : `Сиз «${shopLabel}» барбершопуна жазылдыңыз:`);
                if (!opts.isSolo && masterName && !/^(любой|каалаган)$/i.test(masterName)) {
                    lines.push(`👤 Чебер: ${masterName}`);
                }
                if (srvName) lines.push(`💈 Кызмат: ${srvName}${priceText ? ' — ' + priceText : ''}`);
                if (dateText || timeText) lines.push(`📅 Күнү: ${dateText}${timeText ? ' • 🕒 Саат: ' + timeText : ''}`);
                if (locationText) lines.push(`📍 Дарек: ${locationText}`);
                if (opts.bookingUrl) lines.push(`🔗 Онлайн-жазуу: ${opts.bookingUrl}`);
                lines.push('');
                lines.push('Белгиленген убакытта күтөбүз! 🤝');
            }
            return lines.join('\n');
        },

        openBookingWhatsAppChat(booking, opts = {}) {
            const cleanPhone = this.normalizeWhatsAppPhone(booking && (booking.phone || booking.clientPhone), opts.defaultCountryCode || '996');
            const text = this.buildWhatsAppBookingMessage(booking, opts);
            if (!cleanPhone) {
                return { opened: false, reason: 'no_phone', cleanPhone: '', url: '', text };
            }
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
            let opened = false;
            try {
                const win = window.open(url, '_blank');
                if (win && !win.closed) {
                    opened = true;
                } else {
                    window.location.href = url;
                    opened = true;
                }
            } catch (e) {
                try {
                    window.location.href = url;
                    opened = true;
                } catch (e2) {}
            }
            return { opened, reason: opened ? 'ok' : 'failed', cleanPhone, url, text };
        },

        async showLocalNotification(title, body, opts) {
            const safeTitle = title || '✂️ Новая запись!';
            const safeBody = body || '';
            try {
                if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'LOCAL_NOTIFICATION',
                        title: safeTitle,
                        body: safeBody
                    }));
                }
            } catch (e) {}

            try {
                if (!('Notification' in window) || Notification.permission !== 'granted') return;
                const notifOpts = {
                    body: safeBody,
                    icon: 'assets/pwa-icon-192.png',
                    badge: 'assets/pwa-icon-192.png',
                    vibrate: [200, 100, 200, 100, 300],
                    requireInteraction: true,
                    renotify: true,
                    tag: (opts && opts.tag) || ('barber_notif_' + Date.now()),
                    data: { url: (opts && opts.url) || 'barber.html' }
                };
                if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg && reg.showNotification) {
                        await reg.showNotification(safeTitle, notifOpts);
                        return;
                    }
                }
                new Notification(safeTitle, notifOpts);
            } catch (e) {}
        },

        /**
         * Shared Stage-1 Partner Email Binding Banner & Modal for legacy PIN-only tenants.
         * Used on admin.html (owner) and barber.html (master) without duplicating markup/logic.
         */
        mountPartnerEmailBindBanner(opts) {
            const cfg = opts || {};
            const tenant = cfg.tenantRecord;
            if (!tenant || !tenant.id) return null;
            const boundEmail = window.appDB && window.appDB.normalizeEmail
                ? window.appDB.normalizeEmail(tenant.ownerEmail)
                : String(tenant.ownerEmail || '').trim().toLowerCase();
            if (boundEmail && boundEmail.includes('@')) return null;

            const existingBanner = document.getElementById('partner-bind-email-banner');
            if (existingBanner) existingBanner.remove();

            const esc = (s) => window.escapeHTML ? window.escapeHTML(String(s || '')) : String(s || '');
            const shopLabel = esc(tenant.shopName || ((cfg.role === 'master') ? `Мастер #${tenant.id}` : `Салон #${tenant.id}`));

            const banner = document.createElement('div');
            banner.id = 'partner-bind-email-banner';
            banner.style.cssText = 'background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1.5px solid #f59e0b;border-radius:16px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;box-shadow:0 4px 14px rgba(245,158,11,0.12);';
            banner.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;min-width:230px;flex:1;">
                    <div style="width:40px;height:40px;border-radius:12px;background:#fef08a;color:#92400e;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🔐</div>
                    <div>
                        <div style="font-size:13.5px;font-weight:800;color:#78350f;margin-bottom:2px;">Привяжите Email и пароль к «${shopLabel}»</div>
                        <div style="font-size:12px;color:#92400e;line-height:1.35;">Скоро вход по старому 4-значному PIN будет закрыт. Привяжите Gmail за 10 секунд, чтобы защитить свой кабинет.</div>
                    </div>
                </div>
                <button type="button" id="partner-bind-email-open-btn" style="background:#0c192c;color:#ffffff;border:none;border-radius:11px;padding:10px 16px;font-size:12.5px;font-weight:800;cursor:pointer;white-space:nowrap;box-shadow:0 4px 10px rgba(12,25,44,0.18);">
                    Привязать Email →
                </button>
            `;

            const beforeEl = cfg.insertBeforeSelector ? document.querySelector(cfg.insertBeforeSelector) : null;
            const hostEl = cfg.mountTargetSelector ? document.querySelector(cfg.mountTargetSelector) : null;
            if (beforeEl && beforeEl.parentNode) {
                beforeEl.parentNode.insertBefore(banner, beforeEl);
            } else if (hostEl) {
                hostEl.prepend(banner);
            } else {
                document.body.prepend(banner);
            }

            let modal = document.getElementById('partner-bind-email-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'partner-bind-email-modal';
                modal.style.cssText = 'position:fixed;inset:0;background:rgba(12,25,44,0.68);backdrop-filter:blur(4px);z-index:10050;display:none;align-items:center;justify-content:center;padding:16px;';
                modal.innerHTML = `
                    <div style="background:#ffffff;border-radius:20px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(12,25,44,0.28);position:relative;">
                        <button type="button" id="pb-close-btn" aria-label="Закрыть" style="position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
                        <div style="width:46px;height:46px;border-radius:14px;background:#fef3c7;color:#92400e;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:12px;">🔐</div>
                        <h3 style="margin:0 0 6px;font-size:18px;font-weight:800;color:#0c192c;">Защита кабинета по Email</h3>
                        <p style="margin:0 0 14px;font-size:13px;color:#475569;line-height:1.45;">Укажите ваш рабочий <b>Gmail</b> и придумайте пароль (минимум 6 символов). Сразу после сохранения вы сможете входить по ним.</p>
                        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Ваш Email (Gmail)</label>
                        <input type="email" id="pb-email-input" placeholder="barber@gmail.com" autocomplete="email" style="width:100%;box-sizing:border-box;padding:11px 13px;border-radius:11px;border:1.5px solid #cbd5e1;font-size:14px;margin-bottom:10px;outline:none;">
                        <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:4px;">Пароль (мин. 6 знаков)</label>
                        <input type="password" id="pb-pass-input" placeholder="Минимум 6 символов" autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:11px 13px;border-radius:11px;border:1.5px solid #cbd5e1;font-size:14px;margin-bottom:12px;outline:none;">
                        <p id="pb-err" style="display:none;margin:0 0 10px;padding:9px 11px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:12.5px;font-weight:700;"></p>
                        <button type="button" id="pb-submit-btn" style="width:100%;padding:12px 16px;border-radius:12px;border:none;background:#0c192c;color:#ffffff;font-size:14px;font-weight:800;cursor:pointer;">Сохранить и привязать Email</button>
                    </div>
                `;
                document.body.appendChild(modal);
                const closeModal = () => { modal.style.display = 'none'; };
                modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
                modal.querySelector('#pb-close-btn').addEventListener('click', closeModal);
            }

            const openBtn = banner.querySelector('#partner-bind-email-open-btn');
            const emailEl = modal.querySelector('#pb-email-input');
            const passEl = modal.querySelector('#pb-pass-input');
            const errEl = modal.querySelector('#pb-err');
            const submitBtn = modal.querySelector('#pb-submit-btn');

            openBtn.addEventListener('click', () => {
                errEl.style.display = 'none';
                if (!emailEl.value && tenant.email && String(tenant.email).includes('@')) {
                    emailEl.value = String(tenant.email).trim();
                }
                modal.style.display = 'flex';
            });

            submitBtn.onclick = async () => {
                errEl.style.display = 'none';
                const email = (emailEl.value || '').trim();
                const pass = passEl.value || '';
                if (!window.appDB || !window.appDB.registerOrSignInWithEmail) {
                    errEl.textContent = 'Модуль авторизации ещё загружается. Повторите через 2 секунды.';
                    errEl.style.display = 'block';
                    return;
                }
                submitBtn.disabled = true;
                const oldLabel = submitBtn.textContent;
                submitBtn.textContent = '⏳ Привязываем Email...';
                try {
                    const { user } = await window.appDB.registerOrSignInWithEmail(email, pass);
                    const updated = await window.appDB.bindEmailToTenant(tenant.id, user);
                    await this.saveSession({
                        role: cfg.role || tenant.role || 'owner',
                        tenantId: String(tenant.id),
                        shopName: updated.shopName || tenant.shopName || '',
                        ownerEmail: updated.ownerEmail,
                        ownerUid: updated.ownerUid
                    });
                    modal.style.display = 'none';
                    banner.remove();
                    if (typeof cfg.onBound === 'function') cfg.onBound(updated);
                    alert(`✅ Email ${updated.ownerEmail} привязан к кабинету #${tenant.id}!\n\nТеперь вы можете входить по Email и паролю с любого устройства.`);
                } catch (err) {
                    errEl.textContent = (err && err.message) ? err.message : 'Не удалось привязать Email.';
                    errEl.style.display = 'block';
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = oldLabel;
                }
            };
            return banner;
        }
    };

    window.BarberMobileBridge = BarberMobileBridge;
})();
