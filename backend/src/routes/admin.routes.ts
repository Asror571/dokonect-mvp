import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  getUsers, blockUser, unblockUser, verifyDistributor,
  getAdminProducts, deactivateProduct, getAdminOrders,
} from '../controllers/admin.controller';

const router = express.Router();

router.use(protect, authorize('ADMIN'));

router.get('/users',                       getUsers);
router.patch('/users/:id/block',           blockUser);
router.patch('/users/:id/unblock',         unblockUser);
router.patch('/distributors/:id/verify',   verifyDistributor);
router.get('/products',                    getAdminProducts);
router.patch('/products/:id/deactivate',   deactivateProduct);
router.get('/orders',                      getAdminOrders);

export default router;
