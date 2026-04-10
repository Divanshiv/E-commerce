import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Brand from './src/models/Brand.js';
import Coupon from './src/models/Coupon.js';
import ShipmentConfig from './src/models/ShipmentConfig.js';
import Order from './src/models/Order.js';

async function clearDb() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('No MONGODB_URI found in .env');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Brand.deleteMany({}),
      Coupon.deleteMany({}),
      ShipmentConfig.deleteMany({}),
      Order.deleteMany({})
    ]);
    console.log('✅ Successfully removed all seed and store data from the database!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDb();
