import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { sendError } from '../utils/response';

interface DecodedToken {
  id: string;
  role: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { storeOwner?: any; distributor?: any };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Token taqdim etilmagan', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken;

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 'Foydalanuvchi topilmadi', 401);
    }

    req.user = user as any;
    next();
  } catch {
    return sendError(res, 'Token yaroqsiz', 401);
  }
};
