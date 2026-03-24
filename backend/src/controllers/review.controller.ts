import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod/v4';
import prisma from '../prisma/client';
import { sendSuccess } from '../utils/response';

const reviewSchema = z.object({
  productId: z.string(),
  rating:    z.number().int().min(1).max(5),
  comment:   z.string().optional(),
});

// POST /api/reviews
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  if (!storeOwner) { res.status(403); throw new Error('Do\'kon egasi profili topilmadi'); }

  const result = reviewSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400); throw new Error(result.error.issues.map(e => e.message).join('. '));
  }

  const { productId, rating, comment } = result.data;

  // Check DELIVERED order
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      storeOwnerId: storeOwner.id,
      status: 'DELIVERED',
      items: { some: { productId } },
    },
  });

  if (!deliveredOrder) {
    res.status(403); throw new Error('Faqat yetkazilgan buyurtmadan keyin sharh yozish mumkin');
  }

  const review = await prisma.review.create({
    data: { productId, storeOwnerId: storeOwner.id, rating, comment },
    include: { storeOwner: { select: { storeName: true } } },
  });

  // Update product avgRating
  const stats = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating:   stats._avg.rating || 0,
      reviewCount: stats._count.id,
    },
  });

  sendSuccess(res, review, 'Sharh qo\'shildi', 201);
});

// GET /api/reviews/product/:productId
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const productId = String(req.params.productId);
  const page  = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip  = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: { storeOwner: { select: { storeName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  sendSuccess(res, { reviews, total, page }, 'Sharhlar', 200);
});

// DELETE /api/reviews/:id
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const reviewId = String(req.params.id);
  const storeOwner = await prisma.storeOwner.findUnique({ where: { userId: req.user!.id } });
  if (!storeOwner) { res.status(403); throw new Error('Profil topilmadi'); }

  const review = await prisma.review.findFirst({
    where: { id: reviewId, storeOwnerId: storeOwner.id },
  });
  if (!review) { res.status(404); throw new Error('Sharh topilmadi'); }

  await prisma.review.delete({ where: { id: reviewId } });

  // Recalculate
  const stats = await prisma.review.aggregate({
    where: { productId: review.productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.product.update({
    where: { id: review.productId },
    data: { avgRating: stats._avg.rating || 0, reviewCount: stats._count.id },
  });

  sendSuccess(res, null, 'Sharh o\'chirildi', 200);
});
