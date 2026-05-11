import { Router } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages
} from '../controllers/product.controller.js';
import {
  getAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brand.controller.js';
import {
  getAdminOrders,
  updateOrderStatus,
  getAdminOrder,
  getDashboardStats
} from '../controllers/order.controller.js';
import { getCustomers } from '../controllers/auth.controller.js';
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '../controllers/coupon.controller.js';
import {
  getShipmentConfig,
  updateShipmentConfig
} from '../controllers/shipment.controller.js';
import {
  getPaymentConfig,
  updatePaymentConfig
} from '../controllers/payment.controller.js';

const router = Router();
const upload = multer({ dest: '/tmp/uploads/' });

// All admin routes require authentication and admin role
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/:id/images', upload.array('images', 5), uploadProductImages);

// Brands
router.get('/brands', getAdminBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Orders
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrder);
router.put('/orders/:id/status', updateOrderStatus);

// Customers
router.get('/customers', getCustomers);

// Coupons
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Shipment
router.get('/shipment', getShipmentConfig);
router.put('/shipment', updateShipmentConfig);

// Payment Config
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', updatePaymentConfig);

export default router;
