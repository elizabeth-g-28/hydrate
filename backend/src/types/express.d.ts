import type { TokenPayload } from "../lib/jwt";

declare module "express-serve-static-core" {
  interface Request {
    user?: TokenPayload;
  }
}

export {};
