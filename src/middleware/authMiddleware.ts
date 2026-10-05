import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      message: "Authentication is not configured",
    });
    return;
  }

  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  const token = match?.[1];

  if (!token) {
    res.status(401).json({
      message: "Authentication token is required",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(payload.sub)
    ) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    res.locals.userId = payload.sub;
  } catch {
    res.status(401).json({
      message: "Invalid or expired authentication token",
    });
    return;
  }

  next();
}
