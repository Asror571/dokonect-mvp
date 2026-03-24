import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import StoreOwner from '../models/StoreOwner';
import Distributor from '../models/Distributor';
import { sendSuccess } from '../utils/response';

// GET /api/profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) { res.status(401); throw new Error('Avtorizatsiya yo\'q'); }

  let profile;
  if (req.user.role === 'STORE_OWNER') {
    profile = await StoreOwner.findOne({ userId: req.user._id }).lean();
  } else {
    profile = await Distributor.findOne({ userId: req.user._id }).lean();
  }

  sendSuccess(res, profile, 'Profil ma\'lumotlari', 200);
});

// PUT /api/profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) { res.status(401); throw new Error('Avtorizatsiya yo\'q'); }

  const { name, address, phone } = req.body;
  let updated;

  if (req.user.role === 'STORE_OWNER') {
    updated = await StoreOwner.findOneAndUpdate(
      { userId: req.user._id },
      { storeName: name, address, phone },
      { new: true }
    );
  } else {
    updated = await Distributor.findOneAndUpdate(
      { userId: req.user._id },
      { companyName: name, address, phone },
      { new: true }
    );
  }

  sendSuccess(res, updated, 'Profil yangilandi', 200);
});
