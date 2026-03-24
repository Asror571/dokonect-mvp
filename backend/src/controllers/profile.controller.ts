import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

// GET /api/profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) { res.status(401); throw new Error('Avtorizatsiya yo\'q'); }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { storeOwner: true, distributor: true },
  });

  sendSuccess(res, user, 'Profil ma\'lumotlari', 200);
});

// PUT /api/profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) { res.status(401); throw new Error('Avtorizatsiya yo\'q'); }

  const { name, address, phone } = req.body;

  if (req.user.role === 'STORE_OWNER') {
    const updated = await prisma.storeOwner.update({
      where: { userId: req.user.id },
      data: { storeName: name, address, phone },
    });
    sendSuccess(res, updated, 'Profil yangilandi', 200);
  } else {
    const updated = await prisma.distributor.update({
      where: { userId: req.user.id },
      data: { companyName: name, address, phone },
    });
    sendSuccess(res, updated, 'Profil yangilandi', 200);
  }
});
