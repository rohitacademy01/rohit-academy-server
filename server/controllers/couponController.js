import Coupon from "../models/Coupon.js";
import logger from "../utils/logger.js";

/* =====================================
   ➕ CREATE COUPON
===================================== */
export const createCoupon = async (req, res) => {
  try {
    let { code, discountPercent, expiryDate } = req.body;

    if (!code || !discountPercent || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    code = code.trim().toUpperCase();
    discountPercent = Number(discountPercent);

    /* 🔥 VALIDATION */
    if (discountPercent < 1 || discountPercent > 80) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 1-80%"
      });
    }

    const expiry = new Date(expiryDate);

    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiry date"
      });
    }

    const exists = await Coupon.findOne({ code });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists"
      });
    }

    const coupon = await Coupon.create({
      code,
      discountPercent,
      expiryDate: expiry
    });

    logger.info(`Coupon created: ${code}`);

    res.status(201).json({
      success: true,
      data: coupon
    });

  } catch (error) {
    logger.error(`Create coupon error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

/* =====================================
   📃 GET COUPONS
===================================== */
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: coupons
    });

  } catch (error) {
    logger.error(`Get coupons error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

/* =====================================
   ❌ DELETE COUPON
===================================== */
export const deleteCoupon = async (req, res) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    logger.warn(`Coupon deleted: ${deleted.code}`);

    res.json({
      success: true,
      message: "Coupon deleted"
    });

  } catch (error) {
    logger.error(`Delete coupon error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

/* =====================================
   🎟 APPLY COUPON
===================================== */
export const applyCoupon = async (req, res) => {
  try {
    let { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: "Invalid data"
      });
    }

    code = code.trim().toUpperCase();
    cartTotal = Number(cartTotal);

    if (cartTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart total"
      });
    }

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon"
      });
    }

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon expired"
      });
    }

    /* 💰 CALCULATE */
    const discountAmount = Math.round(
      (cartTotal * coupon.discountPercent) / 100
    );

    const finalAmount = Math.max(cartTotal - discountAmount, 1);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        discountAmount,
        finalAmount
      }
    });

  } catch (error) {
    logger.error(`Apply coupon error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};