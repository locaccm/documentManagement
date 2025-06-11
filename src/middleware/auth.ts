import { Request, Response, NextFunction } from "express";
import axios from "axios";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    status: string;
  };
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.sendStatus(401);
    }
    const token = authHeader.substring(7);

    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/access/check`,
      { token, rightName: "VIEW_DOCUMENTS" },
      { headers: { "Content-Type": "application/json" } },
    );

    if (response.status === 200) {
      const { userId, email, status } = response.data;
      req.user = { userId, email, status };
      return next();
    } else if (response.status === 403) {
      return res.sendStatus(403);
    } else {
      return res.sendStatus(401);
    }
  } catch (err: any) {
    console.error("Erreur auth:", err.message);
    return res.sendStatus(401);
  }
};
