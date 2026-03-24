import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { sendError } from '../utils/response';

interface DecodedToken {
  id: string;
  role: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'Token taqdim etilmagan', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isBlocked: true, isVerified: true },
    });

    if (!user) return sendError(res, 'Foydalanuvchi topilmadi', 401);
    if (user.isBlocked) return sendError(res, 'Hisobingiz bloklangan', 403);

    req.user = user as any;
    next();
  } catch {
    return sendError(res, 'Token yaroqsiz', 401);
  }
};
