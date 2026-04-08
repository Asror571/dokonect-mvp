import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReviewService {
  // REV-01: Create product review
  async createReview(data: any) {
    const { productId, clientId, userId, orderId, rating, comment, images } = data;

    // Check if user already reviewed this order
    const existing = await prisma.review.findUnique({
      where: { orderId }
    });

    if (existing) throw new Error('Bu buyurtma uchun allaqachon baho berilgan');

    // Check if user actually ordered this product
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        clientId,
        status: 'DELIVERED',
        items: {
          some: { productId }
        }
      }
    });

    if (!order) throw new Error('Siz bu mahsulotni buyurtma qilmagansiz');

    const review = await prisma.review.create({
      data: {
        productId,
        clientId,
        userId,
        orderId,
        rating,
        comment,
        images
      },
      include: {
        user: { select: { name: true, avatar: true } }
      }
    });

    // Update product average rating
    await this.updateProductRating(productId);

    return review;
  }

  // REV-01: Get product reviews
  async getProductReviews(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { name: true, avatar: true } },
          replies: {
            include: {
              user: { select: { name: true, avatar: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where: { productId } })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // REV-01: Update review
  async updateReview(id: string, userId: string, data: any) {
    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) throw new Error('Baho topilmadi');
    if (review.userId !== userId) throw new Error('Ruxsat yo\'q');

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: data.rating,
        comment: data.comment,
        images: data.images
      }
    });

    await this.updateProductRating(review.productId);

    return updated;
  }

  // REV-01: Reply to review (distributor)
  async replyToReview(reviewId: string, userId: string, comment: string) {
    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId,
        comment
      },
      include: {
        user: { select: { name: true, avatar: true } }
      }
    });

    return reply;
  }

  // REV-02: Get distributor reviews
  async getDistributorReviews(distributorId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        product: { distributorId }
      },
      include: {
        user: { select: { name: true, avatar: true } },
        product: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return {
      reviews,
      avgRating,
      totalReviews: reviews.length
    };
  }

  // Helper: Update product average rating
  private async updateProductRating(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true }
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    // Note: We need to add rating field to Product model
    // For now, we'll skip this update
  }
}
