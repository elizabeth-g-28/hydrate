import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const toReminderResponse = (settings: {
  enabled: boolean;
  fixedInterval: boolean;
  intervalMinutes: number;
  morningBoost: boolean;
  eveningWinddown: boolean;
  dndEnabled: boolean;
  dndStart: string;
  dndEnd: string;
}) => ({
  enabled: settings.enabled,
  fixedInterval: settings.fixedInterval,
  intervalMinutes: settings.intervalMinutes,
  morningBoost: settings.morningBoost,
  eveningWinddown: settings.eveningWinddown,
  dndEnabled: settings.dndEnabled,
  dndStart: settings.dndStart,
  dndEnd: settings.dndEnd,
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const settings = await prisma.reminderSettings.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!settings) {
    res.json({
      settings: toReminderResponse({
        enabled: true,
        fixedInterval: true,
        intervalMinutes: 60,
        morningBoost: true,
        eveningWinddown: true,
        dndEnabled: false,
        dndStart: "22:00",
        dndEnd: "07:00",
      }),
    });
    return;
  }

  res.json({ settings: toReminderResponse(settings) });
});

router.put("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const {
    enabled,
    fixedInterval,
    intervalMinutes,
    morningBoost,
    eveningWinddown,
    dndEnabled,
    dndStart,
    dndEnd,
  } = req.body;

  const settings = await prisma.reminderSettings.upsert({
    where: { userId },
    create: {
      userId,
      enabled: enabled ?? true,
      fixedInterval: fixedInterval ?? true,
      intervalMinutes: intervalMinutes ?? 60,
      morningBoost: morningBoost ?? true,
      eveningWinddown: eveningWinddown ?? true,
      dndEnabled: dndEnabled ?? false,
      dndStart: dndStart ?? "22:00",
      dndEnd: dndEnd ?? "07:00",
    },
    update: {
      ...(enabled !== undefined && { enabled }),
      ...(fixedInterval !== undefined && { fixedInterval }),
      ...(intervalMinutes !== undefined && { intervalMinutes }),
      ...(morningBoost !== undefined && { morningBoost }),
      ...(eveningWinddown !== undefined && { eveningWinddown }),
      ...(dndEnabled !== undefined && { dndEnabled }),
      ...(dndStart !== undefined && { dndStart }),
      ...(dndEnd !== undefined && { dndEnd }),
    },
  });

  res.json({ settings: toReminderResponse(settings) });
});

export default router;
