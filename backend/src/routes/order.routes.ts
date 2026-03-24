import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getDistributorOrders,
  getDistributorOrderById,
  updateOrderStatus
} from '../controllers/order.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = express.Router();

// Store Owner routes
router.post('/orders', protect, authorize('STORE_OWNER'), createOrder);
router.get('/orders', protect, authorize('STORE_OWNER'), getMyOrders);
router.get('/orders/:id', protect, authorize('STORE_OWNER'), getOrderById);

// Distributor routes
router.get('/distributor/orders', protect, authorize('DISTRIBUTOR'), getDistributorOrders);
router.get('/distributor/orders/:id', protect, authorize('DISTRIBUTOR'), getDistributorOrderById);
router.patch('/distributor/orders/:id/status', protect, authorize('DISTRIBUTOR'), updateOrderStatus);

export default router;
