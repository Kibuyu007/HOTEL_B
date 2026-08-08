import { verifyToken } from '../Utils/jwt.js';
import User from '../Models/Management/Users/user.js';
import AppError from '../Utils/AppError.js';
import catchAsync from '../Utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from header or cookie
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in.', 401));
  }

  // 2) Verify token
  const decoded = verifyToken(token);

  // 3) Check if user exists
  const currentUser = await User.findById(decoded.id).select('+isDeleted');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4) Check if user is active/deleted
  if (!currentUser.isActive || currentUser.isDeleted) {
    return next(new AppError('Your account is deactivated. Please contact support.', 403));
  }

  // 5) Check if password changed after token was issued
  if (currentUser.passwordChangedAt) {
    const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedTimestamp) {
      return next(new AppError('Password recently changed. Please log in again.', 401));
    }
  }

  // Grant access
  req.user = currentUser;
  next();
});

// Restrict to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};