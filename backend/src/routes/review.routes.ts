import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { createReview, getProductReviews, deleteReview } from '../controllers/review.controller';

const router = express.Router();

router.post('/',                    protect, authorize('STORE_OWNER'), createReview);
router.get('/product/:productId',   protect, getProductReviews);
router.delete('/:id',               protect, authorize('STORE_OWNER'), deleteReview);

export default router;
