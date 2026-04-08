import { Router } from 'express';
import { ProductController } from '../controllers/distributor/product.controller';
import { OrderController } from '../controllers/distributor/order.controller';
import { DashboardController } from '../controllers/distributor/dashboard.controller';
import { InventoryService } from '../services/inventory.service';
import { DriverService } from '../services/driver.service';
import { ReviewService } from '../services/review.service';
import { PricingService } from '../services/pricing.service';
import { ChatService } from '../services/chat.service';
import { checkPermission } from '../middlewares/permissions.middleware';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication to all routes
router.use(authenticate);

// Controllers
const productController = new ProductController();
const orderController = new OrderController();
const dashboardController = new DashboardController();

// Services (for simple endpoints)
const inventoryService = new InventoryService();
const driverService = new DriverService();
const reviewService = new ReviewService();
const pricingService = new PricingService();
const chatService = new ChatService();

// ===== DASHBOARD =====
router.get('/dashboard/stats', dashboardController.getStats.bind(dashboardController));
router.get('/dashboard/sales-report', dashboardController.getSalesReport.bind(dashboardController));
router.get('/dashboard/sales-trend', dashboardController.getSalesTrend.bind(dashboardController));
router.get('/dashboard/profit-loss', dashboardController.getProfitLoss.bind(dashboardController));
router.get('/dashboard/delivery-stats', dashboardController.getDeliveryStats.bind(dashboardController));

// ===== PRODUCTS =====
router.post('/products', checkPermission('products', 'create'), productController.create.bind(productController));
router.get('/products', checkPermission('products', 'view'), productController.list.bind(productController));
router.get('/products/:id', checkPermission('products', 'view'), productController.getById.bind(productController));
router.put('/products/:id', checkPermission('products', 'edit'), productController.update.bind(productController));
router.delete('/products/:id', checkPermission('products', 'delete'), productController.delete.bind(productController));

// Variants
router.post('/products/:id/variants', checkPermission('products', 'create'), productController.addVariant.bind(productController));
router.get('/products/:id/variants', checkPermission('products', 'view'), productController.listVariants.bind(productController));
router.put('/products/:id/variants/:variantId', checkPermission('products', 'edit'), productController.updateVariant.bind(productController));
router.delete('/products/:id/variants/:variantId', checkPermission('products', 'delete'), productController.deleteVariant.bind(productController));

// Bulk upload
router.post('/products/import', checkPermission('products', 'create'), upload.single('file'), productController.bulkImport.bind(productController));
router.get('/products/template', productController.downloadTemplate.bind(productController));

// ===== INVENTORY =====
router.get('/inventory', checkPermission('inventory', 'view'), async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const inventory = await inventoryService.getInventory(distributorId, req.query);
    res.json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inventory/low-stock', checkPermission('inventory', 'view'), async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const items = await inventoryService.getLowStockItems(distributorId);
    res.json(items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inventory/:productId', checkPermission('inventory', 'view'), async (req, res) => {
  try {
    const inventory = await inventoryService.getProductInventory(req.params.productId);
    res.json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/inventory/adjust', checkPermission('inventory', 'adjust'), async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const inventory = await inventoryService.adjustInventory(distributorId, req.body);
    res.json(inventory);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inventory/adjustments', checkPermission('inventory', 'view'), async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const history = await inventoryService.getAdjustmentHistory(distributorId, req.query);
    res.json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/inventory/transfer', checkPermission('inventory', 'adjust'), async (req, res) => {
  try {
    const transfer = await inventoryService.transferStock(req.body);
    res.json(transfer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ORDERS =====
router.get('/orders', checkPermission('orders', 'view'), orderController.list.bind(orderController));
router.get('/orders/stats', checkPermission('orders', 'view'), orderController.getStats.bind(orderController));
router.get('/orders/:id', checkPermission('orders', 'view'), orderController.getById.bind(orderController));
router.post('/orders', checkPermission('orders', 'create'), orderController.create.bind(orderController));
router.post('/orders/:id/accept', checkPermission('orders', 'accept'), orderController.accept.bind(orderController));
router.post('/orders/:id/reject', checkPermission('orders', 'reject'), orderController.reject.bind(orderController));
router.post('/orders/:id/assign', checkPermission('orders', 'assign'), orderController.assignDriver.bind(orderController));
router.put('/orders/:id/status', checkPermission('orders', 'edit'), orderController.updateStatus.bind(orderController));

// ===== DRIVERS =====
router.post('/drivers', checkPermission('drivers', 'create'), async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/drivers', checkPermission('drivers', 'view'), async (req, res) => {
  try {
    const drivers = await driverService.listDrivers(req.query);
    res.json(drivers);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/drivers/:id', checkPermission('drivers', 'view'), async (req, res) => {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Haydovchi topilmadi' });
    }
    res.json(driver);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/drivers/:id', checkPermission('drivers', 'edit'), async (req, res) => {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.body);
    res.json(driver);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/drivers/:id', checkPermission('drivers', 'delete'), async (req, res) => {
  try {
    await driverService.deactivateDriver(req.params.id);
    res.json({ message: 'Haydovchi o\'chirildi' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/drivers/:id/stats', checkPermission('drivers', 'view'), async (req, res) => {
  try {
    const stats = await driverService.getDriverStats(req.params.id, req.query.period as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ZONES =====
router.post('/zones', checkPermission('drivers', 'create'), async (req, res) => {
  try {
    const zone = await driverService.createZone(req.body);
    res.status(201).json(zone);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/zones', async (req, res) => {
  try {
    const zones = await driverService.listZones();
    res.json(zones);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== PRICING =====
router.post('/pricing/rules', async (req, res) => {
  try {
    const rule = await pricingService.createPriceRule(req.body);
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/pricing/rules/:productId', async (req, res) => {
  try {
    const rules = await pricingService.getPriceRules(req.params.productId);
    res.json(rules);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/pricing/bulk-rules', async (req, res) => {
  try {
    const rule = await pricingService.createBulkRule(req.body);
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/pricing/bulk-rules/:productId', async (req, res) => {
  try {
    const rules = await pricingService.getBulkRules(req.params.productId);
    res.json(rules);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/promo-codes', async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const promoCode = await pricingService.createPromoCode(distributorId, req.body);
    res.status(201).json(promoCode);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/promo-codes', async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const promoCodes = await pricingService.getPromoCodes(distributorId);
    res.json(promoCodes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/promo-codes/validate', async (req, res) => {
  try {
    const { code, clientId, orderAmount } = req.body;
    const result = await pricingService.validatePromoCode(code, clientId, orderAmount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== REVIEWS =====
router.get('/reviews', async (req, res) => {
  try {
    const distributorId = (req as any).user.distributorId;
    const reviews = await reviewService.getDistributorReviews(distributorId);
    res.json(reviews);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/reviews/:id/reply', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { comment } = req.body;
    const reply = await reviewService.replyToReview(req.params.id, userId, comment);
    res.status(201).json(reply);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== CHAT =====
router.get('/chats', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const chats = await chatService.getChatList(userId);
    res.json(chats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/chats/:partnerId/messages', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const messages = await chatService.getMessages(userId, req.params.partnerId, parseInt(req.query.page as string) || 1);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/chats/:partnerId/messages', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const message = await chatService.sendMessage(userId, req.params.partnerId, req.body);
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
