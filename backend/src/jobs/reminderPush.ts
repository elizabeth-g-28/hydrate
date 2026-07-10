import { prisma } from "../lib/prisma";
import { sendPushNotification, isPushConfigured } from "../lib/webPush";

const isInDndWindow = (dndStart: string, dndEnd: string, now = new Date()): boolean => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = dndStart.split(":").map(Number);
  const [endH, endM] = dndEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

const getDateString = (date = new Date()): string =>
  date.toISOString().split("T")[0];

const formatAmount = (ml: number): string => {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
};

/** Server-side reminder dispatch — runs on a timer in the backend process */
export const dispatchReminderPushes = async (): Promise<void> => {
  if (!isPushConfigured()) return;

  const now = new Date();
  const today = getDateString(now);

  const users = await prisma.user.findMany({
    where: {
      reminders: {
        is: {
          enabled: true,
          fixedInterval: true,
        },
      },
      pushSubs: { some: {} },
      profile: { is: { onboardingComplete: true } },
    },
    include: {
      profile: true,
      reminders: true,
      pushSubs: true,
    },
  });

  for (const user of users) {
    const settings = user.reminders;
    const profile = user.profile;
    if (!settings || !profile) continue;

    if (
      settings.dndEnabled &&
      isInDndWindow(settings.dndStart, settings.dndEnd, now)
    ) {
      continue;
    }

    const intervalMs = settings.intervalMinutes * 60 * 1000;
    if (
      settings.lastPushAt &&
      now.getTime() - settings.lastPushAt.getTime() < intervalMs
    ) {
      continue;
    }

    const entries = await prisma.waterEntry.findMany({
      where: { userId: user.id, date: today },
      select: { amount: true },
    });
    const todayTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    const remaining = profile.dailyGoal - todayTotal;
    if (remaining <= 0) continue;

    const payload = {
      title: "💧 Time to hydrate!",
      body: `You've had ${formatAmount(todayTotal)} today. ${formatAmount(remaining)} to go!`,
      url: "/home",
    };

    let sentAny = false;
    for (const sub of user.pushSubs) {
      try {
        await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sentAny = true;
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error
            ? Number((error as { statusCode: number }).statusCode)
            : 0;

        // Gone / expired subscription
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, error);
        }
      }
    }

    if (sentAny) {
      await prisma.reminderSettings.update({
        where: { userId: user.id },
        data: { lastPushAt: now },
      });
    }
  }
};

export const startReminderPushJob = (): void => {
  if (!isPushConfigured()) {
    console.warn("Push reminders disabled — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
    return;
  }

  const intervalMs = Number(process.env.REMINDER_PUSH_CHECK_MS) || 60_000;
  console.log(`Reminder push job running every ${intervalMs / 1000}s`);

  void dispatchReminderPushes();
  setInterval(() => {
    void dispatchReminderPushes();
  }, intervalMs);
};
