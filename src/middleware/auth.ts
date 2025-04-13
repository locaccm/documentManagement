import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { userId: number; email: string };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
            // TODO ne pas oublier d'ajouter la clé secret de signature du JWT dans le .env
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
