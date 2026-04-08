import express from 'express';
import { 
  getAllProducts,
  getCategories,
  getProductById, 
  getDistributorProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateProductStock 
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../services/upload.service';

const router = express.Router();

// Public product routes (no auth required for categories and products)
router.get('/categories', getCategories);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Distributor routes (auth required)
router.get('/distributor/products', authenticate, authorize('DISTRIBUTOR'), getDistributorProducts);
router.post('/distributor/products', authenticate, authorize('DISTRIBUTOR'), upload.single('image'), createProduct);
router.put('/distributor/products/:id', authenticate, authorize('DISTRIBUTOR'), upload.single('image'), updateProduct);
router.patch('/distributor/products/:id/stock', authenticate, authorize('DISTRIBUTOR'), updateProductStock);
router.delete('/distributor/products/:id', authenticate, authorize('DISTRIBUTOR'), deleteProduct);

export default router;
