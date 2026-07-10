import jwt from "jsonwebtoken";

export type TokenPayload = {
  userId: string;
  email: string;
};

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, REFRESH_SECRET) as TokenPayload;
