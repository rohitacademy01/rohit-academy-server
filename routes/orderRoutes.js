import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* GET MY PURCHASES (materials) */
router.get("/my-materials", protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const orders = await Order.find({ user: userId, status: "paid" })
      .populate("materials")
      .populate("batch", "name price")
      .sort({ createdAt: -1 })
      .lean();
    const materials = orders.flatMap((o) => o.materials || []);
    res.json({ success: true, data: materials, orders });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* Legacy create/verify (redirect to payment routes) */
router.post("/create-order", protect, async (req, res) => {
  res.status(301).json({ success: false, message: "Use /api/payment/create-batch-order" });
});

export default router;
