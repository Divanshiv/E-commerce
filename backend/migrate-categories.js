import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Product from './src/models/Product.js';
import Category from './src/models/Category.js';

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) { console.error('❌ No MONGODB_URI found in .env'); process.exit(1); }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Get unique categories from products
    const products = await Product.find({});
    const uniqueSlugs = [...new Set(products.map(p => p.category))];

    console.log(`Found ${uniqueSlugs.length} unique categories used in products.`);

    for (let slug of uniqueSlugs) {
      // Create readable name from slug: "men-tshirts" -> "Men Tshirts"
      const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      const exists = await Category.findOne({ slug });
      if (!exists) {
        await Category.create({ name, slug });
        console.log(`Created Category: ${name} (${slug})`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
