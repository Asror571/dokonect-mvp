import { PrismaClient, ProductStatus, DiscountType } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

export class ProductService {
  // PROD-01: Create Product
  async createProduct(distributorId: string, data: any) {
    const { images, variants, ...productData } = data;

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });

    if (existing) {
      throw new Error('SKU allaqachon mavjud');
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        distributorId,
        status: productData.status || ProductStatus.DRAFT,
      }
    });

    // Add images
    if (images && images.length > 0) {
      await Promise.all(
        images.map((url: string, index: number) =>
          prisma.productImage.create({
            data: {
              productId: product.id,
              url,
              order: index,
              isCover: index === 0
            }
          })
        )
      );
    }

    // Create initial inventory (stock: 0)
    const warehouses = await prisma.warehouse.findMany({
      where: { distributorId, isActive: true }
    });

    for (const warehouse of warehouses) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: 0,
          reserved: 0,
          minThreshold: 5
        }
      });
    }

    return this.getProductById(product.id);
  }

  // Get product with all relations
  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: true,
        category: true,
        brand: true,
        inventory: {
          include: { warehouse: true }
        },
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } },
            replies: {
              include: {
                user: { select: { name: true, avatar: true } }
              }
            }
          }
        }
      }
    });
  }

  // PROD-01: List products with filters
  async listProducts(distributorId: string, filters: any) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const where: any = { distributorId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) where.categoryId = category;
    if (brand) where.brandId = brand;
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isCover: true } },
          category: true,
          brand: true,
          inventory: {
            select: {
              quantity: true,
              reserved: true,
              warehouse: { select: { name: true } }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // PROD-01: Update product
  async updateProduct(id: string, data: any) {
    const { images, ...productData } = data;

    const product = await prisma.product.update({
      where: { id },
      data: productData
    });

    // Update images if provided
    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await Promise.all(
        images.map((url: string, index: number) =>
          prisma.productImage.create({
            data: {
              productId: id,
              url,
              order: index,
              isCover: index === 0
            }
          })
        )
      );
    }

    return this.getProductById(id);
  }

  // PROD-01: Delete product (soft delete)
  async deleteProduct(id: string) {
    return prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT }
    });
  }

  // PROD-02: Add variant
  async addVariant(productId: string, data: any) {
    // Check uniqueness
    const existing = await prisma.productVariant.findFirst({
      where: {
        productId,
        color: data.color,
        size: data.size,
        model: data.model
      }
    });

    if (existing) {
      throw new Error('Bu variant kombinatsiyasi allaqachon mavjud');
    }

    const variant = await prisma.productVariant.create({
      data: {
        ...data,
        productId,
        skuVariant: data.skuVariant || `${productId}-${Date.now()}`
      }
    });

    // Create inventory for variant
    const warehouses = await prisma.warehouse.findMany({
      where: {
        distributor: {
          products: { some: { id: productId } }
        },
        isActive: true
      }
    });

    for (const warehouse of warehouses) {
      await prisma.inventory.create({
        data: {
          productId,
          variantId: variant.id,
          warehouseId: warehouse.id,
          quantity: 0,
          reserved: 0
        }
      });
    }

    return variant;
  }

  // PROD-02: List variants
  async listVariants(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      include: {
        inventory: {
          include: { warehouse: true }
        }
      }
    });
  }

  // PROD-02: Update variant
  async updateVariant(id: string, data: any) {
    return prisma.productVariant.update({
      where: { id },
      data
    });
  }

  // PROD-02: Delete variant
  async deleteVariant(id: string) {
    return prisma.productVariant.delete({
      where: { id }
    });
  }

  // PROD-05: Auto update status based on stock
  async updateProductStatus(productId: string) {
    const inventory = await prisma.inventory.findMany({
      where: { productId }
    });

    const totalAvailable = inventory.reduce(
      (sum, inv) => sum + (inv.quantity - inv.reserved),
      0
    );

    const status = totalAvailable > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;

    await prisma.product.update({
      where: { id: productId },
      data: { status }
    });
  }
}
