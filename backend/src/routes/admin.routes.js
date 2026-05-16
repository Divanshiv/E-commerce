import { Router } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  getInventoryStats,
  bulkUpdateStock
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
  getDashboardStats,
  addTrackingUpdate
} from '../controllers/order.controller.js';
import { getCustomers, getCustomerStats } from '../controllers/auth.controller.js';
import {
  getAdminCoupons,
  getAdminCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} from '../controllers/coupon.controller.js';
import {
  getAdminCategories,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import {
  getShipmentConfig,
  updateShipmentConfig
} from '../controllers/shipment.controller.js';
import {
  getPaymentConfig,
  updatePaymentConfig
} from '../controllers/payment.controller.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notification.controller.js';

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

// Inventory
router.get('/inventory/stats', getInventoryStats);
router.post('/inventory/bulk-update', bulkUpdateStock);

// Brands
router.get('/brands', getAdminBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Orders
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrder);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/tracking', addTrackingUpdate);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/stats', getCustomerStats);

// Categories
router.get('/categories', getAdminCategories);
router.get('/categories/stats', getCategoryStats);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Coupons
router.get('/coupons', getAdminCoupons);
router.get('/coupons/:id', getAdminCoupon);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.patch('/coupons/:id/toggle', toggleCouponStatus);

// Notifications
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.patch('/notifications/:id/read', markAsRead);
router.patch('/notifications/read-all', markAllAsRead);

// Shipment
router.get('/shipment', getShipmentConfig);
router.put('/shipment', updateShipmentConfig);

// Payment Config
router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', updatePaymentConfig);

export default router;
