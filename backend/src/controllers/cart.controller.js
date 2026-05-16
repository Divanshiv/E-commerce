import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import ShipmentConfig from '../models/ShipmentConfig.js';

// Get cart
export const getCart = async (req, res, next) => {
  try {
    let cart;

    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (!cart) {
      cart = { items: [], couponApplied: null };
    }

    // Populate product details
    await Cart.populate(cart, {
      path: 'items.product',
      select: 'name slug images salePrice',
    });

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.couponApplied?.discountAmount || 0;

    res.json({
      success: true,
      data: {
        cart,
        subtotal,
        discount,
        total: subtotal - discount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size, price } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Find or create cart
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.body.sessionId) {
      cart = await Cart.findOne({ sessionId: req.body.sessionId });
    }

    if (!cart) {
      cart = new Cart({
        userId: req.user?._id,
        sessionId: req.body.sessionId || `guest_${Date.now()}`,
        items: [],
      });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId && item.size === size,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        price: price || product.salePrice || product.price,
      });
    }

    await cart.save();
    await Cart.populate(cart, { path: 'items.product', select: 'name slug images' });

    res.json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await Cart.populate(cart, { path: 'items.product', select: 'name slug images' });

    res.json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
export const removeCartItem = async (req, res, next) => {
  try {
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    await Cart.populate(cart, { path: 'items.product', select: 'name slug images' });

    res.json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

// Apply coupon
export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    }

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    cart.couponApplied = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    };

    await cart.save();
    await Cart.populate(cart, { path: 'items.product', select: 'name slug images' });

    res.json({ success: true, data: { cart, discount: discountAmount } });
  } catch (error) {
    next(error);
  }
};

// Remove coupon
export const removeCoupon = async (req, res, next) => {
  try {
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.couponApplied = null;
    await cart.save();
    await Cart.populate(cart, { path: 'items.product', select: 'name slug images' });

    res.json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};

// Clear cart
export const clearCart = async (req, res, next) => {
  try {
    let cart;
    if (req.user) {
      cart = await Cart.findOne({ userId: req.user._id });
    } else if (req.query.sessionId) {
      cart = await Cart.findOne({ sessionId: req.query.sessionId });
    }

    if (cart) {
      cart.items = [];
      cart.couponApplied = null;
      await cart.save();
    }

    res.json({ success: true, data: { cart: { items: [], couponApplied: null } } });
  } catch (error) {
    next(error);
  }
};

// Guest cart operations
export const guestCart = async (req, res, next) => {
  try {
    const { sessionId, productId, quantity = 1, size, price } = req.body;

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({
        sessionId,
        items: [],
      });
    }

    if (productId) {
      const existingItem = cart.items.find(
        item => item.product.toString() === productId && item.size === size,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity, size, price });
      }
      await cart.save();
    }

    await Cart.populate(cart, {
      path: 'items.product',
      select: 'name slug images price salePrice',
    });

    res.json({ success: true, data: { cart } });
  } catch (error) {
    next(error);
  }
};
