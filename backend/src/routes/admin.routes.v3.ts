import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/orders/recent', adminController.getRecentOrders);
router.get('/orders', adminController.getRecentOrders); // All orders with filters
router.get('/drivers/active', adminController.getActiveDrivers);

// User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// Analytics
router.get('/analytics', adminController.getAnalytics);

export default router;
