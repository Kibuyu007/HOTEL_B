import express from 'express';
import { 
  registerValidation, 
  loginValidation
} from '../../../validations/authValidation.js';
import { validate } from '../../../Middleware/validate.js';
import { authLimiter } from '../../../Middleware/rateLimiter.js';
import { protect } from '../../../Middleware/auth.js';
import * as auth from '../../../Controllers/Management/Users/auth.js';
import * as users from '../../../Controllers/Management/Users/users.js';

const router = express.Router();

// ============ PUBLIC AUTH ROUTES ============
router.post('/register', authLimiter, validate(registerValidation), auth.register);
router.post('/login', authLimiter, validate(loginValidation), auth.login);
router.post('/logout', auth.logout);

// ============ PROTECTED USER MANAGEMENT ROUTES ============
// All routes below require authentication
router.use(protect);

// User management routes
router.get('/users', users.getAllUsers);
router.get('/users/:id', users.getUser);
router.patch('/users/:id', users.updateUser);
router.get('/users/stats', users.getUserStats);

export default router;