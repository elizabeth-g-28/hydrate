import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const toEntryResponse = (entry: {
  id: string;
  amount: number;
  timestamp: Date;
  date: string;
  note: string | null;
}) => ({
  id: entry.id,
  amount: entry.amount,
  timestamp: entry.timestamp.toISOString(),
  date: entry.date,
  note: entry.note ?? undefined,
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { date, from, to } = req.query;

  const where: { userId: string; date?: string | { gte: string; lte: string } } = { userId };

  if (typeof date === "string") {
    where.date = date;
  } else if (typeof from === "string" && typeof to === "string") {
    where.date = { gte: from, lte: to };
  }

  const entries = await prisma.waterEntry.findMany({
    where,
    orderBy: { timestamp: "asc" },
  });

  res.json({ entries: entries.map(toEntryResponse) });
});

router.get("/summaries", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const days = Math.min(parseInt(String(req.query.days ?? "365"), 10) || 365, 365);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const fromDate = startDate.toISOString().slice(0, 10);

  const entries = await prisma.waterEntry.findMany({
    where: { userId, date: { gte: fromDate } },
    select: { date: true, amount: true },
  });

  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.amount);
  }

  const summaries = Array.from(totals.entries()).map(([date, totalIntake]) => ({
    date,
    totalIntake,
  }));

  res.json({ summaries });
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { amount, timestamp, date, note } = req.body;

  if (!amount || !timestamp || !date) {
    res.status(400).json({ error: "amount, timestamp, and date are required." });
    return;
  }

  const entry = await prisma.waterEntry.create({
    data: {
      userId,
      amount: Number(amount),
      timestamp: new Date(timestamp),
      date,
      note: note ?? null,
    },
  });

  res.status(201).json({ entry: toEntryResponse(entry) });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const entry = await prisma.waterEntry.findFirst({ where: { id, userId } });
  if (!entry) {
    res.status(404).json({ error: "Entry not found." });
    return;
  }

  await prisma.waterEntry.delete({ where: { id } });
  res.json({ message: "Entry deleted." });
});

export default router;
