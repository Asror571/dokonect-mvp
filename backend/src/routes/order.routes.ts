import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getDistributorOrders,
  getDistributorOrderById,
  updateOrderStatus
} from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Store Owner / Client routes
router.post('/', authenticate, authorize(Role.CLIENT), createOrder);
router.get('/', authenticate, authorize(Role.CLIENT), getMyOrders);
router.get('/:id', authenticate, authorize(Role.CLIENT), getOrderById);

// Distributor routes
router.get('/distributor/orders', authenticate, authorize(Role.DISTRIBUTOR), getDistributorOrders);
router.get('/distributor/orders/:id', authenticate, authorize(Role.DISTRIBUTOR), getDistributorOrderById);
router.patch('/distributor/orders/:id/status', authenticate, authorize(Role.DISTRIBUTOR), updateOrderStatus);

export default router;
