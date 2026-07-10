import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profiles";
import waterEntryRoutes from "./routes/waterEntries";
import reminderRoutes from "./routes/reminders";
import pushRoutes from "./routes/push";
import { startReminderPushJob } from "./jobs/reminderPush";

const app = express();
const PORT = process.env.PORT || 4001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

const devOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = isProd ? [FRONTEND_URL] : devOrigins;
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Hydrate backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/water-entries", waterEntryRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/push", pushRoutes);

app.listen(PORT, () => {
  console.log(`Hydrate backend running at http://localhost:${PORT}`);
  startReminderPushJob();
});
