import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  distributorOverview, distributorSales, distributorTopProducts, distributorTopStores,
  adminOverview, adminOrders, adminRevenue, adminUsers,
} from '../controllers/analytics.controller';

const router = express.Router();

router.get('/distributor/overview',     protect, authorize('DISTRIBUTOR'), distributorOverview);
router.get('/distributor/sales',        protect, authorize('DISTRIBUTOR'), distributorSales);
router.get('/distributor/top-products', protect, authorize('DISTRIBUTOR'), distributorTopProducts);
router.get('/distributor/top-stores',   protect, authorize('DISTRIBUTOR'), distributorTopStores);

router.get('/admin/overview', protect, authorize('ADMIN'), adminOverview);
router.get('/admin/orders',   protect, authorize('ADMIN'), adminOrders);
router.get('/admin/revenue',  protect, authorize('ADMIN'), adminRevenue);
router.get('/admin/users',    protect, authorize('ADMIN'), adminUsers);

export default router;
