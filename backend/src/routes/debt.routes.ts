import express from 'express';
import {
  getDistributorDebts,
  getClientDebts,
  recordDebtPayment,
  getDebtSummary,
  getMyDebts
} from '../controllers/debt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Distributor routes
router.get('/distributor', authenticate, authorize(Role.DISTRIBUTOR), getDistributorDebts);
router.get('/distributor/summary', authenticate, authorize(Role.DISTRIBUTOR), getDebtSummary);
router.get('/distributor/clients/:clientId', authenticate, authorize(Role.DISTRIBUTOR), getClientDebts);

// Payment recording (distributor only)
router.post('/:id/payment', authenticate, authorize(Role.DISTRIBUTOR), recordDebtPayment);

// Client routes (store owner viewing their own debts)
router.get('/my', authenticate, authorize(Role.CLIENT), getMyDebts);

export default router;
