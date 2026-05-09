/**
 * NeuronHire Push Notification Service Worker handler
 * Handles background push events and notification actions.
 * This file is imported by the next-pwa generated service worker.
 */

// Push event — show notification
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'NeuronHire', body: event.data.text(), type: 'generic' };
  }

  const { title, body, type, url, icon } = payload;

  const notificationOptions = getNotificationOptions(type, body, url, icon);

  event.waitUntil(
    self.registration.showNotification(title || 'NeuronHire', notificationOptions)
  );
});

// Notification click — handle actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  let targetUrl = '/dashboard';

  if (action === 'view_bounty' || data.type === 'bounty') {
    targetUrl = data.url || '/engineer/bounties';
  } else if (action === 'view_wallet' || data.type === 'payment') {
    targetUrl = '/engineer/wallet';
  } else if (action === 'reply' || data.type === 'message') {
    targetUrl = data.url || '/engineer/messages';
  } else if (action === 'view_contract' || data.type === 'proposal') {
    targetUrl = data.url || '/engineer/contracts';
  } else if (data.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Notification close tracking
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  // Analytics: track dismissed notifications
  if (data.notificationId) {
    // In production: POST to /api/notifications/dismissed
  }
});

/**
 * Build notification options based on notification type
 */
function getNotificationOptions(type, body, url, icon) {
  const baseOptions = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: { url, type },
    requireInteraction: false,
    silent: false,
  };

  switch (type) {
    case 'bounty':
      return {
        ...baseOptions,
        tag: 'bounty-notification',
        actions: [
          { action: 'view_bounty', title: 'View Bounty', icon: '/icons/action-view.png' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    case 'payment':
      return {
        ...baseOptions,
        tag: 'payment-notification',
        requireInteraction: true,
        actions: [
          { action: 'view_wallet', title: 'View Wallet', icon: '/icons/action-wallet.png' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    case 'message':
      return {
        ...baseOptions,
        tag: `message-${Date.now()}`,
        renotify: true,
        actions: [
          { action: 'reply', title: 'Reply', icon: '/icons/action-reply.png' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    case 'proposal':
      return {
        ...baseOptions,
        tag: 'proposal-notification',
        requireInteraction: true,
        actions: [
          { action: 'view_contract', title: 'View Contract', icon: '/icons/action-contract.png' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

    default:
      return baseOptions;
  }
}
