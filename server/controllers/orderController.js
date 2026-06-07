import Order from "../models/Order.js";
import Material from "../models/Material.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

/* =====================================
   🧾 CREATE ORDER
===================================== */
export const createOrder = async (req, res) => {
  try {

    /* 🔐 AUTH CHECK (FINAL FIX) */
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = req.user._id;
    const { materials } = req.body;

    if (!materials?.length) {
      return res.status(400).json({
        success: false,
        message: "Materials required"
      });
    }

    /* 📦 FETCH MATERIALS */
    const materialDocs = await Material.find({
      _id: { $in: materials },
      isActive: true
    });

    if (materialDocs.length !== materials.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid materials"
      });
    }

    /* ❌ DUPLICATE CHECK */
    const existing = await Order.findOne({
      user: userId,
      materials: { $in: materials },
      status: "paid"
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already purchased"
      });
    }

    /* 💰 CALCULATE TOTAL */
    const totalAmount = materialDocs.reduce(
      (sum, m) => sum + m.price,
      0
    );

    /* =====================================
       💳 RAZORPAY MODE
    ===================================== */
    if (razorpay) {

      const order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
      });

      return res.json({
        success: true,
        razorpay: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    }

    /* =====================================
       🧪 FALLBACK MODE
    ===================================== */
    return res.json({
      success: true,
      razorpay: false,
      fakeOrder: true,
      amount: totalAmount
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =====================================
   ✅ VERIFY PAYMENT
===================================== */
export const verifyPayment = async (req, res) => {
  try {

    /* 🔐 AUTH CHECK */
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = req.user._id;

    const {
      materials,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    /* 📦 FETCH MATERIALS */
    const materialDocs = await Material.find({
      _id: { $in: materials },
      isActive: true
    });

    if (!materialDocs.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid materials"
      });
    }

    const totalAmount = materialDocs.reduce(
      (sum, m) => sum + m.price,
      0
    );

    /* ❌ DUPLICATE CHECK */
    const existing = await Order.findOne({
      user: userId,
      materials: { $in: materials },
      status: "paid"
    });

    if (existing) {
      return res.json({
        success: true,
        orderId: existing._id
      });
    }

    /* =====================================
       🔐 VERIFY SIGNATURE
    ===================================== */
    if (razorpay && razorpay_signature) {

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature"
        });
      }
    }

    /* =====================================
       ✅ CREATE ORDER
    ===================================== */
    const newOrder = await Order.create({
      user: userId,
      materials,
      amount: totalAmount,
      status: "paid",
      paidAt: new Date(),
      paymentId: razorpay_payment_id || "manual"
    });

    res.json({
      success: true,
      message: "Payment verified",
      orderId: newOrder._id
    });

  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =====================================
   📥 GET MY PURCHASES
===================================== */
export const getMyPurchases = async (req, res) => {
  try {

    /* 🔐 AUTH CHECK */
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = req.user._id;

    const orders = await Order.find({
      user: userId,
      status: "paid"
    }).populate("materials");

    const materials = orders.flatMap(order => order.materials);

    res.json({
      success: true,
      data: materials
    });

  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases"
    });
  }
};