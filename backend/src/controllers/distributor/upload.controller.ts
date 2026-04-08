import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

export const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    if (req.file) {
      files.push(req.file);
    } else {
      res.status(400);
      throw new Error('No files uploaded');
    }
  }

  const urls = files.map(file => `/uploads/${file.filename}`);

  res.json({
    success: true,
    data: urls
  });
});
