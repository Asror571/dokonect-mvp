import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PRICING MANAGEMENT - DISTRIBUTOR
// ============================================

// PRICE-01: B2B Individual Pricing
const priceRuleSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  clientId: z.string().optional(),
  price: z.number().min(0),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export const createPriceRule = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = priceRuleSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { productId, variantId, clientId, price, validFrom, validTo } = result.data;

  // Verify product belongs to distributor
  const product = await prisma.product.findFirst({
    where: { id: productId, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const priceRule = await prisma.priceRule.create({
    data: {
      productId,
      variantId,
      clientId,
      price,
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
    },
    include: {
      product: true,
      client: {
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Price rule created successfully',
    data: priceRule
  });
});

export const getPriceRules = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { productId, clientId } = req.query;

  const where: any = {
    product: { distributorId }
  };

  if (productId) where.productId = productId;
  if (clientId) where.clientId = clientId;

  const priceRules = await prisma.priceRule.findMany({
    where,
    include: {
      product: {
        include: {
          images: { take: 1 }
        }
      },
      client: {
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: priceRules
  });
});

export const updatePriceRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const priceRule = await prisma.priceRule.findFirst({
    where: {
      id,
      product: { distributorId }
    }
  });

  if (!priceRule) {
    res.status(404);
    throw new Error('Price rule not found');
  }

  const result = priceRuleSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;
  if (data.validFrom) data.validFrom = new Date(data.validFrom);
  if (data.validTo) data.validTo = new Date(data.validTo);

  const updated = await prisma.priceRule.update({
    where: { id },
    data,
    include: {
      product: true,
      client: {
        include: {
          user: {
            select: { name: true, phone: true }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    message: 'Price rule updated successfully',
    data: updated
  });
});

export const deletePriceRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const priceRule = await prisma.priceRule.findFirst({
    where: {
      id,
      product: { distributorId }
    }
  });

  if (!priceRule) {
    res.status(404);
    throw new Error('Price rule not found');
  }

  await prisma.priceRule.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Price rule deleted successfully'
  });
});

// PRICE-02: Bulk Discount Rules
const bulkRuleSchema = z.object({
  productId: z.string(),
  minQuantity: z.number().int().min(1),
  maxQuantity: z.number().int().optional(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().min(0),
});

export const createBulkRule = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = bulkRuleSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;

  // Verify product
  const product = await prisma.product.findFirst({
    where: { id: data.productId, distributorId }
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Validate discount
  if (data.discountType === 'PERCENT' && data.discountValue > 100) {
    res.status(400);
    throw new Error('Percent discount cannot exceed 100%');
  }

  const bulkRule = await prisma.bulkRule.create({
    data,
    include: {
      product: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Bulk rule created successfully',
    data: bulkRule
  });
});

export const getBulkRules = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const { productId } = req.query;

  const where: any = {
    product: { distributorId }
  };

  if (productId) where.productId = productId;

  const bulkRules = await prisma.bulkRule.findMany({
    where,
    include: {
      product: {
        include: {
          images: { take: 1 }
        }
      }
    },
    orderBy: { minQuantity: 'asc' }
  });

  res.json({
    success: true,
    data: bulkRules
  });
});

export const updateBulkRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const bulkRule = await prisma.bulkRule.findFirst({
    where: {
      id,
      product: { distributorId }
    }
  });

  if (!bulkRule) {
    res.status(404);
    throw new Error('Bulk rule not found');
  }

  const result = bulkRuleSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const updated = await prisma.bulkRule.update({
    where: { id },
    data: result.data,
    include: {
      product: true
    }
  });

  res.json({
    success: true,
    message: 'Bulk rule updated successfully',
    data: updated
  });
});

export const deleteBulkRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const bulkRule = await prisma.bulkRule.findFirst({
    where: {
      id,
      product: { distributorId }
    }
  });

  if (!bulkRule) {
    res.status(404);
    throw new Error('Bulk rule not found');
  }

  await prisma.bulkRule.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Bulk rule deleted successfully'
  });
});

// PRICE-03: Promo Codes
const promoCodeSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  usesPerClient: z.number().int().min(1).default(1),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  applicableTo: z.any().optional(), // JSON for specific clients
});

export const createPromoCode = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const result = promoCodeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400);
    throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const data = result.data;

  // Check code uniqueness
  const existing = await prisma.promoCode.findUnique({
    where: { code: data.code }
  });

  if (existing) {
    res.status(400);
    throw new Error('Promo code already exists');
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      ...data,
      distributorId,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
    }
  });

  res.status(201).json({
    success: true,
    message: 'Promo code created successfully',
    data: promoCode
  });
});

export const getPromoCodes = asyncHandler(async (req: Request, res: Response) => {
  const distributorId = req.user?.distributorId;
  if (!distributorId) {
    res.status(403);
    throw new Error('Distributor access required');
  }

  const promoCodes = await prisma.promoCode.findMany({
    where: { distributorId },
    include: {
      _count: {
        select: { usages: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: promoCodes
  });
});

export const validatePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderAmount, clientId } = req.body;

  if (!code || !orderAmount) {
    res.status(400);
    throw new Error('Code and order amount required');
  }

  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      usages: {
        where: { clientId }
      }
    }
  });

  if (!promoCode) {
    res.status(404);
    throw new Error('Invalid promo code');
  }

  // Check validity period
  const now = new Date();
  if (promoCode.validFrom && now < promoCode.validFrom) {
    res.status(400);
    throw new Error('Promo code not yet valid');
  }
  if (promoCode.validTo && now > promoCode.validTo) {
    res.status(400);
    throw new Error('Promo code expired');
  }

  // Check min order amount
  if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount is ${promoCode.minOrderAmount}`);
  }

  // Check max uses
  if (promoCode.maxUses) {
    const totalUsages = await prisma.promoUsage.count({
      where: { promoCodeId: promoCode.id }
    });
    if (totalUsages >= promoCode.maxUses) {
      res.status(400);
      throw new Error('Promo code usage limit reached');
    }
  }

  // Check uses per client
  if (clientId && promoCode.usages.length >= promoCode.usesPerClient) {
    res.status(400);
    throw new Error('You have already used this promo code');
  }

  // Calculate discount
  let discount = 0;
  if (promoCode.discountType === 'PERCENT') {
    discount = (orderAmount * promoCode.discountValue) / 100;
  } else {
    discount = promoCode.discountValue;
  }

  res.json({
    success: true,
    valid: true,
    data: {
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discount,
      finalAmount: Math.max(0, orderAmount - discount)
    }
  });
});

export const deletePromoCode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const distributorId = req.user?.distributorId;

  const promoCode = await prisma.promoCode.findFirst({
    where: { id, distributorId }
  });

  if (!promoCode) {
    res.status(404);
    throw new Error('Promo code not found');
  }

  await prisma.promoCode.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Promo code deleted successfully'
  });
});
