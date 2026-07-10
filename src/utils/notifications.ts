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

export const sendNotification = (title: string, body: string, tag?: string): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: tag ?? 'hydro-reminder',
    requireInteraction: false,
  });
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

/** Subscribe this device for closed-app reminders and save to backend */
export const subscribeToPush = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return true;

    const { publicKey } = await getVapidPublicKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    await savePushSubscription(subscription.toJSON());
    return true;
  } catch (error) {
    console.error('Push subscribe failed:', error);
    return false;
  }
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
    // Ignore if already removed server-side
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
