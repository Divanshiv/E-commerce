import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Product from './src/models/Product.js';
import Order from './src/models/Order.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create Dummy Users
    const dummyUsers = [
      { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210' },
      { name: 'Anjali Gupta', email: 'anjali@example.com', phone: '9827364510' },
      { name: 'Vikram Singh', email: 'vikram@example.com', phone: '9988776655' },
      { name: 'Sneha Patel', email: 'sneha@example.com', phone: '9123456789' },
      { name: 'Arjun Das', email: 'arjun@example.com', phone: '9888777666' }
    ];

    const createdUsers = [];
    for (let uData of dummyUsers) {
      let user = await User.findOne({ email: uData.email });
      if (!user) {
        user = await User.create(uData);
        console.log(`👤 Created User: ${uData.name}`);
      }
      createdUsers.push(user);
    }

    // 2. Get Products
    const products = await Product.find({ isActive: true });
    if (products.length === 0) {
      console.log('❌ No products found. Run seed.js first.');
      process.exit(1);
    }

    // 3. Generate Random Orders (past 30 days)
    const statuses = ['delivered', 'processing', 'confirmed', 'shipped', 'pending', 'cancelled'];
    const now = new Date();
    
    console.log('📦 Generating orders...');
    
    for (let i = 0; i < 25; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const orderDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Random product selection
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = prod.salePrice || prod.price;
        
        orderItems.push({
          product: prod._id,
          name: prod.name,
          image: prod.images?.[0]?.url || '',
          size: prod.sizes?.[0]?.name || 'M',
          quantity: qty,
          price: price
        });
        subtotal += price * qty;
      }

      const shipping = subtotal > 1000 ? 0 : 99;
      const total = subtotal + shipping;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await Order.create({
        user: user._id,
        items: orderItems,
        subtotal,
        shippingCharges: shipping,
        total,
        status,
        payment: {
          method: Math.random() > 0.5 ? 'razorpay' : 'cod',
          status: status === 'delivered' || Math.random() > 0.3 ? 'paid' : 'pending'
        },
        address: {
          street: '123 Dummy Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          phone: user.phone
        },
        createdAt: orderDate
      });
    }

    console.log('🎉 Successfully generated 25 orders and 5 users.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    process.exit(1);
  }
}

seed();
