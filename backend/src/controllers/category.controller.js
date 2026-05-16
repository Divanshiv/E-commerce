import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// Admin: Get categories with product count
export const getAdminCategories = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const matchFilter = {};
    if (search) matchFilter.name = { $regex: search, $options: 'i' };
    if (status === 'active') matchFilter.isActive = true;
    if (status === 'inactive') matchFilter.isActive = false;

    const categories = await Category.find(matchFilter).sort({ name: 1 });

    // Get product counts per category
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    productCounts.forEach(({ _id, count }) => {
      countMap[_id] = count;
    });

    const enriched = categories.map(cat => ({
      ...cat.toObject(),
      productCount: countMap[cat.name] || 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// Admin: Category stats
export const getCategoryStats = async (req, res, next) => {
  try {
    const [total, active, inactive] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false }),
    ]);

    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const totalProductsInCategories = productCounts.reduce((sum, c) => sum + c.count, 0);

    res.json({
      success: true,
      data: { total, active, inactive, totalProductsInCategories },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
