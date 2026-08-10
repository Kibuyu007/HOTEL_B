import rateLimit from 'express-rate-limit';

// General rate limiter - 100 requests per 15 minutes
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again later.'
});

// Stricter limiter for auth routes - 5 attempts per hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts. Try again in an hour.'
});