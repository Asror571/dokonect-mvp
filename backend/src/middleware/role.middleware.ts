import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, `Foydalanuvchi roli (${req.user?.role}) ushbu yo'nalishga ruxsatga ega emas`, 403);
    }
    next();
  };
};
