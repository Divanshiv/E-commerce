import 'dotenv/config';
import mongoose from 'mongoose';
import { supabaseAdmin } from './src/config/supabase.js';
import User from './src/models/User.js';

async function createAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@kalaahstudio.com';
    const password = 'Password@123';

    console.log('Creating admin user...');

    // 1. Delete existing Supabase user if it exists to clean up unconfirmed states
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    if (usersData?.users) {
      const existingUser = usersData.users.find(u => u.email === email);
      if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        console.log('Cleaned up old unconfirmed Supabase user.');
      }
    }

    // 2. Create brand new confirmed user with Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses email confirmation!
      user_metadata: { full_name: 'Kalaah Studio Admin' }
    });

    if (error) {
      console.error('❌ Supabase Error:', error.message);
      process.exit(1);
    }

    // 3. Create or update in MongoDB
    await User.deleteOne({ email });
    const mongoUser = await User.create({
      supabaseId: data.user.id,
      email,
      name: 'Kalaah Studio Admin',
      role: 'admin' // Ensure role is admin
    });

    console.log('');
    console.log('🎉 ADMIN USER SUCCESSFULLY CREATED & CONFIRMED!');
    console.log('-------------------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------------------------------------');
    console.log('You can now log in safely!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Script Error:', err);
    process.exit(1);
  }
}

createAdmin();
