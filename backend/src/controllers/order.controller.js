import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import {
  createNewOrderNotification,
  createOrderStatusNotification,
} from './notification.controller.js';

// Get user orders
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');

    res.json({ success: true, data: { orders } });
  } catch (error) {
    next(error);
  }
};

// Get single order
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// Create order
export const createOrder = async (req, res, next) => {
  try {
    const { address, paymentMethod } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.couponApplied?.discountAmount || 0;

    // Shipping charges (free above ₹999)
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;

    const total = subtotal - discount + shippingCharges;

    // Create order items with product details
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      shippingCharges,
      total,
      couponApplied: cart.couponApplied?.code,
      address,
      payment: {
        method: paymentMethod === 'cod' ? 'cod' : 'razorpay',
        paymentMethod: paymentMethod === 'cod' ? null : paymentMethod || 'card',
        status: 'pending',
      },
    });

    await order.save();

    // Trigger notification (non-blocking)
    const orderUser = await User.findById(req.user._id);
    createNewOrderNotification(order, orderUser);

    // Clear cart
    cart.items = [];
    cart.couponApplied = null;
    await cart.save();

    res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all orders
export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (userId) query.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const location = req.body.location || '';

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Auto-add tracking update on status change
    if (status !== previousStatus) {
      order.trackingUpdates.push({
        status,
        location,
        note: getStatusNote(status),
        timestamp: new Date(),
      });
    }

    await order.save();

    createOrderStatusNotification(order, previousStatus);

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

function getStatusNote(status) {
  const notes = {
    pending: 'Order placed and awaiting confirmation',
    confirmed: 'Order has been confirmed',
    processing: 'Order is being prepared',
    shipped: 'Package has been shipped',
    out_for_delivery: 'Out for delivery',
    delivered: 'Package delivered successfully',
    cancelled: 'Order has been cancelled',
  };
  return notes[status] || `Status updated to ${status}`;
}

// Admin: Add manual tracking update
export const addTrackingUpdate = async (req, res, next) => {
  try {
    const { status, location, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const update = {
      status: status || order.status,
      location: location || '',
      note: note || '',
      timestamp: new Date(),
    };

    order.trackingUpdates.push(update);
    if (status) order.status = status;
    await order.save();

    res.json({ success: true, data: { trackingUpdate: update, order } });
  } catch (error) {
    next(error);
  }
};

// Public: Get order tracking info
export const getOrderTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).select(
      'orderNumber status trackingNumber trackingUpdates deliveryCoordinates address createdAt',
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        trackingUpdates: order.trackingUpdates,
        deliveryCoordinates: order.deliveryCoordinates,
        address: order.address,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get order details
export const getAdminOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('items.product', 'name slug images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get dashboard stats
export const getDashboardStats = async (_req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalUsers, recentOrders, lowStockProducts] =
      await Promise.all([
        Order.countDocuments(),
        Product.countDocuments(),
        User.countDocuments({ role: 'user' }),
        Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
        Product.find({ 'sizes.stock': { $lt: 5 } })
          .select('name slug sizes stock')
          .limit(5),
      ]);

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Monthly orders
    const monthlyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalProducts,
          totalUsers,
          totalRevenue,
          ordersByStatus,
          monthlyOrders,
        },
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
