import { prisma } from "../lib/prisma";
import { sendPushNotification, isPushConfigured } from "../lib/webPush";

const SCHEDULE_WINDOW_MINUTES = 15;

/** Minutes since midnight in the given IANA timezone */
const getMinutesInTimeZone = (timeZone: string, now = new Date()): number => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
};

/** YYYY-MM-DD in the given IANA timezone */
const getDateStringInTimeZone = (timeZone: string, now = new Date()): string => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().split("T")[0];
  }
};

const parseHhMmToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const isInDndWindow = (
  dndStart: string,
  dndEnd: string,
  timeZone: string,
  now = new Date()
): boolean => {
  const currentMinutes = getMinutesInTimeZone(timeZone, now);
  const startMinutes = parseHhMmToMinutes(dndStart);
  const endMinutes = parseHhMmToMinutes(dndEnd);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

/** True if local clock is within ±windowMinutes of target HH:mm */
const isInScheduleWindow = (
  targetHhMm: string,
  timeZone: string,
  now: Date,
  windowMinutes = SCHEDULE_WINDOW_MINUTES
): boolean => {
  const current = getMinutesInTimeZone(timeZone, now);
  const target = parseHhMmToMinutes(targetHhMm);
  const diff = Math.abs(current - target);
  const wrapDiff = Math.min(diff, 24 * 60 - diff);
  return wrapDiff <= windowMinutes;
};

const wasSentOnLocalDate = (
  sentAt: Date | null | undefined,
  timeZone: string,
  today: string
): boolean => {
  if (!sentAt) return false;
  return getDateStringInTimeZone(timeZone, sentAt) === today;
};

const formatAmount = (ml: number): string => {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
};

type PushPayload = { title: string; body: string; url: string };

const sendToUserSubs = async (
  userId: string,
  subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
): Promise<boolean> => {
  let sentAny = false;
  for (const sub of subs) {
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
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode: number }).statusCode)
          : 0;

      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error(`Push failed for ${sub.endpoint}:`, error);
      }
    }
  }
  return sentAny;
};

/** Server-side reminder dispatch — runs on a timer in the backend process */
export const dispatchReminderPushes = async (): Promise<void> => {
  if (!isPushConfigured()) return;

  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      reminders: { is: { enabled: true } },
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

    const timeZone = profile.timezone || "UTC";

    if (
      settings.dndEnabled &&
      isInDndWindow(settings.dndStart, settings.dndEnd, timeZone, now)
    ) {
      continue;
    }

    const today = getDateStringInTimeZone(timeZone, now);
    const entries = await prisma.waterEntry.findMany({
      where: { userId: user.id, date: today },
      select: { amount: true },
    });

    const todayTotal = entries.reduce((sum, e) => sum + e.amount, 0);
    const remaining = profile.dailyGoal - todayTotal;
    if (remaining <= 0) continue;

    const remainingText = formatAmount(remaining);
    const totalText = formatAmount(todayTotal);

    // Morning Boost — once/day near wakeTime
    if (
      settings.morningBoost &&
      isInScheduleWindow(profile.wakeTime, timeZone, now) &&
      !wasSentOnLocalDate(settings.lastMorningBoostAt, timeZone, today)
    ) {
      const sent = await sendToUserSubs(user.id, user.pushSubs, {
        title: "🌅 Morning boost",
        body: `Start hydrated — ${remainingText} left toward today's goal.`,
        url: "/home",
      });
      if (sent) {
        await prisma.reminderSettings.update({
          where: { userId: user.id },
          data: { lastMorningBoostAt: now, lastPushAt: now },
        });
        continue;
      }
    }

    // Evening Wind-down — once/day near sleepTime
    if (
      settings.eveningWinddown &&
      isInScheduleWindow(profile.sleepTime, timeZone, now) &&
      !wasSentOnLocalDate(settings.lastEveningWinddownAt, timeZone, today)
    ) {
      const sent = await sendToUserSubs(user.id, user.pushSubs, {
        title: "🌙 Evening wind-down",
        body: `Wrap up your day — ${remainingText} still to go (${totalText} so far).`,
        url: "/home",
      });
      if (sent) {
        await prisma.reminderSettings.update({
          where: { userId: user.id },
          data: { lastEveningWinddownAt: now, lastPushAt: now },
        });
        continue;
      }
    }

    // Hourly / fixed interval — cadence from lastPushAt (not last water log)
    if (!settings.fixedInterval) continue;

    const intervalMs = settings.intervalMinutes * 60 * 1000;
    if (
      settings.lastPushAt &&
      now.getTime() - settings.lastPushAt.getTime() < intervalMs
    ) {
      continue;
    }

    const sent = await sendToUserSubs(user.id, user.pushSubs, {
      title: "💧 Time to hydrate!",
      body: `You've had ${totalText} today. ${remainingText} to go!`,
      url: "/home",
    });

    if (sent) {
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
