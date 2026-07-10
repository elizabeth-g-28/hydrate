import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { getVapidPublicKey, isPushConfigured, sendPushNotification } from "../lib/webPush";

const router = Router();

router.get("/vapid-public-key", (_req: Request, res: Response) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Push notifications are not configured." });
    return;
  }

  res.json({ publicKey: getVapidPublicKey() });
});

router.post("/subscribe", requireAuth, async (req: Request, res: Response) => {
  const { endpoint, keys } = req.body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid push subscription." });
    return;
  }

  const userId = req.user!.userId;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  res.json({ message: "Subscribed to push notifications." });
});

router.delete("/unsubscribe", requireAuth, async (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint?: string };

  if (!endpoint) {
    res.status(400).json({ error: "endpoint is required." });
    return;
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId: req.user!.userId, endpoint },
  });

  res.json({ message: "Unsubscribed from push notifications." });
});

/** Send one test notification to this user's devices (for verifying closed-app push) */
router.post("/test", requireAuth, async (req: Request, res: Response) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Push notifications are not configured." });
    return;
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: req.user!.userId },
  });

  if (subs.length === 0) {
    res.status(400).json({ error: "No push subscription on this account. Enable notifications first." });
    return;
  }

  let sent = 0;

  for (const sub of subs) {
    try {
      await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        {
          title: "💧 Hydrate test",
          body: "Push works — you can get reminders even when the app is closed.",
          url: "/home",
        }
      );
      sent++;
    } catch (error) {
      console.error("Test push failed:", error);
    }
  }

  res.json({ message: `Sent test push to ${sent} device(s).` });
});

export default router;
