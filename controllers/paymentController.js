import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Batch from "../models/Batch.js";
import Material from "../models/Material.js";
import User from "../models/User.js";
import { sendPurchaseConfirmationEmail } from "../services/emailService.js";

/* =====================================
   🔹 RAZORPAY INSTANCE
===================================== */
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/* =====================================
   🧾 CREATE BATCH ORDER
===================================== */
export const createBatchOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { batchId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!batchId) return res.status(400).json({ success: false, message: "Batch ID required" });

    const batch = await Batch.findOne({ _id: batchId, isActive: true });
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

    /* ❌ DUPLICATE CHECK */
    const existing = await Order.findOne({ user: userId, batch: batchId, status: "paid" });
    if (existing) return res.status(400).json({ success: false, message: "Already purchased this batch" });

    const amount = batch.price;
    if (amount <= 0) return res.status(400).json({ success: false, message: "Invalid batch price" });

    const razorpay = getRazorpay();
    const receipt = `rcpt_${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      notes: { batchId: batchId.toString(), userId: userId.toString() },
    });

    const order = await Order.create({
      user: userId,
      batch: batchId,
      classId: batch.classId,
      streamId: batch.streamId || null,
      amount,
      razorpay_order_id: razorpayOrder.id,
      receipt,
      status: "pending",
    });

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
      batchName: batch.name,
    });
  } catch (error) {
    console.error("💥 CREATE BATCH ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Order creation failed" });
  }
};

/* =====================================
   🔐 VERIFY BATCH PAYMENT
===================================== */
export const verifyBatchPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment data missing" });
    }

    /* 🔐 VERIFY SIGNATURE */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    /* 🔍 FIND ORDER */
    const order = await Order.findOne({ razorpay_order_id, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status === "paid") {
      return res.json({ success: true, message: "Already verified", order });
    }

    order.razorpay_payment_id = razorpay_payment_id;
    order.status = "paid";
    order.paidAt = new Date();
    await order.save();

    /* 📊 INCREMENT BATCH PURCHASE COUNT */
    if (order.batch) {
      await Batch.findByIdAndUpdate(order.batch, { $inc: { totalPurchases: 1 } });
    }

    /* 📧 SEND PURCHASE CONFIRMATION EMAIL (non-blocking) */
    try {
      const [userDoc, batchDoc] = await Promise.all([
        User.findById(userId).select("email name").lean(),
        Batch.findById(order.batch).select("name price").lean(),
      ]);
      if (userDoc?.email) {
        sendPurchaseConfirmationEmail(userDoc.email, userDoc.name, batchDoc?.name, batchDoc?.price).catch(() => {});
      }
    } catch (_) {}

    return res.json({ success: true, message: "Payment verified successfully", order });
  } catch (error) {
    console.error("💥 VERIFY PAYMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

/* =====================================
   🧾 CREATE MATERIAL ORDER (Legacy)
===================================== */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { materials } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!Array.isArray(materials) || !materials.length) {
      return res.status(400).json({ success: false, message: "Materials required" });
    }

    const materialDocs = await Material.find({ _id: { $in: materials }, isActive: true });
    if (materialDocs.length !== materials.length) {
      return res.status(400).json({ success: false, message: "Invalid materials" });
    }

    const existing = await Order.findOne({ user: userId, materials: { $in: materials }, status: "paid" });
    if (existing) return res.status(400).json({ success: false, message: "Already purchased" });

    const totalAmount = materialDocs.reduce((sum, m) => sum + m.price, 0);
    if (totalAmount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const order = await Order.create({
      user: userId,
      materials,
      amount: totalAmount,
      razorpay_order_id: razorpayOrder.id,
      status: "pending",
    });

    return res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      dbOrderId: order._id,
    });
  } catch (error) {
    console.error("💥 CREATE ORDER ERROR:", error);
    return res.status(500).json({ success: false, message: "Order creation failed" });
  }
};

/* =====================================
   🔐 VERIFY MATERIAL PAYMENT (Legacy)
===================================== */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment data missing" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await Order.findOne({ razorpay_order_id, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status === "paid") return res.json({ success: true, message: "Already verified", order });

    order.razorpay_payment_id = razorpay_payment_id;
    order.status = "paid";
    order.paidAt = new Date();
    await order.save();

    return res.json({ success: true, message: "Payment verified", order });
  } catch (error) {
    console.error("💥 VERIFY PAYMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

/* =====================================
   🔔 RAZORPAY WEBHOOK
===================================== */
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    /* 🔐 WEBHOOK SECRET IS MANDATORY */
    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET not set — webhook ignored");
      return res.status(200).json({ success: true }); // Always 200 to Razorpay
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      console.warn("⚠️ Webhook: missing signature header");
      return res.status(200).json({ success: true });
    }

    const body = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠️ Webhook signature mismatch");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(body.toString());

    if (event.event === "payment.captured") {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;

      const order = await Order.findOne({ razorpay_order_id: orderId });
      if (order && order.status !== "paid") {
        order.razorpay_payment_id = paymentId;
        order.status = "paid";
        order.paidAt = new Date();
        await order.save();

        if (order.batch) {
          await Batch.findByIdAndUpdate(order.batch, { $inc: { totalPurchases: 1 } });
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("💥 WEBHOOK ERROR:", error);
    return res.status(200).json({ success: true });
  }
};
