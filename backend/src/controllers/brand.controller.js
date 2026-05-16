import Brand from '../models/Brand.js';

// Get all brands
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort('name');
    res.json({ success: true, data: { brands } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all brands (including inactive)
export const getAdminBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort('name');
    res.json({ success: true, data: { brands } });
  } catch (error) {
    next(error);
  }
};

// Admin: Create brand
export const createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ success: true, data: { brand } });
  } catch (error) {
    next(error);
  }
};

// Admin: Update brand
export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.json({ success: true, data: { brand } });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete brand
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    next(error);
  }
};
