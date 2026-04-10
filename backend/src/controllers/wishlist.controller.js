import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Get wishlist
export const getWishlist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate('products', 'name slug images salePrice price brand');

    if (!wishlist) {
      wishlist = { products: [] };
    }

    res.json({ success: true, data: { wishlist } });
  } catch (error) {
    next(error);
  }
};

// Add to wishlist
export const addToWishlist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }

    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, products: [productId] });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();
    await Wishlist.populate(wishlist, { path: 'products', select: 'name slug images salePrice' });

    res.json({ success: true, data: { wishlist } });
  } catch (error) {
    next(error);
  }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }

    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (wishlist) {
      wishlist.products.pull(productId);
      await wishlist.save();
    }

    await Wishlist.populate(wishlist, { path: 'products', select: 'name slug images salePrice' });

    res.json({ success: true, data: { wishlist } });
  } catch (error) {
    next(error);
  }
};

// Toggle wishlist item
export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!req.user) {
      // For guests, use session-based wishlist
      const sessionWishlist = req.session?.wishlist || [];
      const index = sessionWishlist.indexOf(productId);
      
      if (index > -1) {
        sessionWishlist.splice(index, 1);
      } else {
        sessionWishlist.push(productId);
      }
      
      if (req.session) {
        req.session.wishlist = sessionWishlist;
      }

      return res.json({ success: true, data: { isInWishlist: index === -1 } });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });
    let isInWishlist = false;

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user._id, products: [productId] });
      isInWishlist = true;
    } else {
      const index = wishlist.products.indexOf(productId);
      if (index > -1) {
        wishlist.products.splice(index, 1);
        isInWishlist = false;
      } else {
        wishlist.products.push(productId);
        isInWishlist = true;
      }
    }

    await wishlist.save();

    res.json({ success: true, data: { isInWishlist } });
  } catch (error) {
    next(error);
  }
};
