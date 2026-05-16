import Product from '../models/Product.js';
import { createLowStockNotification } from './notification.controller.js';
import Brand from '../models/Brand.js';

// Get all products with filters
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      size,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    // Filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (minPrice || maxPrice) {
      query.salePrice = {};
      if (minPrice) query.salePrice.$gte = Number(minPrice);
      if (maxPrice) query.salePrice.$lte = Number(maxPrice);
    }
    if (size) query['sizes.name'] = size;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).populate('brand', 'name slug').sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        products,
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

// Get featured products
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate('brand', 'name slug')
      .sort('-createdAt')
      .limit(8);

    res.json({ success: true, data: { products } });
  } catch (error) {
    next(error);
  }
};

// Get product by slug
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
      'brand',
      'name slug',
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all products (including inactive)
export const getAdminProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();
    const stockStatus = req.query.stockStatus; // 'in_stock' | 'low_stock' | 'out_of_stock' | 'all'
    const category = req.query.category;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    // Stock filter is computed — query all matching products then compute
    // But for efficiency, we add a pre-filter when possible
    let stockFilterFn = null;
    if (stockStatus && stockStatus !== 'all') {
      stockFilterFn = products =>
        products.filter(p => {
          const totalStock = p.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
          switch (stockStatus) {
            case 'in_stock':
              return totalStock > 5;
            case 'low_stock':
              return totalStock > 0 && totalStock <= 5;
            case 'out_of_stock':
              return totalStock === 0;
            default:
              return true;
          }
        });
    }

    let products = await Product.find(filter)
      .populate('brand', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    let total = await Product.countDocuments(filter);

    // Apply post-query stock filter
    if (stockFilterFn) {
      products = stockFilterFn(products);
      // Recalculate total for stock-filtered results
      const allMatching = await Product.find(filter).populate('brand', 'name').sort('-createdAt');
      const filtered = stockFilterFn(allMatching);
      total = filtered.length;
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get inventory dashboard stats
export const getInventoryStats = async (req, res, next) => {
  try {
    const products = await Product.find().select('sizes category');

    let totalProducts = products.length;
    let totalStock = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    const categoryMap = {};

    products.forEach(p => {
      const stock = p.sizes?.reduce((sum, s) => sum + s.stock, 0) || 0;
      totalStock += stock;

      if (stock === 0) outOfStock++;
      else if (stock <= 5) lowStock++;
      else inStock++;

      if (p.category) {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalStock,
          inStock,
          lowStock,
          outOfStock,
        },
        categoryBreakdown: Object.entries(categoryMap).map(([category, count]) => ({
          category,
          count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Bulk update stock for multiple products
export const bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body; // [{ productId, sizes: [{ name, stock }] }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    const results = await Promise.allSettled(
      updates.map(async ({ productId, sizes }) => {
        const product = await Product.findByIdAndUpdate(
          productId,
          { sizes },
          { new: true, runValidators: true },
        );
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }
        // Check low stock after update
        const lowStockSizes = product.sizes.filter(s => s.stock > 0 && s.stock < 5);
        lowStockSizes.forEach(size => createLowStockNotification(product, size));
        return { productId, name: product.name, success: true };
      }),
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => ({
        productId: r.reason.message.split(' ')[0],
        error: r.reason.message,
      }));

    res.json({
      success: true,
      data: { succeeded, failed },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create product
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// Admin: Update product
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check for low stock sizes and trigger notifications
    const lowStockSizes = product.sizes.filter(s => s.stock > 0 && s.stock < 5);
    lowStockSizes.forEach(size => createLowStockNotification(product, size));

    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: Upload product images
export const uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        uploadedImages.push({
          url: `/uploads/${file.filename}`,
          publicId: file.filename,
        });
      }
    }

    // If req.body.urls provided (for direct URL uploads like from Cloudinary)
    if (req.body.urls) {
      const urls = Array.isArray(req.body.urls) ? req.body.urls : [req.body.urls];
      for (const url of urls) {
        uploadedImages.push({ url, publicId: '' });
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    product.images.push(...uploadedImages);
    await product.save();

    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// Get search suggestions (lightweight - names + slugs only)
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const regex = new RegExp(q, 'i');
    const products = await Product.find(
      {
        isActive: true,
        $or: [{ name: { $regex: regex } }, { tags: { $in: [regex] } }],
      },
      { name: 1, slug: 1, images: { $slice: 1 }, salePrice: 1, price: 1 },
    )
      .sort({ rating: -1 })
      .limit(8);

    const suggestions = products.map(p => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0]?.url || null,
      price: p.salePrice || p.price,
    }));

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};

// Get categories with counts
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const categoryMap = {
      'men-tshirts': 'Men Tees',
      'women-tshirts': 'Women Tees',
      hoodies: 'Hoodies',
      joggers: 'Joggers',
      accessories: 'Accessories',
    };

    const formatted = categories.map(c => ({
      slug: c._id,
      name: categoryMap[c._id] || c._id,
      count: c.count,
    }));

    res.json({ success: true, data: { categories: formatted } });
  } catch (error) {
    next(error);
  }
};
