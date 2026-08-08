import bcrypt from 'bcryptjs';
import User from '../../../Models/Management/Users/user.js';
import { signToken } from '../../../Utils/jwt.js';
import AppError from '../../../Utils/AppError.js';
import catchAsync from '../../../Utils/catchAsync.js';




// ============FUNCTIONS ============

// Send token response
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// ============ REGISTRATION ============

export const register = catchAsync(async (req, res, next) => {
  const { name, username, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    if (existingUser.email === email) {
      return next(new AppError('Email already registered', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('Username already taken', 400));
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone
  });

  sendToken(newUser, 201, res);
});



// ============ LOGIN ============

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide username and password', 400));
  }

  // Find user with password
  const user = await User.findOne({ username }).select('+password');
  if (!user) {
    return next(new AppError('Invalid username or password', 401));
  }

  // Check password
  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    return next(new AppError('Invalid username or password', 401));
  }

  // Check if user is active
  if (!user.isActive || user.isDeleted) {
    return next(new AppError('Your account is deactivated. Please contact support.', 403));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);
});


// ============ LOGOUT ============

export const logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ 
    status: 'success', 
    message: 'Logged out successfully' 
  });
};
