import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import User from '../models/User';
import StoreOwner from '../models/StoreOwner';
import Distributor from '../models/Distributor';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

const registerSchema = z.object({
  email:    z.string().email('Email formati noto\'g\'ri'),
  password: z.string().min(6, 'Parol kamida 6 belgi'),
  role:     z.enum(['STORE_OWNER', 'DISTRIBUTOR']),
  name:     z.string().min(2, 'Ism kamida 2 belgi'),
  address:  z.string().min(5, 'Manzil kiritilishi shart'),
  phone:    z.string().min(7, 'Telefon raqam kiritilishi shart'),
});

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((e) => e.message).join('. ');
    res.status(400); throw new Error(msg);
  }

  const { email, password, role, name, address, phone } = result.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400); throw new Error('Bu email bilan avval ro\'yxatdan o\'tilgan');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ email, password: hashedPassword, role });

  if (role === 'STORE_OWNER') {
    await StoreOwner.create({ userId: user._id, storeName: name, address, phone });
  } else {
    await Distributor.create({ userId: user._id, companyName: name, address, phone });
  }

  const token = generateToken(user._id.toString(), user.role);

  sendSuccess(res, { id: user._id, email: user.email, role: user.role, name, token },
    'Muvaffaqiyatli ro\'yxatdan o\'tdingiz', 201);
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400); throw new Error('Email va parol kiritilishi shart');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401); throw new Error('Email yoki parol noto\'g\'ri');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401); throw new Error('Email yoki parol noto\'g\'ri');
  }

  let name: string | undefined;
  if (user.role === 'STORE_OWNER') {
    const profile = await StoreOwner.findOne({ userId: user._id });
    name = profile?.storeName;
  } else {
    const profile = await Distributor.findOne({ userId: user._id });
    name = profile?.companyName;
  }

  const token = generateToken(user._id.toString(), user.role);

  sendSuccess(res, { id: user._id, email: user.email, role: user.role, name, token },
    'Muvaffaqiyatli kirdingiz', 200);
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401); throw new Error('Avtorizatsiya mavjud emas');
  }

  let name: string | undefined;
  if (req.user.role === 'STORE_OWNER') {
    const profile = await StoreOwner.findOne({ userId: req.user._id });
    name = profile?.storeName;
  } else {
    const profile = await Distributor.findOne({ userId: req.user._id });
    name = profile?.companyName;
  }

  sendSuccess(res, {
    id: req.user._id,
    email: req.user.email,
    role: req.user.role,
    name,
    createdAt: req.user.createdAt,
  }, 'Foydalanuvchi ma\'lumotlari', 200);
});
