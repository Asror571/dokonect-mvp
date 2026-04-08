import { PrismaClient, StockReason } from '@prisma/client';
import { InventoryAdjustment } from '../types/distributor.types';

const prisma = new PrismaClient();

export class InventoryService {
  // INV-01: Get inventory list
  async getInventory(distributorId: string, filters: any) {
    const { warehouseId, lowStock, search } = filters;

    const where: any = {
      product: { distributorId }
    };

    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    let inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            images: { where: { isCover: true } }
          }
        },
        variant: true,
        warehouse: true
      }
    });

    // Filter low stock
    if (lowStock) {
      inventory = inventory.filter(
        inv => (inv.quantity - inv.reserved) <= inv.minThreshold
      );
    }

    return inventory.map(inv => ({
      ...inv,
      available: inv.quantity - inv.reserved
    }));
  }

  // INV-01: Get product inventory
  async getProductInventory(productId: string) {
    const inventory = await prisma.inventory.findMany({
      where: { productId },
      include: {
        variant: true,
        warehouse: true
      }
    });

    return inventory.map(inv => ({
      ...inv,
      available: inv.quantity - inv.reserved
    }));
  }

  // INV-03: Manual adjustment
  async adjustInventory(distributorId: string, adjustment: InventoryAdjustment) {
    const { productId, variantId, warehouseId, quantity, reason, note, document } = adjustment;

    // Get current inventory
    const inventory = await prisma.inventory.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        warehouseId
      }
    });

    if (!inventory) {
      throw new Error('Inventory topilmadi');
    }

    // Calculate new quantity
    const newQuantity = Math.max(0, inventory.quantity + quantity);

    // Update inventory
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity }
    });

    // Log the adjustment
    await prisma.stockLog.create({
      data: {
        productId,
        variantId,
        distributorId,
        warehouseId,
        type: quantity > 0 ? 'IN' : 'OUT',
        reason,
        quantity: Math.abs(quantity),
        note,
        document
      }
    });

    // Update product status
    await this.updateProductStatus(productId);

    // Check for low stock alert
    if (newQuantity <= inventory.minThreshold) {
      await this.sendLowStockAlert(inventory.id);
    }

    return this.getProductInventory(productId);
  }

  // INV-02: Get low stock items
  async getLowStockItems(distributorId: string) {
    const inventory = await prisma.inventory.findMany({
      where: {
        product: { distributorId }
      },
      include: {
        product: {
          include: {
            images: { where: { isCover: true } }
          }
        },
        variant: true,
        warehouse: true
      }
    });

    return inventory
      .filter(inv => (inv.quantity - inv.reserved) <= inv.minThreshold)
      .map(inv => ({
        ...inv,
        available: inv.quantity - inv.reserved
      }));
  }

  // INV-02: Send low stock alert
  async sendLowStockAlert(inventoryId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        product: {
          include: { distributor: { include: { user: true } } }
        },
        variant: true,
        warehouse: true
      }
    });

    if (!inventory) return;

    const available = inventory.quantity - inventory.reserved;
    const productName = inventory.product.name;
    const variantInfo = inventory.variant
      ? ` (${inventory.variant.color || ''} ${inventory.variant.size || ''} ${inventory.variant.model || ''})`.trim()
      : '';

    await prisma.notification.create({
      data: {
        userId: inventory.product.distributor.userId,
        type: 'STOCK_LOW_ALERT',
        title: 'Stock kam qoldi',
        body: `${productName}${variantInfo} - ${inventory.warehouse.name}: ${available} dona qoldi`,
        metadata: {
          inventoryId: inventory.id,
          productId: inventory.productId,
          warehouseId: inventory.warehouseId
        }
      }
    });
  }

  // INV-03: Get adjustment history
  async getAdjustmentHistory(distributorId: string, filters: any) {
    const { productId, warehouseId, reason, startDate, endDate } = filters;

    const where: any = { distributorId };

    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (reason) where.reason = reason;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return prisma.stockLog.findMany({
      where,
      include: {
        product: {
          include: {
            images: { where: { isCover: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // INV-04: Warehouse transfer
  async transferStock(data: any) {
    const { sourceWarehouseId, destWarehouseId, productId, variantId, quantity, note } = data;

    // Check source inventory
    const sourceInv = await prisma.inventory.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        warehouseId: sourceWarehouseId
      }
    });

    if (!sourceInv || (sourceInv.quantity - sourceInv.reserved) < quantity) {
      throw new Error('Yetarli stock yo\'q');
    }

    // Create transfer record
    const transfer = await prisma.warehouseTransfer.create({
      data: {
        sourceWarehouseId,
        destWarehouseId,
        productId,
        variantId,
        quantity,
        note,
        status: 'COMPLETED'
      }
    });

    // Update source inventory
    await prisma.inventory.update({
      where: { id: sourceInv.id },
      data: { quantity: sourceInv.quantity - quantity }
    });

    // Update destination inventory
    const destInv = await prisma.inventory.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        warehouseId: destWarehouseId
      }
    });

    if (destInv) {
      await prisma.inventory.update({
        where: { id: destInv.id },
        data: { quantity: destInv.quantity + quantity }
      });
    } else {
      await prisma.inventory.create({
        data: {
          productId,
          variantId,
          warehouseId: destWarehouseId,
          quantity,
          reserved: 0
        }
      });
    }

    return transfer;
  }

  // Helper: Update product status based on stock
  private async updateProductStatus(productId: string) {
    const inventory = await prisma.inventory.findMany({
      where: { productId }
    });

    const totalAvailable = inventory.reduce(
      (sum, inv) => sum + (inv.quantity - inv.reserved),
      0
    );

    const status = totalAvailable > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';

    await prisma.product.update({
      where: { id: productId },
      data: { status }
    });
  }
}
