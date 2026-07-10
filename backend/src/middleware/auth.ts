import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!bearerToken) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    req.user = verifyAccessToken(bearerToken);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token." });
  }
};
