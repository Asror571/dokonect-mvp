import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as clientController from '../controllers/client.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['CLIENT']));

// Dashboard
router.get('/dashboard', clientController.getClientDashboard);

// Distributors & Connections
router.get('/distributors', clientController.getDistributors);
router.post('/distributors/:distributorId/connect', clientController.connectDistributor);

// Products & Catalog
router.get('/products', clientController.getProducts);

// Orders
router.post('/orders', clientController.createOrder);
router.get('/orders', clientController.getOrderHistory);
router.get('/orders/stats', clientController.getOrderStats);
router.get('/orders/:orderId/tracking', clientController.getOrderTracking);

// Finance
router.get('/finance/summary', clientController.getFinanceSummary);

// Ratings
router.post('/orders/:orderId/rate', clientController.rateDelivery);

export default router;
