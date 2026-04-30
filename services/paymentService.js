import Razorpay from "razorpay";
import crypto from "crypto";

/* =====================================
   🔐 ENV VALIDATION (SAFE)
===================================== */
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay ENV missing");
}

/* =====================================
   🔹 INSTANCE
===================================== */
export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/* =====================================
   🧾 CREATE ORDER
===================================== */
export const createRazorpayOrder = async (amount) => {
  try {

    console.log("💰 Creating Razorpay order for:", amount);

    /* ❌ VALIDATION */
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // 🔥 convert to paise safely
      currency: "INR",
      receipt: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay order created:", order.id);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };

  } catch (error) {

    console.error("❌ Razorpay Order Error:", error);

    throw new Error("Failed to create Razorpay order");
  }
};

/* =====================================
   ✅ VERIFY PAYMENT
===================================== */
export const verifyRazorpayPayment = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  try {

    console.log("🔐 Verifying payment...");

    /* ❌ VALIDATION */
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      console.warn("⚠️ Missing payment fields");
      return false;
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    /* ⚠️ IMPORTANT: length check before timingSafeEqual */
    if (expectedSign.length !== razorpay_signature.length) {
      console.warn("⚠️ Signature length mismatch");
      return false;
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSign),
      Buffer.from(razorpay_signature)
    );

    console.log("✅ Payment verification:", isValid);

    return isValid;

  } catch (error) {

    console.error("❌ Razorpay Verify Error:", error);

    return false;
  }
};

/* =====================================
   🔔 OPTIONAL WEBHOOK VERIFY (ADVANCED)
===================================== */
export const verifyWebhookSignature = (body, signature) => {
  try {

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected.length !== signature.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );

  } catch (error) {
    console.error("❌ Webhook Verify Error:", error);
    return false;
  }
};