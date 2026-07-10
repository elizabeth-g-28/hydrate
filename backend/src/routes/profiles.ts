import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const toProfileResponse = (profile: {
  id: string;
  name: string;
  weight: number;
  gender: string;
  activityLevel: string;
  wakeTime: string;
  sleepTime: string;
  dailyGoal: number;
  manualGoalOverride: boolean;
  unitSystem: string;
  theme: string;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: profile.id,
  name: profile.name,
  weight: profile.weight,
  gender: profile.gender,
  activityLevel: profile.activityLevel,
  wakeTime: profile.wakeTime,
  sleepTime: profile.sleepTime,
  dailyGoal: profile.dailyGoal,
  manualGoalOverride: profile.manualGoalOverride,
  unitSystem: profile.unitSystem,
  theme: profile.theme,
  onboardingComplete: profile.onboardingComplete,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!profile) {
    res.status(404).json({ error: "Profile not found." });
    return;
  }

  res.json({ profile: toProfileResponse(profile) });
});

router.put("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const {
    name,
    weight,
    gender,
    activityLevel,
    wakeTime,
    sleepTime,
    dailyGoal,
    manualGoalOverride,
    unitSystem,
    theme,
    onboardingComplete,
  } = req.body;

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      name: name ?? "User",
      weight: weight ?? 70,
      gender: gender ?? "male",
      activityLevel: activityLevel ?? "moderate",
      wakeTime: wakeTime ?? "07:00",
      sleepTime: sleepTime ?? "23:00",
      dailyGoal: dailyGoal ?? 2500,
      manualGoalOverride: manualGoalOverride ?? false,
      unitSystem: unitSystem ?? "metric",
      theme: theme ?? "dark",
      onboardingComplete: onboardingComplete ?? false,
    },
    update: {
      ...(name !== undefined && { name }),
      ...(weight !== undefined && { weight }),
      ...(gender !== undefined && { gender }),
      ...(activityLevel !== undefined && { activityLevel }),
      ...(wakeTime !== undefined && { wakeTime }),
      ...(sleepTime !== undefined && { sleepTime }),
      ...(dailyGoal !== undefined && { dailyGoal }),
      ...(manualGoalOverride !== undefined && { manualGoalOverride }),
      ...(unitSystem !== undefined && { unitSystem }),
      ...(theme !== undefined && { theme }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
    },
  });

  res.json({ profile: toProfileResponse(profile) });
});

export default router;
