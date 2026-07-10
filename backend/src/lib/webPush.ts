import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:hydrate@localhost";

export const isPushConfigured = (): boolean =>
  Boolean(publicKey && privateKey);

if (isPushConfigured()) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
}

export const getVapidPublicKey = (): string | null => publicKey ?? null;

export type PushKeys = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export const sendPushNotification = async (
  subscription: PushKeys,
  payload: { title: string; body: string; url?: string }
): Promise<void> => {
  if (!isPushConfigured()) {
    throw new Error("VAPID keys are not configured.");
  }

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    JSON.stringify(payload)
  );
};
