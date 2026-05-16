import { supabaseAdmin } from '../config/supabase.js';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseAdmin) {
      return next();
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

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
        role: 'user',
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

// Require authentication (Alias for protect)
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to continue',
    });
  }
  next();
};

export const protect = requireAuth;

// Require specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to continue',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Require admin role (Legacy/Specific)
export const requireAdmin = (req, res, next) => {
  console.log(`🔒 Admin Access Check: User=${req.user?.email}, Role=${req.user?.role}`);
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Admin access required. Current role: ${req.user?.role || 'none'}`,
    });
  }
  next();
};
