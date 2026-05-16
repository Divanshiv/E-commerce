import User from '../models/User.js';
import Order from '../models/Order.js';
import { supabaseAdmin } from '../config/supabase.js';

// Signup with Supabase
export const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Create user in Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // Create user in MongoDB
    const mongoUser = await User.create({
      supabaseId: user.id,
      email: user.email,
      name,
      role: 'user'
    });

    // Sign in to get a proper session token
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError) {
      // User created but session generation failed — still return user
      return res.status(201).json({
        success: true,
        data: { user: mongoUser }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: mongoUser,
        session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login with Supabase
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ success: false, message: error.message });
    }

    // Find or create MongoDB user
    let mongoUser = await User.findOne({ supabaseId: data.user.id });

    if (!mongoUser) {
      mongoUser = await User.create({
        supabaseId: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'user'
      });
    }

    res.json({
      success: true,
      data: {
        user: mongoUser,
        session: data.session
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (_req, res, _next) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    _next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    res.json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

// Google OAuth callback
export const googleCallback = async (req, res, next) => {
  try {
    const { supabase_token } = req.body;

    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(supabase_token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Find or create MongoDB user
    let mongoUser = await User.findOne({ supabaseId: user.id });

    if (!mongoUser) {
      mongoUser = await User.create({
        supabaseId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
        role: 'user'
      });
    }

    res.json({
      success: true,
      data: {
        user: mongoUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    const allowedUpdates = ['name', 'phone', 'avatar'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// Add address
export const addAddress = async (req, res, next) => {
  try {
    const { street, city, state, pincode, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({ street, city, state, pincode, isDefault: isDefault || false });
    await user.save();

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// Delete address
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull({ _id: req.params.addressId });
    await user.save();

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all customers
export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, total, orderStats] = await Promise.all([
      User.find(filter)
        .select('-__v')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
      Order.aggregate([
        { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } }
      ])
    ]);

    const statsMap = {};
    orderStats.forEach(({ _id, orderCount, totalSpent }) => {
      statsMap[_id.toString()] = { orderCount, totalSpent };
    });

    const enriched = customers.map(c => ({
      ...c.toObject(),
      orderCount: statsMap[c._id.toString()]?.orderCount || 0,
      totalSpent: statsMap[c._id.toString()]?.totalSpent || 0
    }));

    res.json({
      success: true,
      data: {
        customers: enriched,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Customer stats
export const getCustomerStats = async (_req, res, _next) => {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, newThisMonth, joinedToday, totalOrders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: firstOfMonth } }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfToday } }),
      Order.countDocuments()
    ]);

    res.json({
      success: true,
      data: { total, newThisMonth, joinedToday, totalOrders }
    });
  } catch (error) {
    _next(error);
  }
};

// Admin: Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
