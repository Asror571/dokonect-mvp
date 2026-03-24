import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Topilmadi - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  sendError(res, err.message, statusCode, process.env.NODE_ENV === 'production' ? null : err.stack);
};
