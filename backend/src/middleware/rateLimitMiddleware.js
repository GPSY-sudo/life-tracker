import rateLimit from 'express-rate-limit';

// Strict rate limit for registration endpoint (5 requests per 15 minutes)
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many registration attempts, please try again after 15 minutes',
  statusCode: 429,            // HTTP 429 Too Many Requests
  standardHeaders: false,     // Don't send RateLimit-* headers (keep response clean)
  skip: (req, res) => res.headersSent
});

// Strict rate limit for login endpoint (5 requests per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts, please try again after 15 minutes',
  statusCode: 429,            // HTTP 429 Too Many Requests
  standardHeaders: false,
  skip: (req, res) => res.headersSent
});

// Moderate rate limit for password change (5 requests per hour)
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 requests per window
  message: 'Too many password change attempts, please try again after 1 hour',
  statusCode: 429,            // HTTP 429 Too Many Requests
  standardHeaders: false,
  skip: (req, res) => res.headersSent
});
