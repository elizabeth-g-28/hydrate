import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
} from '../lib/api';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/** Prefer SW notifications — `new Notification` is unreliable on mobile PWAs */
export const sendNotification = (title: string, body: string, tag?: string): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: tag ?? 'hydro-reminder',
    requireInteraction: false,
  };

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready
      .then((registration) => registration.showNotification(title, options))
      .catch(() => {
        try {
          new Notification(title, options);
        } catch {
          // ignore
        }
      });
    return;
  }

  try {
    new Notification(title, options);
  } catch {
    // ignore
  }
};

export const isNotificationSupported = (): boolean => 'Notification' in window;

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const uint8ArraysEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

let subscribeInFlight: Promise<boolean> | null = null;

/** Subscribe this device for closed-app reminders and save to backend */
export const subscribeToPush = async (): Promise<boolean> => {
  if (subscribeInFlight) return subscribeInFlight;

  subscribeInFlight = (async () => {
    if (!isPushSupported()) return false;

    const granted = await requestNotificationPermission();
    if (!granted) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const { publicKey } = await getVapidPublicKey();
      const appServerKey = urlBase64ToUint8Array(publicKey);

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const currentKey = subscription.options.applicationServerKey;
        // Mobile browsers often omit applicationServerKey — keep & re-sync
        const keyMatches =
          currentKey == null ||
          uint8ArraysEqual(new Uint8Array(currentKey), appServerKey);

        if (!keyMatches) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as BufferSource,
        });
      }

      await savePushSubscription(subscription.toJSON());
      return true;
    } catch (error) {
      console.error('Push subscribe failed:', error);
      return false;
    }
  })().finally(() => {
    subscribeInFlight = null;
  });

  return subscribeInFlight;
};

export const unsubscribeFromPush = async (): Promise<void> => {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  try {
    await removePushSubscription(endpoint);
  } catch {
    // ignore
  }
};

export const hasPushSubscription = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
};
