import Coupon from '../models/Coupon.js';

// Get all coupons (for customers)
export const getCoupons = async (req, res, next) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }).select('code description discountType discountValue minOrderValue');

    res.json({ success: true, data: { coupons } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all coupons
export const getAdminCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.json({ success: true, data: { coupons } });
  } catch (error) {
    next(error);
  }
};

// Admin: Create coupon
export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: { coupon } });
  } catch (error) {
    next(error);
  }
};

// Admin: Update coupon
export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, data: { coupon } });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete coupon
export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
