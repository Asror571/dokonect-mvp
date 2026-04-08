import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as driverController from '../controllers/driver.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['DRIVER']));

// Dashboard
router.get('/dashboard', driverController.getDriverDashboard);

// Location tracking
router.post('/location', driverController.updateDriverLocation);

// Status
router.patch('/status', driverController.updateDriverStatus);

// Orders
router.post('/orders/:orderId/accept', driverController.acceptOrder);
router.patch('/orders/:orderId/status', driverController.updateOrderStatus);

// Earnings
router.get('/earnings', driverController.getDriverEarnings);

export default router;
