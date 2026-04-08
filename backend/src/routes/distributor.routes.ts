import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

// Product Management
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  getVariants,
  updateVariant,
  uploadProductImages,
} from '../controllers/distributor/product.controller';

// Category Management
import {
  createCategory,
  getCategoriesTree,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/distributor/category.controller';

// Brand Management
import {
  createBrand,
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/distributor/brand.controller';

// Inventory Management
import {
  getInventory,
  getLowStockAlerts,
  getProductInventory,
  adjustStock,
  getStockHistory,
  updateMinThreshold,
} from '../controllers/distributor/inventory.controller';

// Warehouse Management
import {
  createWarehouse,
  getWarehouses,
  getWarehouse,
  updateWarehouse,
  deleteWarehouse,
  transferStock,
  getTransferHistory,
} from '../controllers/distributor/warehouse.controller';

// Order Management
import {
  getOrders,
  getOrderStats,
  getOrder,
  acceptOrder,
  rejectOrder,
  assignDriver,
  updateOrderStatus,
  addInternalNote,
  createOrder,
} from '../controllers/distributor/order.controller';

// Pricing Management
import {
  createPriceRule,
  getPriceRules,
  updatePriceRule,
  deletePriceRule,
  createBulkRule,
  getBulkRules,
  updateBulkRule,
  deleteBulkRule,
  createPromoCode,
  getPromoCodes,
  validatePromoCode,
  deletePromoCode,
} from '../controllers/distributor/pricing.controller';

// Analytics
import {
  getDashboard,
  getSalesReport,
  getProfitReport,
  getInventoryAnalytics,
} from '../controllers/distributor/analytics.controller';

// Driver Management
import {
  createDriver,
  getDrivers,
  getDriver,
  updateDriver,
  deleteDriver,
  getDriverOrders,
  getDriverStats,
} from '../controllers/distributor/driver.controller';

// Zone Management
import {
  createZone,
  getZones,
  getZone,
  updateZone,
  deleteZone,
  assignDriversToZone,
  getAvailableDriversForZone,
} from '../controllers/distributor/zone.controller';

// Client Management
import {
  getClients,
  getClientById,
  getClientOrders,
  getClientDebts,
  updateClient,
  getPendingClients,
  approveClient,
  rejectClient,
} from '../controllers/distributor/client.controller';

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize(['DISTRIBUTOR']));

// ============================================
// PRODUCT ROUTES
// ============================================
router.post('/products', createProduct);
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Product Variants
router.post('/products/:id/variants', createVariant);
router.get('/products/:id/variants', getVariants);
router.put('/products/:id/variants/:variantId', updateVariant);

// Product Images
import { upload } from '../services/upload.service';
import { uploadFiles } from '../controllers/distributor/upload.controller';

router.post('/upload', upload.array('images', 10), uploadFiles);
router.post('/products/:id/images', uploadProductImages);

// ============================================
// CATEGORY ROUTES
// ============================================
router.post('/categories', createCategory);
router.get('/categories/tree', getCategoriesTree);
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/reorder', reorderCategories);

// ============================================
// BRAND ROUTES
// ============================================
router.post('/brands', createBrand);
router.get('/brands', getBrands);
router.get('/brands/:id', getBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// ============================================
// INVENTORY ROUTES
// ============================================
router.get('/inventory', getInventory);
router.get('/inventory/low-stock', getLowStockAlerts);
router.get('/inventory/product/:productId', getProductInventory);
router.post('/inventory/adjust', adjustStock);
router.get('/inventory/history', getStockHistory);
router.put('/inventory/:id/threshold', updateMinThreshold);

// ============================================
// WAREHOUSE ROUTES
// ============================================
router.post('/warehouses', createWarehouse);
router.get('/warehouses', getWarehouses);
router.get('/warehouses/:id', getWarehouse);
router.put('/warehouses/:id', updateWarehouse);
router.delete('/warehouses/:id', deleteWarehouse);
router.post('/warehouses/transfer', transferStock);
router.get('/warehouses/transfers', getTransferHistory);

// ============================================
// ORDER ROUTES
// ============================================
router.post('/orders/create', createOrder); // ORD-05: Create order
router.get('/orders', getOrders);
router.get('/orders/stats', getOrderStats);
router.get('/orders/:id', getOrder);
router.post('/orders/:id/accept', acceptOrder);
router.post('/orders/:id/reject', rejectOrder);
router.post('/orders/:id/assign', assignDriver);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/note', addInternalNote);

// ============================================
// PRICING ROUTES
// ============================================
// Price Rules (B2B Individual Pricing)
router.post('/pricing/rules', createPriceRule);
router.get('/pricing/rules', getPriceRules);
router.put('/pricing/rules/:id', updatePriceRule);
router.delete('/pricing/rules/:id', deletePriceRule);

// Bulk Discount Rules
router.post('/pricing/bulk-rules', createBulkRule);
router.get('/pricing/bulk-rules', getBulkRules);
router.put('/pricing/bulk-rules/:id', updateBulkRule);
router.delete('/pricing/bulk-rules/:id', deleteBulkRule);

// Promo Codes
router.post('/pricing/promo-codes', createPromoCode);
router.get('/pricing/promo-codes', getPromoCodes);
router.post('/pricing/promo-codes/validate', validatePromoCode);
router.delete('/pricing/promo-codes/:id', deletePromoCode);

// ============================================
// ANALYTICS ROUTES
// ============================================
router.get('/analytics/dashboard', getDashboard);
router.get('/dashboard/stats', getDashboard); // Alias for frontend compatibility
router.get('/analytics/sales', getSalesReport);
router.get('/analytics/profit', getProfitReport);
router.get('/analytics/inventory', getInventoryAnalytics);

// ============================================
// DRIVER ROUTES (DRV-01)
// ============================================
router.post('/drivers', createDriver);
router.get('/drivers', getDrivers);
router.get('/drivers/:id', getDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);
router.get('/drivers/:id/orders', getDriverOrders);
router.get('/drivers/:id/stats', getDriverStats);

// ============================================
// ZONE ROUTES (DRV-03)
// ============================================
router.post('/zones', createZone);
router.get('/zones', getZones);
router.get('/zones/:id', getZone);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);
router.post('/zones/:id/assign-drivers', assignDriversToZone);
router.get('/zones/:id/available-drivers', getAvailableDriversForZone);

// ============================================
// CLIENT MANAGEMENT ROUTES
// ============================================
router.get('/clients', getClients);
router.get('/clients/pending', getPendingClients);
router.get('/clients/:id', getClientById);
router.get('/clients/:id/orders', getClientOrders);
router.get('/clients/:id/debts', getClientDebts);
router.patch('/clients/:id', updateClient);
router.post('/clients/pending/:id/approve', approveClient);
router.post('/clients/pending/:id/reject', rejectClient);

export default router;
