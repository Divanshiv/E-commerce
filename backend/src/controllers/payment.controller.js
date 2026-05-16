import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import PaymentConfig from '../models/PaymentConfig.js';

// ─── Helpers ───────────────────────────────────────────────────────────────-

function formatPrice(price) {
  return Math.round(price * 100); // to paisaa
}

// Loads the singleton PaymentConfig from DB, falls back to env defaults
async function loadPaymentConfig() {
  let config = await PaymentConfig.findOne();
  if (!config) {
    config = await PaymentConfig.create({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      currency: 'INR',
      codEnabled: true,
      codCharges: 30,
    });
  }
  return config;
}

/**
 * Validates stock availability for every item in the cart.
 * Throws with a descriptive message if any item is out of stock.
 */
async function validateStock(cartItems) {
  const errors = [];
  for (const item of cartItems) {
    const product = await Product.findById(item.product._id || item.product);
    if (!product) {
      errors.push(`${item.name || 'Product'} not found`);
      continue;
    }
    const sizeObj = product.sizes.find(s => s.name === item.size);
    if (!sizeObj) {
      errors.push(`${product.name} — size "${item.size}" not available`);
    } else if (sizeObj.stock < item.quantity) {
      errors.push(
        `${product.name} (${item.size}) — only ${sizeObj.stock} left, requested ${item.quantity}`,
      );
    }
  }
  if (errors.length > 0) {
    throw new Error('Stock unavailable: ' + errors.join('; '));
  }
}

/**
 * Decrements stock for each order item.
 */
async function decrementStock(orderItems) {
  for (const item of orderItems) {
    await Product.updateOne(
      { _id: item.product, 'sizes.name': item.size },
      { $inc: { 'sizes.$.stock': -item.quantity } },
    );
  }
}

/**
 * Increments coupon usage if a coupon was applied.
 */
async function incrementCouponUsage(couponCode) {
  if (couponCode) {
    await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });
  }
}

async function clearUserCart(userId) {
  await Cart.findOneAndUpdate({ userId }, { items: [], couponApplied: null });
}

// ─── Public: Payment Config ─────────────────────────────────────────────────

/**
 * Public endpoint — returns only non-sensitive payment config
 * (allowed methods, COD settings). Safe to call from checkout page.
 */
export const getPublicPaymentConfig = async (_req, res, _next) => {
  try {
    const config = await loadPaymentConfig();
    res.json({
      success: true,
      data: {
        allowedMethods: config.allowedMethods,
        codEnabled: config.codEnabled,
        codCharges: config.codCharges,
        currency: config.currency,
        razorpayKeyId: config.razorpayKeyId || '',
      },
    });
  } catch (error) {
    _next(error);
  }
};

// ─── Admin: Payment Config ──────────────────────────────────────────────────

export const getPaymentConfig = async (_req, res, next) => {
  try {
    const config = await loadPaymentConfig();
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentConfig = async (req, res, next) => {
  try {
    const allowedFields = [
      'razorpayKeyId',
      'currency',
      'codEnabled',
      'codCharges',
      'allowedMethods',
      'googlePayTestId',
      'phonePeTestId',
      'testCardNumber',
      'testCardExpiry',
      'testCardCvv',
      'testCardHolder',
      'testCardType',
    ];
    let config = await PaymentConfig.findOne();
    if (!config) {
      config = new PaymentConfig();
    }
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });
    await config.save();
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
};

// ─── Create Razorpay Order ──────────────────────────────────────────────────

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { address, couponCode, paymentMethod } = req.body;
    // method = gateway ('razorpay'), paymentMethod = specific method ('card'|'upi'|'paytm_wallet')
    const specificMethod = paymentMethod || 'card';

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock before creating order
    await validateStock(cart.items);

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.couponApplied?.discountAmount || 0;
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;
    const total = subtotal - discount + shippingCharges;

    // Build receipt — truncated to 40 chars (Razorpay limit)
    const receipt = `ord_${Date.now().toString(36)}`.slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: formatPrice(total),
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user._id.toString(),
        couponCode: couponCode || '',
      },
    });

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

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
        method: 'razorpay',
        paymentMethod: specificMethod,
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
      },
    });

    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: formatPrice(total),
        currency: 'INR',
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Razorpay Payment ────────────────────────────────────────────────

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const order = await Order.findOne({ 'payment.razorpayOrderId': razorpay_order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prevent double-verification
    if (order.payment.status === 'paid') {
      return res.json({ success: true, data: { order, alreadyVerified: true } });
    }

    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.status = 'paid';
    order.status = 'confirmed';
    await order.save();

    await decrementStock(order.items);
    await incrementCouponUsage(order.couponApplied);
    await clearUserCart(req.user._id);

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// ─── Google Pay (UPI Intent) Order ──────────────────────────────────────────

export const createGooglePayOrder = async (req, res, next) => {
  try {
    const { address, couponCode } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    await validateStock(cart.items);

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.couponApplied?.discountAmount || 0;
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;
    const total = subtotal - discount + shippingCharges;

    const receipt = `gpay_${Date.now().toString(36)}`.slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: formatPrice(total),
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user._id.toString(),
        method: 'google_pay',
        couponCode: couponCode || '',
      },
    });

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

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
        method: 'google_pay',
        paymentMethod: 'upi',
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
      },
    });

    await order.save();

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: formatPrice(total),
        currency: 'INR',
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── COD Order ──────────────────────────────────────────────────────────────

export const createCODOrder = async (req, res, next) => {
  try {
    const { address } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock before creating order
    await validateStock(cart.items);

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.couponApplied?.discountAmount || 0;
    const shippingCharges = subtotal - discount >= 999 ? 0 : 49;
    const total = subtotal - discount + shippingCharges;

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url || '',
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

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
        paymentMethod: null,
        status: 'pending',
      },
      status: 'confirmed', // COD orders are confirmed immediately
    });

    await order.save();

    // Decrement stock & update coupon usage (COD confirmed on creation)
    await decrementStock(orderItems);
    await incrementCouponUsage(order.couponApplied);
    await clearUserCart(req.user._id);

    res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// ─── Razorpay Webhook ───────────────────────────────────────────────────────

export const handleWebhook = async (req, res, _next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if a secret is configured
    if (secret) {
      const receivedSignature = req.headers['x-razorpay-signature'];
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (receivedSignature !== expected) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case 'payment.captured': {
        // Payment was successfully captured
        const paymentId = payload.payment?.entity?.id;
        const orderId = payload.payment?.entity?.order_id;
        if (orderId && paymentId) {
          await Order.findOneAndUpdate(
            { 'payment.razorpayOrderId': orderId },
            {
              'payment.razorpayPaymentId': paymentId,
              'payment.status': 'paid',
              status: 'confirmed',
            },
          );
        }
        break;
      }

      case 'payment.failed': {
        const failedOrderId = payload.payment?.entity?.order_id;
        if (failedOrderId) {
          await Order.findOneAndUpdate(
            { 'payment.razorpayOrderId': failedOrderId },
            { 'payment.status': 'failed' },
          );
        }
        break;
      }

      case 'order.paid': {
        // Razorpay order was paid (alternative to payment.captured)
        const rzpOrderId = payload.order?.entity?.id;
        if (rzpOrderId) {
          await Order.findOneAndUpdate(
            { 'payment.razorpayOrderId': rzpOrderId },
            { 'payment.status': 'paid', status: 'confirmed' },
          );
        }
        break;
      }

      default:
        // Unhandled event — log and acknowledge
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always acknowledge receipt (200) to prevent Razorpay retries
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries
    res.json({ success: true, error: error.message });
  }
};
