import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import { z } from 'zod/v4';
import prisma from '../prisma/client';
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

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((e) => e.message).join('. ');
    res.status(400); throw new Error(msg);
  }

  const { email, password, role, name, address, phone } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { res.status(400); throw new Error('Bu email bilan avval ro\'yxatdan o\'tilgan'); }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role as any,
      ...(role === 'STORE_OWNER'
        ? { storeOwner: { create: { storeName: name, address, phone } } }
        : { distributor: { create: { companyName: name, address, phone } } }),
    },
  });

  const token = generateToken(user.id, user.role);
  sendSuccess(res, { id: user.id, email: user.email, role: user.role, name, token },
    'Muvaffaqiyatli ro\'yxatdan o\'tdingiz', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Email va parol kiritilishi shart'); }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { storeOwner: true, distributor: true },
  });

  if (!user) { res.status(401); throw new Error('Email yoki parol noto\'g\'ri'); }
  if (user.isBlocked) { res.status(403); throw new Error('Hisobingiz bloklangan'); }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) { res.status(401); throw new Error('Email yoki parol noto\'g\'ri'); }

  const name = user.storeOwner?.storeName || user.distributor?.companyName || 'Admin';
  const token = generateToken(user.id, user.role);

  sendSuccess(res, {
    id: user.id, email: user.email, role: user.role, name,
    isVerified: user.distributor?.isVerified ?? user.isVerified,
    token,
  }, 'Muvaffaqiyatli kirdingiz', 200);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) { res.status(401); throw new Error('Avtorizatsiya mavjud emas'); }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { storeOwner: true, distributor: true },
  });

  if (!user) { res.status(404); throw new Error('Foydalanuvchi topilmadi'); }

  const name = user.storeOwner?.storeName || user.distributor?.companyName || 'Admin';

  sendSuccess(res, {
    id: user.id, email: user.email, role: user.role, name,
    isVerified: user.distributor?.isVerified ?? user.isVerified,
    createdAt: user.createdAt,
  }, 'Foydalanuvchi ma\'lumotlari', 200);
});
