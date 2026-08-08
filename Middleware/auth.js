import { verifyToken } from '../Utils/jwt.js';
import User from '../Models/Management/Users/user.js';
import AppError from '../Utils/AppError.js';
import catchAsync from '../Utils/catchAsync.js';

export const protect = (req, res, next) => {
  next(); // SKIP EVERYTHING
};

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};