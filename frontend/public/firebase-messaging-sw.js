/* eslint-disable no-undef */
/*
 * Firebase Cloud Messaging service worker: shows web push notifications while the site is
 * closed or in the background. Served from the site root (Vite copies /public as is).
 *
 * The Firebase web config is passed in the registration URL query string by
 * src/services/firebase.tsx, because a service worker cannot read Vite env variables.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;
const config = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Messages with a `notification` block are displayed by the SDK itself. Only data-only
  // messages need to be shown here (otherwise the user would see them twice).
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    if (!data.title && !data.message) return;
    self.registration.showNotification(data.title || 'Beauty Doctors', {
      body: data.message || '',
      icon: '/logo.png',
      tag: data.notificationId || undefined,
      data,
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const fcmData = data.FCM_MSG && data.FCM_MSG.data ? data.FCM_MSG.data : data;
  const target = fcmData.link && String(fcmData.link).startsWith('/') ? fcmData.link : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(target).catch(() => undefined);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    }),
  );
});
