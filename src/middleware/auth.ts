import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    // TODO don't forget to add the JWT secret signature key to the .env / see if you use this method
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = decoded as { userId: number; email: string };
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
