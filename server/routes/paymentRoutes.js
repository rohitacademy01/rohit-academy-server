import express from "express";
import {
  createBatchOrder,
  verifyBatchPayment,
  createOrder,
  verifyPayment,
  razorpayWebhook,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Webhook - raw body */
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

/* Batch payments */
router.post("/create-batch-order", protect, createBatchOrder);
router.post("/verify-batch-payment", protect, verifyBatchPayment);

/* Material payments (legacy) */
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);

export default router;
