import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// SIMPLIFIED AUTH CONTROLLER - MVP VERSION
// ============================================

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Phone number required'),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'DISTRIBUTOR', 'DRIVER', 'ADMIN']),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  console.log('📝 Register request:', { ...req.body, password: '***' });

  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const msg = result.error.issues.map((e) => e.message).join('. ');
    console.error('❌ Validation error:', msg);
    res.status(400);
    throw new Error(msg);
  }

  const { name, phone, email, password, role } = result.data;

  // Check if user exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : []),
      ],
    },
  } as any);

  if (existing) {
    console.error('❌ User already exists:', phone);
    res.status(400);
    throw new Error('User with this phone or email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create simple user - no complex relations
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
      subRole: role === 'DISTRIBUTOR' ? 'SUPER_ADMIN' : null,
    },
  });

  console.log('✅ User created:', { id: user.id, phone: user.phone, role: user.role });

  // Generate token
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      subRole: user.subRole,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('🔐 Login request:', { ...req.body, password: '***' });

  let { phone, email, password, rememberMe } = req.body;

  // Sanitize inputs - trim whitespace and normalize phone
  if (phone) {
    phone = phone.trim().replace(/[\s\-\(\)]/g, '');
  }
  if (email) email = email.trim();
  if (password) password = password.trim();

  if ((!phone && !email) || !password) {
    console.error('❌ Missing credentials');
    res.status(400);
    throw new Error('Phone/Email and password are required');
  }

  // Find user by phone or email
  const user: any = await prisma.user.findFirst({
    where: {
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    include: {
      client: true,
      distributor: true,
      driver: true,
    }
  } as any);

  if (!user) {
    console.error('❌ User not found:', phone || email);
    res.status(401);
    throw new Error('Invalid credentials');
  }

  console.log('✅ User found:', { id: user.id, phone: user.phone, role: user.role });

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    console.error('❌ Account locked until:', user.lockedUntil);
    res.status(403);
    throw new Error(`Account is locked. Try again in ${minutesLeft} minutes`);
  }

  if (user.status !== 'ACTIVE') {
    console.error('❌ User not active:', user.status);
    res.status(403);
    throw new Error('Account is suspended or inactive');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.error('❌ Password mismatch');

    // Increment failed login attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    let lockedUntil = null;

    // Lock account after 5 failed attempts for 15 minutes
    if (failedAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      console.error(`🔒 Account locked for user ${user.id} due to ${failedAttempts} failed attempts`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockedUntil: lockedUntil
      }
    });

    res.status(401);
    throw new Error('Invalid credentials');
  }

  console.log('✅ Password matched');

  // Reset failed login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });

  // Generate tokens (AUTH-01: 15 min access, 30 days refresh when rememberMe)
  const accessTokenExpiry = rememberMe ? '30d' : '15m';
  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      subRole: user.subRole,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: accessTokenExpiry }
  );

  const refreshTokenExpiry = rememberMe ? '30d' : '30d';
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: refreshTokenExpiry }
  );

  // Save refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastLogin: new Date()
    }
  });

  console.log('✅ Login successful:', { userId: user.id, role: user.role });

  // Return simplified response with role-specific data
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        permissions: user.permissions,
        avatar: user.avatar,
        clientId: user.client?.id || null,
        distributorId: user.distributor?.id || null,
        driverId: user.driver?.id || null,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.error('❌ Not authenticated');
    res.status(401);
    throw new Error('Not authenticated');
  }

  console.log('👤 Get me request:', req.user.userId);

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    console.error('❌ User not found:', req.user.userId);
    res.status(404);
    throw new Error('User not found');
  }

  console.log('✅ User found:', { id: user.id, role: user.role });

  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      permissions: user.permissions,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  console.log('🔄 Refresh token request');

  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.error('❌ No refresh token provided');
    res.status(400);
    throw new Error('Refresh token required');
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    ) as any;

    console.log('✅ Token decoded:', decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      console.error('❌ Invalid refresh token');
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    if (user.status !== 'ACTIVE') {
      console.error('❌ User not active');
      res.status(403);
      throw new Error('Account is suspended or inactive');
    }

    console.log('✅ User validated:', user.id);

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        subRole: user.subRole,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ New access token generated');

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          subRole: user.subRole,
          permissions: user.permissions,
          avatar: user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

export const validateToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    console.error('❌ Not authenticated');
    res.status(401);
    throw new Error('Not authenticated');
  }

  console.log('✅ Validate token:', req.user.userId);

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    console.error('❌ Invalid or inactive user');
    res.status(401);
    throw new Error('Invalid or inactive user');
  }

  console.log('✅ Token valid:', user.id);

  res.json({
    success: true,
    valid: true,
    data: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      permissions: user.permissions,
      avatar: user.avatar,
    },
  });
});
