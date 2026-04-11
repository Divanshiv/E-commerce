import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

// Import routes
import productRoutes from './src/routes/product.routes.js';
import brandRoutes from './src/routes/brand.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import wishlistRoutes from './src/routes/wishlist.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import couponRoutes from './src/routes/coupon.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import categoryRoutes from './src/routes/category.routes.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Disable HTTP caching for all API routes → always return 200, never 304
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

// ── Auto-seed helper ────────────────────────────────────────────────────────
import Product from './src/models/Product.js';
import Brand from './src/models/Brand.js';
import Coupon from './src/models/Coupon.js';
import ShipmentConfig from './src/models/ShipmentConfig.js';

async function autoSeed() {
  const count = await Product.countDocuments();
  if (count > 0) { console.log(`📦 Database already has ${count} products — skipping seed.`); return; }

  console.log('🌱 Empty database detected — seeding now...');

  const brandDefs = [
    { name: 'Urban Style', slug: 'urban-style', description: 'Modern streetwear for the bold', isActive: true },
    { name: 'Classic Wear', slug: 'classic-wear', description: 'Timeless fashion essentials', isActive: true },
    { name: 'Sport Elite', slug: 'sport-elite', description: 'Performance meets style', isActive: true },
    { name: 'Minimalist', slug: 'minimalist', description: 'Less is more', isActive: true }
  ];

  const productDefs = [
    // MEN'S T-SHIRTS
    { name: 'Classic White T-Shirt', description: 'Premium 100% cotton white t-shirt perfect for everyday wear. Soft, breathable, and effortlessly stylish.', price: 499, salePrice: 399, category: 'men-tshirts', isFeatured: true, sizes: [{ name: 'S', stock: 15 }, { name: 'M', stock: 25 }, { name: 'L', stock: 20 }, { name: 'XL', stock: 10 }], colors: [{ name: 'White', hex: '#FFFFFF' }], images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' }], rating: { average: 4.5, count: 128 }, tags: ['basic', 'white', 'essential'], bi: 1 },
    { name: 'Graphic Print Tee', description: 'Bold graphic print t-shirt with unique artwork. Make a statement wherever you go.', price: 799, salePrice: 599, category: 'men-tshirts', isFeatured: true, sizes: [{ name: 'S', stock: 12 }, { name: 'M', stock: 18 }, { name: 'L', stock: 15 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80' }], rating: { average: 4.3, count: 85 }, tags: ['graphic', 'print', 'bold'], bi: 0 },
    { name: 'Striped Polo Shirt', description: 'Classic striped polo shirt for a refined casual look. Perfect for office or weekend outings.', price: 999, salePrice: 799, category: 'men-tshirts', isFeatured: false, sizes: [{ name: 'M', stock: 10 }, { name: 'L', stock: 12 }, { name: 'XL', stock: 8 }], colors: [{ name: 'Navy', hex: '#1B2A6B' }], images: [{ url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&q=80' }], rating: { average: 4.1, count: 60 }, tags: ['polo', 'striped', 'formal'], bi: 1 },
    { name: 'Oversized Drop Shoulder Tee', description: 'Trendy oversized drop-shoulder tee. Relaxed silhouette with premium heavy jersey fabric.', price: 699, salePrice: 549, category: 'men-tshirts', isFeatured: true, sizes: [{ name: 'M', stock: 20 }, { name: 'L', stock: 18 }, { name: 'XL', stock: 12 }], colors: [{ name: 'Olive', hex: '#6B6B2B' }], images: [{ url: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&q=80' }], rating: { average: 4.6, count: 210 }, tags: ['oversized', 'trendy'], bi: 0 },
    { name: 'Vintage Washed Tee', description: 'Retro-inspired washed tee with a lived-in feel. Soft, pre-washed fabric for instant comfort.', price: 649, salePrice: 499, category: 'men-tshirts', isFeatured: false, sizes: [{ name: 'S', stock: 10 }, { name: 'M', stock: 15 }, { name: 'L', stock: 10 }], colors: [{ name: 'Washed Blue', hex: '#6CA0DC' }], images: [{ url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80' }], rating: { average: 4.4, count: 95 }, tags: ['vintage', 'washed', 'retro'], bi: 0 },
    { name: 'Henley Neck T-Shirt', description: 'Sophisticated henley neck design with buttoned placket. Elevated take on the casual tee.', price: 849, salePrice: 699, category: 'men-tshirts', isFeatured: false, sizes: [{ name: 'S', stock: 8 }, { name: 'M', stock: 14 }, { name: 'L', stock: 12 }], colors: [{ name: 'Burgundy', hex: '#800020' }], images: [{ url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80' }], rating: { average: 4.2, count: 73 }, tags: ['henley', 'casual'], bi: 1 },
    { name: 'Slim Fit V-Neck Tee', description: 'Clean slim-fit V-neck tee in premium cotton stretch. Perfect layering piece or standalone.', price: 549, salePrice: null, category: 'men-tshirts', isFeatured: false, sizes: [{ name: 'S', stock: 20 }, { name: 'M', stock: 25 }, { name: 'L', stock: 18 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80' }], rating: { average: 4.0, count: 52 }, tags: ['slim-fit', 'v-neck'], bi: 2 },
    { name: 'Athletic Performance Tee', description: 'Moisture-wicking performance tee for active lifestyles. Lightweight, breathable, anti-odour.', price: 999, salePrice: 799, category: 'men-tshirts', isFeatured: false, sizes: [{ name: 'S', stock: 15 }, { name: 'M', stock: 20 }, { name: 'L', stock: 15 }], colors: [{ name: 'Electric Blue', hex: '#0066FF' }], images: [{ url: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80' }], rating: { average: 4.5, count: 140 }, tags: ['athletic', 'performance', 'sport'], bi: 2 },
    // WOMEN'S T-SHIRTS
    { name: 'Women Floral Tee', description: 'Beautiful floral print t-shirt for women. Relaxed fit with ultra-soft breathable fabric.', price: 599, salePrice: 449, category: 'women-tshirts', isFeatured: true, sizes: [{ name: 'XS', stock: 8 }, { name: 'S', stock: 12 }, { name: 'M', stock: 18 }], colors: [{ name: 'Pink', hex: '#FFB6C1' }], images: [{ url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80' }], rating: { average: 4.6, count: 175 }, tags: ['women', 'floral', 'summer'], bi: 1 },
    { name: 'Women Basic Tee', description: 'Essential women t-shirt in soft pastel colors. The perfect everyday basic.', price: 449, salePrice: 349, category: 'women-tshirts', isFeatured: false, sizes: [{ name: 'XS', stock: 10 }, { name: 'S', stock: 15 }, { name: 'M', stock: 20 }], colors: [{ name: 'Lavender', hex: '#E6E6FA' }], images: [{ url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600&q=80' }], rating: { average: 4.3, count: 112 }, tags: ['women', 'basic', 'pastel'], bi: 1 },
    { name: 'Cropped Logo Tee', description: 'Trendy cropped tee with minimalist chest logo. Pair with high-waist jeans or skirts.', price: 549, salePrice: 429, category: 'women-tshirts', isFeatured: true, sizes: [{ name: 'XS', stock: 12 }, { name: 'S', stock: 16 }, { name: 'M', stock: 10 }], colors: [{ name: 'White', hex: '#FFFFFF' }], images: [{ url: 'https://images.unsplash.com/photo-1590330297626-d7aff25a0431?w=600&q=80' }], rating: { average: 4.7, count: 198 }, tags: ['cropped', 'logo', 'trendy'], bi: 0 },
    { name: 'Women Oversized Tee', description: 'Effortlessly chic oversized tee for women. Boyfriend-fit silhouette with dropped shoulders.', price: 649, salePrice: 499, category: 'women-tshirts', isFeatured: false, sizes: [{ name: 'S', stock: 14 }, { name: 'M', stock: 18 }, { name: 'L', stock: 12 }], colors: [{ name: 'Sage Green', hex: '#B2AC88' }], images: [{ url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80' }], rating: { average: 4.4, count: 143 }, tags: ['women', 'oversized'], bi: 0 },
    { name: 'Women Striped Top', description: 'Classic French-inspired striped top. Timeless nautical style.', price: 699, salePrice: null, category: 'women-tshirts', isFeatured: false, sizes: [{ name: 'XS', stock: 10 }, { name: 'S', stock: 14 }, { name: 'M', stock: 12 }], colors: [{ name: 'Navy & White', hex: '#1B2A6B' }], images: [{ url: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80' }], rating: { average: 4.2, count: 67 }, tags: ['women', 'striped', 'nautical'], bi: 1 },
    { name: 'Tie-Dye Festival Tee', description: 'Vibrant tie-dye tee for a festival-ready look. Each piece uniquely patterned.', price: 799, salePrice: 599, category: 'women-tshirts', isFeatured: true, sizes: [{ name: 'XS', stock: 8 }, { name: 'S', stock: 12 }, { name: 'M', stock: 10 }], colors: [{ name: 'Multicolor', hex: '#FF6B6B' }], images: [{ url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600&q=80' }], rating: { average: 4.8, count: 225 }, tags: ['tie-dye', 'festival'], bi: 0 },
    // HOODIES
    { name: 'Oversized Hoodie', description: 'Super comfortable oversized hoodie. Premium fleece interior, drawstring hood.', price: 1499, salePrice: 1199, category: 'hoodies', isFeatured: true, sizes: [{ name: 'S', stock: 8 }, { name: 'M', stock: 15 }, { name: 'L', stock: 12 }, { name: 'XL', stock: 10 }], colors: [{ name: 'Grey Marl', hex: '#B0B0B0' }], images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80' }], rating: { average: 4.7, count: 310 }, tags: ['oversized', 'hoodie', 'cozy'], bi: 0 },
    { name: 'Zip-Up Hoodie', description: 'Full zip hoodie with kangaroo pocket. Versatile layering piece for any season.', price: 1699, salePrice: 1399, category: 'hoodies', isFeatured: false, sizes: [{ name: 'M', stock: 10 }, { name: 'L', stock: 8 }, { name: 'XL', stock: 6 }], colors: [{ name: 'Navy', hex: '#1B2A6B' }], images: [{ url: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&q=80' }], rating: { average: 4.5, count: 187 }, tags: ['zip-up', 'hoodie'], bi: 2 },
    { name: 'Pullover Fleece Hoodie', description: 'Ultra-warm pullover hoodie with thick fleece lining. Your best cold-day companion.', price: 1899, salePrice: 1499, category: 'hoodies', isFeatured: true, sizes: [{ name: 'S', stock: 10 }, { name: 'M', stock: 14 }, { name: 'L', stock: 12 }, { name: 'XL', stock: 8 }], colors: [{ name: 'Rust Orange', hex: '#B7410E' }], images: [{ url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80' }], rating: { average: 4.8, count: 275 }, tags: ['fleece', 'pullover', 'warm'], bi: 0 },
    { name: 'Graphic Hoodie', description: 'Statement graphic hoodie with bold chest print. Street style ready.', price: 1599, salePrice: 1299, category: 'hoodies', isFeatured: false, sizes: [{ name: 'M', stock: 12 }, { name: 'L', stock: 15 }, { name: 'XL', stock: 10 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80' }], rating: { average: 4.4, count: 145 }, tags: ['graphic', 'hoodie', 'streetwear'], bi: 0 },
    { name: 'Quarter Zip Sweatshirt', description: 'Classic quarter-zip sweatshirt for a smart-casual look.', price: 1399, salePrice: null, category: 'hoodies', isFeatured: false, sizes: [{ name: 'S', stock: 10 }, { name: 'M', stock: 14 }, { name: 'L', stock: 10 }], colors: [{ name: 'Burgundy', hex: '#800020' }], images: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80' }], rating: { average: 4.3, count: 98 }, tags: ['quarter-zip', 'sweatshirt'], bi: 1 },
    { name: 'Cropped Hoodie', description: 'Trendy cropped hoodie for women. Pairs perfectly with high-waist joggers.', price: 1299, salePrice: 999, category: 'hoodies', isFeatured: false, sizes: [{ name: 'XS', stock: 10 }, { name: 'S', stock: 14 }, { name: 'M', stock: 12 }], colors: [{ name: 'Lilac', hex: '#C8A2C8' }], images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' }], rating: { average: 4.6, count: 230 }, tags: ['cropped', 'hoodie', 'women'], bi: 0 },
    // JOGGERS
    { name: 'Comfort Joggers', description: 'Ultra-soft joggers with elastic waistband and tapered fit. Perfect for workout or lounging.', price: 999, salePrice: 799, category: 'joggers', isFeatured: true, sizes: [{ name: 'S', stock: 10 }, { name: 'M', stock: 15 }, { name: 'L', stock: 12 }, { name: 'XL', stock: 8 }], colors: [{ name: 'Dark Grey', hex: '#555555' }], images: [{ url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80' }], rating: { average: 4.5, count: 265 }, tags: ['joggers', 'comfort', 'athletic'], bi: 2 },
    { name: 'Slim Fit Joggers', description: 'Stylish slim fit joggers for the modern look. Tapered design with ribbed cuffs.', price: 1199, salePrice: 999, category: 'joggers', isFeatured: false, sizes: [{ name: 'M', stock: 8 }, { name: 'L', stock: 10 }, { name: 'XL', stock: 6 }], colors: [{ name: 'Charcoal', hex: '#36454F' }], images: [{ url: 'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=600&q=80' }], rating: { average: 4.3, count: 121 }, tags: ['slim-fit', 'joggers'], bi: 3 },
    { name: 'Cargo Joggers', description: 'Functional cargo joggers with multiple pockets. Style meets utility.', price: 1499, salePrice: 1199, category: 'joggers', isFeatured: true, sizes: [{ name: 'S', stock: 8 }, { name: 'M', stock: 12 }, { name: 'L', stock: 10 }], colors: [{ name: 'Olive', hex: '#6B6B2B' }], images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' }], rating: { average: 4.6, count: 189 }, tags: ['cargo', 'joggers', 'utility'], bi: 0 },
    { name: 'Track Pants', description: 'Classic track pants with contrast side stripes. Lightweight, perfect for sport or casual wear.', price: 1099, salePrice: 899, category: 'joggers', isFeatured: false, sizes: [{ name: 'S', stock: 10 }, { name: 'M', stock: 14 }, { name: 'L', stock: 12 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80' }], rating: { average: 4.2, count: 97 }, tags: ['track-pants', 'sport'], bi: 2 },
    { name: 'Fleece Sweatpants', description: 'Thick fleece sweatpants for maximum warmth. Lounge in ultimate cozy style.', price: 1299, salePrice: 999, category: 'joggers', isFeatured: false, sizes: [{ name: 'M', stock: 12 }, { name: 'L', stock: 10 }, { name: 'XL', stock: 8 }], colors: [{ name: 'Heather Grey', hex: '#B0B0B0' }], images: [{ url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&q=80' }], rating: { average: 4.4, count: 156 }, tags: ['fleece', 'sweatpants', 'warm'], bi: 0 },
    // ACCESSORIES
    { name: 'Classic Snapback Cap', description: 'Adjustable snapback cap with embroidered logo. One size fits all.', price: 499, salePrice: 399, category: 'accessories', isFeatured: false, sizes: [{ name: 'M', stock: 40 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80' }], rating: { average: 4.3, count: 152 }, tags: ['cap', 'snapback'], bi: 0 },
    { name: 'Minimalist Backpack', description: 'Sleek minimalist backpack with laptop compartment. 25L, water-resistant.', price: 1999, salePrice: 1599, category: 'accessories', isFeatured: true, sizes: [{ name: 'M', stock: 20 }], colors: [{ name: 'Black', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' }], rating: { average: 4.7, count: 215 }, tags: ['backpack', 'bag', 'laptop'], bi: 3 },
    { name: 'Cotton Socks Pack', description: 'Pack of 6 premium cotton socks. Cushioned sole for all-day comfort.', price: 299, salePrice: 199, category: 'accessories', isFeatured: false, sizes: [{ name: 'M', stock: 80 }], colors: [{ name: 'Assorted', hex: '#FF6B6B' }], images: [{ url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600&q=80' }], rating: { average: 4.4, count: 320 }, tags: ['socks', 'cotton'], bi: 1 },
    { name: 'Canvas Tote Bag', description: 'Eco-friendly heavy canvas tote bag. Carry your essentials sustainably.', price: 599, salePrice: 449, category: 'accessories', isFeatured: false, sizes: [{ name: 'M', stock: 35 }], colors: [{ name: 'Natural', hex: '#F5F5DC' }], images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80' }], rating: { average: 4.5, count: 187 }, tags: ['tote', 'canvas', 'eco'], bi: 3 },
    { name: 'Sports Duffel Bag', description: 'Spacious sports duffel with wet-dry compartment. Perfect for gym or travel.', price: 1799, salePrice: 1399, category: 'accessories', isFeatured: true, sizes: [{ name: 'M', stock: 15 }], colors: [{ name: 'Black & Red', hex: '#000000' }], images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' }], rating: { average: 4.6, count: 132 }, tags: ['duffel', 'gym', 'sports'], bi: 2 },
    { name: 'Beanie Hat', description: 'Soft ribbed knit beanie. One size fits most. Unisex design.', price: 349, salePrice: 249, category: 'accessories', isFeatured: false, sizes: [{ name: 'M', stock: 50 }], colors: [{ name: 'Charcoal', hex: '#36454F' }], images: [{ url: 'https://images.unsplash.com/photo-1510598155619-9501e96ae39e?w=600&q=80' }], rating: { average: 4.5, count: 204 }, tags: ['beanie', 'hat', 'winter'], bi: 1 },
    { name: 'Woven Belt', description: 'Stylish woven belt with brushed metal buckle. Fits waist 28–38 inches.', price: 399, salePrice: 299, category: 'accessories', isFeatured: false, sizes: [{ name: 'M', stock: 30 }], colors: [{ name: 'Brown', hex: '#8B4513' }], images: [{ url: 'https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=600&q=80' }], rating: { average: 4.1, count: 86 }, tags: ['belt', 'woven'], bi: 1 }
  ];

  const createdBrands = await Brand.insertMany(brandDefs);

  const productsWithMeta = productDefs.map(p => {
    const { bi, ...rest } = p;
    return {
      ...rest,
      slug: rest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000),
      brand: createdBrands[bi]._id
    };
  });
  await Product.insertMany(productsWithMeta);

  await Coupon.insertMany([
    { code: 'WELCOME10', description: '10% off on your first order', discountType: 'percentage', discountValue: 10, minOrderValue: 0, maxDiscount: 200, usageLimit: 100, validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true },
    { code: 'FLAT200', description: 'Flat ₹200 off on orders above ₹999', discountType: 'fixed', discountValue: 200, minOrderValue: 999, usageLimit: 50, validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), isActive: true },
    { code: 'SAVE20', description: '20% off up to ₹500 on orders above ₹499', discountType: 'percentage', discountValue: 20, minOrderValue: 499, maxDiscount: 500, usageLimit: 100, validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), isActive: true }
  ]);

  await ShipmentConfig.create({ freeShippingThreshold: 999, standardRate: 49, expressRate: 99, codCharges: 30 });

  console.log(`✅ Auto-seed complete: ${createdBrands.length} brands, ${productsWithMeta.length} products, 3 coupons`);
}
// ────────────────────────────────────────────────────────────────────────────

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await autoSeed();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

export default app;

