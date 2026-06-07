import rateLimit from "express-rate-limit";

/* =====================================
   🔐 AUTH LIMITER (LOGIN / FIREBASE)
===================================== */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // per minute
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return (
      req.body?.email ||
      req.ip ||
      "anonymous"
    );
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again after 1 minute."
    });
  }
});

/* =====================================
   🔥 ADMIN LIMITER (VERY IMPORTANT)
===================================== */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 50, // max requests
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return req.ip || "admin";
  },

  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many admin requests. Please slow down."
    });
  }
});

/* =====================================
   🌍 GLOBAL API LIMITER (OPTIONAL)
===================================== */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return req.ip || "global";
  }
});