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
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { upload } from '../services/upload.service';

const router = express.Router();

// Store Owner / public product routes
router.get('/products/categories', protect, getCategories);
router.get('/products', protect, getAllProducts);
router.get('/products/:id', protect, getProductById);

// Distributor routes
router.get('/distributor/products', protect, authorize('DISTRIBUTOR'), getDistributorProducts);
router.post('/distributor/products', protect, authorize('DISTRIBUTOR'), upload.single('image'), createProduct);
router.put('/distributor/products/:id', protect, authorize('DISTRIBUTOR'), upload.single('image'), updateProduct);
router.patch('/distributor/products/:id/stock', protect, authorize('DISTRIBUTOR'), updateProductStock);
router.delete('/distributor/products/:id', protect, authorize('DISTRIBUTOR'), deleteProduct);

export default router;
