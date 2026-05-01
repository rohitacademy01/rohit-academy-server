import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* =====================================
   🔍 VALIDATION MIDDLEWARE (FINAL)
===================================== */
const validateAdminLogin = (req, res, next) => {
  try {

    let { email, password } = req.body;

    /* ❌ REQUIRED */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    /* ❌ TYPE CHECK */
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid input format"
      });
    }

    /* 🔹 NORMALIZE EMAIL ONLY */
    email = email.toLowerCase().trim();

    /* ❌ BASIC EMAIL CHECK */
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    /* ❌ PASSWORD LENGTH */
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    /* 🔥 MAX LENGTH SECURITY */
    if (email.length > 100 || password.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Input too long"
      });
    }

    /* 🔥 SAVE CLEAN DATA */
    req.body.email = email;
    req.body.password = password; // ❌ NO TRIM

    /* 🔥 LOG ATTEMPT */
    console.warn(`⚠️ Admin login attempt: ${email}`);

    next();

  } catch (error) {

    console.error("Admin validation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Validation failed"
    });
  }
};

/* =====================================
   🔐 ADMIN LOGIN ROUTE
===================================== */
router.post(
  "/login",
  authLimiter,
  validateAdminLogin,
  adminLogin
);

export default router;