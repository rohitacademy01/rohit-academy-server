import express from "express";
import {
  createCoupon,
  getCoupons,
  deleteCoupon,
  applyCoupon
} from "../controllers/couponController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =====================================
   🔍 VALIDATION
===================================== */
const validateCoupon = (req, res, next) => {
  const { code } = req.body;

  if (!code || typeof code !== "string" || code.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Valid coupon code required"
    });
  }

  next();
};

/* =====================================
   👤 USER ROUTES
===================================== */
router.post("/apply", protect, validateCoupon, applyCoupon);

/* =====================================
   🔐 ADMIN ROUTES
===================================== */
router.use(protect, adminOnly);

router.post("/", createCoupon);
router.get("/", getCoupons);
router.delete("/:id", deleteCoupon);

export default router;