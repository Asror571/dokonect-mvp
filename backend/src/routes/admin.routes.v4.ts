import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';

// Dashboard
import {
  getGlobalDashboard,
  getGrowthChart
} from '../controllers/admin/dashboard.controller';

// Distributors
import {
  getAllDistributors,
  getDistributorDetails,
  verifyDistributor,
  toggleDistributorBlock,
  deleteDistributor
} from '../controllers/admin/distributors.controller';

// Shops/Clients
import {
  getAllShops,
  getShopDetails,
  toggleShopBlock,
  setShopCreditLimit,
  getRiskyShops
} from '../controllers/admin/shops.controller';

// Orders
import {
  getAllOrders,
  getOrderDetails,
  cancelOrder,
  getSuspiciousOrders,
  getOrderStats
} from '../controllers/admin/orders.controller';

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize(['ADMIN']));

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard', getGlobalDashboard);
router.get('/dashboard/growth', getGrowthChart);

// ============================================
// DISTRIBUTORS ROUTES
// ============================================
router.get('/distributors', getAllDistributors);
router.get('/distributors/:id', getDistributorDetails);
router.patch('/distributors/:id/verify', verifyDistributor);
router.patch('/distributors/:id/block', toggleDistributorBlock);
router.delete('/distributors/:id', deleteDistributor);

// ============================================
// SHOPS/CLIENTS ROUTES
// ============================================
router.get('/shops', getAllShops);
router.get('/shops/risky', getRiskyShops);
router.get('/shops/:id', getShopDetails);
router.patch('/shops/:id/block', toggleShopBlock);
router.patch('/shops/:id/credit-limit', setShopCreditLimit);

// ============================================
// ORDERS ROUTES (Global View)
// ============================================
router.get('/orders', getAllOrders);
router.get('/orders/suspicious', getSuspiciousOrders);
router.get('/orders/stats', getOrderStats);
router.get('/orders/:id', getOrderDetails);
router.patch('/orders/:id/cancel', cancelOrder);

// ============================================
// PRODUCTS ROUTES (Moderation)
// ============================================
// Will be added if needed

// ============================================
// PAYMENTS/DEBTS ROUTES
// ============================================
// Can reuse existing debt routes with admin access

// ============================================
// ANALYTICS ROUTES
// ============================================
// Will be added for advanced analytics

export default router;
