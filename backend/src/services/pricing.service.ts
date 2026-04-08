import { PrismaClient, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

export class PricingService {
  // PRICE-01: Create custom price rule
  async createPriceRule(data: any) {
    const { productId, variantId, clientId, price, validFrom, validTo } = data;

    return prisma.priceRule.create({
      data: {
        productId,
        variantId,
        clientId,
        price,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null
      }
    });
  }

  // PRICE-01: Get price rules
  async getPriceRules(productId: string) {
    return prisma.priceRule.findMany({
      where: { productId },
      include: {
        client: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        }
      }
    });
  }

  // PRICE-01: Update price rule
  async updatePriceRule(id: string, data: any) {
    return prisma.priceRule.update({
      where: { id },
      data: {
        price: data.price,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validTo: data.validTo ? new Date(data.validTo) : undefined
      }
    });
  }

  // PRICE-01: Delete price rule
  async deletePriceRule(id: string) {
    return prisma.priceRule.delete({ where: { id } });
  }

  // PRICE-02: Create bulk discount rule
  async createBulkRule(data: any) {
    const { productId, minQuantity, maxQuantity, discountType, discountValue } = data;

    return prisma.bulkRule.create({
      data: {
        productId,
        minQuantity,
        maxQuantity,
        discountType,
        discountValue
      }
    });
  }

  // PRICE-02: Get bulk rules
  async getBulkRules(productId: string) {
    return prisma.bulkRule.findMany({
      where: { productId },
      orderBy: { minQuantity: 'asc' }
    });
  }

  // PRICE-02: Update bulk rule
  async updateBulkRule(id: string, data: any) {
    return prisma.bulkRule.update({
      where: { id },
      data
    });
  }

  // PRICE-02: Delete bulk rule
  async deleteBulkRule(id: string) {
    return prisma.bulkRule.delete({ where: { id } });
  }

  // PRICE-02: Calculate price with bulk discount
  async calculateBulkPrice(productId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        bulkRules: {
          where: {
            minQuantity: { lte: quantity },
            OR: [
              { maxQuantity: { gte: quantity } },
              { maxQuantity: null }
            ]
          },
          orderBy: { minQuantity: 'desc' },
          take: 1
        }
      }
    });

    if (!product) throw new Error('Mahsulot topilmadi');

    let price = product.wholesalePrice;

    if (product.bulkRules.length > 0) {
      const rule = product.bulkRules[0];
      if (rule.discountType === DiscountType.PERCENT) {
        price = price * (1 - rule.discountValue / 100);
      } else {
        price = price - rule.discountValue;
      }
    }

    return {
      basePrice: product.wholesalePrice,
      finalPrice: price,
      discount: product.wholesalePrice - price,
      appliedRule: product.bulkRules[0] || null
    };
  }

  // PRICE-03: Create promo code
  async createPromoCode(distributorId: string, data: any) {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      usesPerClient,
      validFrom,
      validTo,
      applicableTo
    } = data;

    // Check if code exists
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) throw new Error('Promo kod allaqachon mavjud');

    return prisma.promoCode.create({
      data: {
        distributorId,
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxUses,
        usesPerClient,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        applicableTo
      }
    });
  }

  // PRICE-03: Get promo codes
  async getPromoCodes(distributorId: string) {
    return prisma.promoCode.findMany({
      where: { distributorId },
      include: {
        usages: {
          include: {
            client: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // PRICE-03: Validate promo code
  async validatePromoCode(code: string, clientId: string, orderAmount: number) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: { clientId }
        }
      }
    });

    if (!promoCode) {
      return { valid: false, error: 'Promo kod topilmadi' };
    }

    // Check validity period
    const now = new Date();
    if (promoCode.validFrom && now < promoCode.validFrom) {
      return { valid: false, error: 'Promo kod hali faol emas' };
    }
    if (promoCode.validTo && now > promoCode.validTo) {
      return { valid: false, error: 'Promo kod muddati o\'tgan' };
    }

    // Check max uses
    if (promoCode.maxUses) {
      const totalUses = await prisma.promoUsage.count({
        where: { promoCodeId: promoCode.id }
      });
      if (totalUses >= promoCode.maxUses) {
        return { valid: false, error: 'Promo kod limiti tugagan' };
      }
    }

    // Check uses per client
    if (promoCode.usages.length >= promoCode.usesPerClient) {
      return { valid: false, error: 'Siz bu promo koddan maksimal foydalandingiz' };
    }

    // Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
      return {
        valid: false,
        error: `Minimal buyurtma summasi: ${promoCode.minOrderAmount}`
      };
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === DiscountType.PERCENT) {
      discount = orderAmount * (promoCode.discountValue / 100);
    } else {
      discount = promoCode.discountValue;
    }

    return {
      valid: true,
      promoCode,
      discount
    };
  }

  // PRICE-03: Apply promo code
  async applyPromoCode(promoCodeId: string, clientId: string, orderId: string) {
    return prisma.promoUsage.create({
      data: {
        promoCodeId,
        clientId,
        orderId
      }
    });
  }

  // Get effective price for client
  async getEffectivePrice(productId: string, variantId: string | null, clientId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        priceRules: {
          where: {
            clientId,
            OR: [
              { validFrom: null, validTo: null },
              { validFrom: { lte: new Date() }, validTo: { gte: new Date() } }
            ]
          }
        },
        bulkRules: true
      }
    });

    if (!product) throw new Error('Mahsulot topilmadi');

    // Start with base price
    let price = product.wholesalePrice;

    // Apply custom price rule if exists
    if (product.priceRules.length > 0) {
      price = product.priceRules[0].price;
    }

    // Apply bulk discount
    const bulkRule = product.bulkRules.find(
      rule => rule.minQuantity <= quantity && (!rule.maxQuantity || rule.maxQuantity >= quantity)
    );

    if (bulkRule) {
      if (bulkRule.discountType === DiscountType.PERCENT) {
        price = price * (1 - bulkRule.discountValue / 100);
      } else {
        price = price - bulkRule.discountValue;
      }
    }

    return {
      basePrice: product.wholesalePrice,
      effectivePrice: price,
      hasCustomPrice: product.priceRules.length > 0,
      hasBulkDiscount: !!bulkRule
    };
  }
}
