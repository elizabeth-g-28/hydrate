import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { getRefreshCookieOptions, getClearCookieOptions } from "../lib/cookies";
import { requireAuth } from "../middleware/auth";

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user: { id: string; email: string; name: string; createdAt: Date }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
});

const issueAuthTokens = (
  res: Response,
  user: { id: string; email: string; name: string; createdAt: Date },
  message = "Login successful."
) => {
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
  res.json({
    message,
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  });
};

router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name: "", email, passwordHash } });

  res.status(201).json({ message: "Account created.", user: sanitizeUser(user) });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google sign-in. Please sign in with Google." });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  issueAuthTokens(res, user);
});

router.post("/google", async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ error: "Google credential is required." });
    return;
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: "Google sign-in is not configured on the server." });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      res.status(401).json({ error: "Invalid Google token." });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? payload.given_name ?? "";

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingByEmail) {
        if (existingByEmail.googleId && existingByEmail.googleId !== googleId) {
          res.status(409).json({ error: "This email is linked to a different Google account." });
          return;
        }

        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId,
            name: existingByEmail.name || name,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            name,
            googleId,
            passwordHash: null,
          },
        });
      }
    }

    issueAuthTokens(res, user, "Google sign-in successful.");
  } catch (error) {
    console.error("Google auth failed:", error);
    res.status(401).json({ error: "Google sign-in failed." });
  }
});

router.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.clearCookie("refreshToken", getClearCookieOptions());
  res.json({ message: "Logged out." });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

router.post("/refresh", async (req: Request, res: Response) => {
  // Prefer body (localStorage) over cookie — cross-site cookies are unreliable
  // (Safari / Chrome third-party) and a stale cookie must not override a valid body token.
  const refreshToken = req.body?.refreshToken ?? req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token." });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token." });
  }
});

export default router;
