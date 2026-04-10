import User from '../models/User.js';
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

    // Generate JWT token
    const { data: { session }, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    res.status(201).json({
      success: true,
      data: {
        user: mongoUser,
        session: {
          access_token: user.id, // Using Supabase user ID as token for simplicity
          user
        }
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
export const logout = async (req, res, next) => {
  try {
    // Clear session on client side
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
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
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      User.find({ role: 'user' })
        .select('-__v')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments({ role: 'user' })
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    next(error);
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
