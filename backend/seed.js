import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Brand from './src/models/Brand.js';
import Coupon from './src/models/Coupon.js';
import ShipmentConfig from './src/models/ShipmentConfig.js';

const brands = [
  { name: 'Urban Style', slug: 'urban-style', description: 'Modern streetwear for the bold', isActive: true },
  { name: 'Classic Wear', slug: 'classic-wear', description: 'Timeless fashion essentials', isActive: true },
  { name: 'Sport Elite', slug: 'sport-elite', description: 'Performance meets style', isActive: true },
  { name: 'Minimalist', slug: 'minimalist', description: 'Less is more', isActive: true }
];

const products = [
  {
    name: 'Classic White T-Shirt',
    description: 'Premium cotton white t-shirt perfect for everyday wear. Soft, comfortable, and stylish.',
    price: 499,
    salePrice: 399,
    category: 'men-tshirts',
    sizes: [
      { name: 'S', stock: 15 },
      { name: 'M', stock: 25 },
      { name: 'L', stock: 20 },
      { name: 'XL', stock: 10 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500' }],
    isFeatured: true,
    tags: ['basic', 'white', 'essential']
  },
  {
    name: 'Graphic Print Tee',
    description: 'Bold graphic print t-shirt with unique artwork. Make a statement wherever you go.',
    price: 799,
    salePrice: 599,
    category: 'men-tshirts',
    sizes: [
      { name: 'S', stock: 12 },
      { name: 'M', stock: 18 },
      { name: 'L', stock: 15 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500' }],
    isFeatured: true,
    tags: ['graphic', 'print', 'bold']
  },
  {
    name: 'Striped Polo Shirt',
    description: 'Classic striped polo shirt for a refined casual look. Perfect for office or weekend.',
    price: 999,
    salePrice: 799,
    category: 'men-tshirts',
    sizes: [
      { name: 'M', stock: 10 },
      { name: 'L', stock: 12 },
      { name: 'XL', stock: 8 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=500' }],
    isFeatured: false,
    tags: ['polo', 'striped', 'formal']
  },
  {
    name: 'Oversized Hoodie',
    description: 'Super comfortable oversized hoodie for ultimate relaxation. Premium fleece interior.',
    price: 1499,
    salePrice: 1199,
    category: 'hoodies',
    sizes: [
      { name: 'S', stock: 8 },
      { name: 'M', stock: 15 },
      { name: 'L', stock: 12 },
      { name: 'XL', stock: 10 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500' }],
    isFeatured: true,
    tags: ['oversized', 'hoodie', 'cozy']
  },
  {
    name: 'Zip-Up Hoodie',
    description: 'Full zip hoodie with kangaroo pocket. Great for layering in any season.',
    price: 1699,
    salePrice: 1399,
    category: 'hoodies',
    sizes: [
      { name: 'M', stock: 10 },
      { name: 'L', stock: 8 },
      { name: 'XL', stock: 6 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=500' }],
    isFeatured: false,
    tags: ['zip-up', 'hoodie', 'layering']
  },
  {
    name: 'Comfort Joggers',
    description: 'Ultra-soft joggers with elastic waistband. Perfect for workout or lounging.',
    price: 999,
    salePrice: 799,
    category: 'joggers',
    sizes: [
      { name: 'S', stock: 10 },
      { name: 'M', stock: 15 },
      { name: 'L', stock: 12 },
      { name: 'XL', stock: 8 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' }],
    isFeatured: true,
    tags: ['joggers', 'comfort', 'athletic']
  },
  {
    name: 'Slim Fit Joggers',
    description: 'Stylish slim fit joggers for the modern look. Tapered design with cuffs.',
    price: 1199,
    salePrice: 999,
    category: 'joggers',
    sizes: [
      { name: 'M', stock: 8 },
      { name: 'L', stock: 10 },
      { name: 'XL', stock: 6 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500' }],
    isFeatured: false,
    tags: ['slim-fit', 'joggers', 'modern']
  },
  {
    name: 'Classic Cap',
    description: 'Adjustable classic cap with embroidered logo. One size fits all.',
    price: 399,
    salePrice: 299,
    category: 'accessories',
    sizes: [{ name: 'M', stock: 30 }],
    images: [{ url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500' }],
    isFeatured: false,
    tags: ['cap', 'hat', 'accessory']
  },
  {
    name: 'Minimalist Backpack',
    description: 'Sleek minimalist backpack with laptop compartment. 25L capacity.',
    price: 1999,
    salePrice: 1599,
    category: 'accessories',
    sizes: [{ name: 'M', stock: 15 }],
    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' }],
    isFeatured: true,
    tags: ['backpack', 'bag', 'laptop']
  },
  {
    name: 'Cotton Socks Pack',
    description: 'Pack of 6 premium cotton socks. Comfortable for all-day wear.',
    price: 299,
    salePrice: 199,
    category: 'accessories',
    sizes: [{ name: 'M', stock: 50 }],
    images: [{ url: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=500' }],
    isFeatured: false,
    tags: ['socks', 'cotton', 'pack']
  },
  {
    name: 'Women Floral Tee',
    description: 'Beautiful floral print t-shirt for women. Relaxed fit with soft fabric.',
    price: 599,
    salePrice: 449,
    category: 'women-tshirts',
    sizes: [
      { name: 'S', stock: 12 },
      { name: 'M', stock: 18 },
      { name: 'L', stock: 10 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500' }],
    isFeatured: true,
    tags: ['women', 'floral', 'summer']
  },
  {
    name: 'Women Basic Tee',
    description: 'Essential women t-shirt in soft pastel colors. Perfect everyday basic.',
    price: 449,
    salePrice: 349,
    category: 'women-tshirts',
    sizes: [
      { name: 'XS', stock: 10 },
      { name: 'S', stock: 15 },
      { name: 'M', stock: 20 }
    ],
    images: [{ url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500' }],
    isFeatured: false,
    tags: ['women', 'basic', 'essential']
  }
];

const coupons = [
  {
    code: 'WELCOME10',
    description: '10% off on your first order',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 200,
    usageLimit: 100,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'FLAT200',
    description: 'Flat ₹200 off on orders above ₹999',
    discountType: 'fixed',
    discountValue: 200,
    minOrderValue: 999,
    usageLimit: 50,
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: 'SAVE20',
    description: '20% off up to ₹500',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 499,
    maxDiscount: 500,
    usageLimit: 100,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Brand.deleteMany({}),
      Coupon.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create brands
    const createdBrands = await Brand.insertMany(brands);
    console.log(`Created ${createdBrands.length} brands`);

    // Add brand references to products
    const productsWithBrands = products.map((product, index) => ({
      ...product,
      brand: createdBrands[index % createdBrands.length]._id
    }));

    // Create products
    const createdProducts = await Product.insertMany(productsWithBrands);
    console.log(`Created ${createdProducts.length} products`);

    // Create coupons
    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`Created ${createdCoupons.length} coupons`);

    // Create default shipment config
    await ShipmentConfig.findOneAndUpdate(
      {},
      {
        freeShippingThreshold: 999,
        standardRate: 49,
        expressRate: 99,
        codCharges: 30
      },
      { upsert: true }
    );
    console.log('Created shipment config');

    // Create admin user (manual - needs Supabase account)
    console.log('\n📝 Admin user setup:');
    console.log('Create admin user manually in MongoDB or via Supabase dashboard');
    console.log('Set role: "admin" for admin users');

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
