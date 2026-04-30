import Razorpay from "razorpay";

/* =====================================
   🔐 INIT RAZORPAY (SAFE)
===================================== */

let razorpay = null;

if (
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("✅ Razorpay initialized");
} else {
  console.warn("⚠️ Razorpay keys missing (disabled)");
}

export default razorpay;