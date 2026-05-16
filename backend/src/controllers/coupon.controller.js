import Coupon from '../models/Coupon.js';

// Get all coupons (for customers — only active/valid)
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

// Admin: Get all coupons with pagination, search & filters
export const getAdminCoupons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const status = req.query.status; // 'active' | 'inactive' | 'expired' | 'exhausted' | ''
    const discountType = req.query.discountType; // 'percentage' | 'fixed'
    const sortBy = req.query.sortBy || '-createdAt';

    const filter = {};

    // Search by code or description
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by discount type
    if (discountType && ['percentage', 'fixed'].includes(discountType)) {
      filter.discountType = discountType;
    }

    // Filter by status (computed, not stored — query separately for counts)
    let statusFilterApplied = false;
    if (status) {
      statusFilterApplied = true;
      const now = new Date();
      switch (status) {
        case 'active':
          filter.isActive = true;
          filter.validFrom = { $lte: now };
          filter.validUntil = { $gte: now };
          filter.$expr = { $lt: ['$usedCount', '$usageLimit'] };
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        case 'expired':
          filter.validUntil = { $lt: now };
          break;
        case 'exhausted':
          filter.$expr = { $gte: ['$usedCount', '$usageLimit'] };
          break;
      }
    }

    // Allowed sort fields
    const sortMap = {
      '-createdAt': { createdAt: -1 },
      'createdAt': { createdAt: 1 },
      '-code': { code: -1 },
      'code': { code: 1 },
      '-discountValue': { discountValue: -1 },
      'discountValue': { discountValue: 1 },
      '-validUntil': { validUntil: -1 },
      'validUntil': { validUntil: 1 },
      '-usedCount': { usedCount: -1 },
      'usedCount': { usedCount: 1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const [coupons, total, stats] = await Promise.all([
      Coupon.find(filter).sort(sort).skip(skip).limit(limit),
      Coupon.countDocuments(filter),
      getCouponStats()
    ]);

    res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Coupon statistics helper
const getCouponStats = async () => {
  const now = new Date();
  const [total, active, inactive, expired, exhausted] = await Promise.all([
    Coupon.countDocuments(),
    Coupon.countDocuments({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }),
    Coupon.countDocuments({ isActive: false }),
    Coupon.countDocuments({ validUntil: { $lt: now }, isActive: true }),
    Coupon.countDocuments({ $expr: { $gte: ['$usedCount', '$usageLimit'] }, isActive: true, validUntil: { $gte: now } })
  ]);

  return { total, active, inactive, expired, exhausted };
};

// Admin: Get coupon by ID
export const getAdminCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, data: { coupon } });
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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }
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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }
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

// Admin: Toggle coupon active status
export const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ success: true, data: { coupon } });
  } catch (error) {
    next(error);
  }
};
