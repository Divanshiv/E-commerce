import razorpay from '../config/razorpay.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

// Default payment config
let paymentConfig = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  currency: 'INR',
  codEnabled: true,
  codCharges: 30
};

// Admin: Get payment config
export const getPaymentConfig = async (req, res, next) => {
  try {
    res.json({ success: true, data: { config: paymentConfig } });
  } catch (error) {
    next(error);
  }
};

// Admin: Update payment config
export const updatePaymentConfig = async (req, res, next) => {
  try {
    const allowedFields = ['razorpayKeyId', 'currency', 'codEnabled', 'codCharges'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        paymentConfig[field] = req.body[field];
      }
    });
    res.json({ success: true, data: { config: paymentConfig } });
  } catch (error) {
    next(error);
  }
};

// Create Razorpay order
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { address, couponCode } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    const discount = cart.couponApplied?.discountAmount || 0;
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;
    const total = Math.round((subtotal - discount + shippingCharges) * 100); // Razorpay uses paisa

    // Create Razorpay order
    const options = {
      amount: total,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        couponCode: couponCode || ''
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Create pending order
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price
    }));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      discount,
      shippingCharges,
      total: total / 100,
      couponApplied: cart.couponApplied?.code,
      address,
      payment: {
        method: 'razorpay',
        razorpayOrderId: razorpayOrder.id,
        status: 'pending'
      }
    });

    await order.save();

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: total,
        currency: 'INR',
        order: order
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify Razorpay payment
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature (simplified - in production use proper crypto)
    const crypto = await import('crypto');
    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Update order status
    const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.status = 'paid';
    order.status = 'confirmed';

    await order.save();

    // Decrement stock for each item
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, 'sizes.name': item.size },
        { $inc: { 'sizes.$.stock': -item.quantity } }
      );
    }

    // Increment coupon usage if coupon was applied
    if (order.couponApplied) {
      await Coupon.updateOne(
        { code: order.couponApplied },
        { $inc: { usedCount: 1 } }
      );
    }

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [], couponApplied: null }
    );

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// COD order
export const createCODOrder = async (req, res, next) => {
  try {
    const { address } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    const discount = cart.couponApplied?.discountAmount || 0;
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;
    const total = subtotal - discount + shippingCharges;

    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price
    }));

    // Create order with COD
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
        method: 'cod',
        status: 'pending' // COD confirmed on delivery
      }
    });

    await order.save();

    // Clear cart
    cart.items = [];
    cart.couponApplied = null;
    await cart.save();

    res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};
