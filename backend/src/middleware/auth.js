import { supabaseAdmin } from '../config/supabase.js';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

// Verify Supabase JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue as guest
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Find or create user in MongoDB
    let mongoUser = await User.findOne({ supabaseId: user.id });
    
    if (!mongoUser) {
      // Create new user from Supabase data
      mongoUser = await User.create({
        supabaseId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'user'
      });
    }

    req.user = mongoUser;
    req.supabaseUser = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    // Token verification failed, but continue as guest
    next();
  }
};

// Require authentication
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to continue'
    });
  }
  next();
};

// Require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to continue'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
