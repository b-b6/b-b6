/* Firebase Cloud Messaging Service Worker for Multi-Tenant Barber SaaS */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('push', function (event) {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (e) {
        payload = {
            notification: {
                title: '✂️ Новая запись!',
                body: event.data ? event.data.text() : 'Проверьте панель управления'
            }
        };
    }

    const title = (payload.notification && payload.notification.title) || '✂️ Новая запись в барбершоп!';
    const options = {
        body: (payload.notification && payload.notification.body) || 'Новая бронь клиента',
        icon: 'assets/pwa-icon-192.png',
        badge: 'assets/pwa-icon-192.png',
        vibrate: [200, 100, 200],
        data: payload.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const tenantId = (event.notification.data && event.notification.data.tenantId) || 'default';
    const targetUrl = `/admin.html?id=${encodeURIComponent(tenantId)}`;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
