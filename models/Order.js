import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    /* 👤 USER */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* 📦 BATCH (Primary purchase unit) */
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true
    },

    /* 📦 MATERIALS (Individual purchase - legacy) */
    materials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Material"
      }
    ],

    /* 🏫 CLASS (for quick access check) */
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true
    },

    /* 🌿 STREAM (for quick access check) */
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true
    },

    /* 💰 AMOUNT */
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    /* 💱 CURRENCY */
    currency: {
      type: String,
      default: "INR"
    },

    /* 🧾 RAZORPAY */
    razorpay_order_id: {
      type: String,
      required: true,
      index: true
    },

    razorpay_payment_id: {
      type: String,
      unique: true,
      sparse: true
    },

    /* 📊 STATUS */
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true
    },

    /* 🕒 PAYMENT TIME */
    paidAt: {
      type: Date
    },

    /* 🔐 PAYMENT META */
    paymentMethod: {
      type: String,
      default: "razorpay"
    },

    receipt: {
      type: String
    },

    failureReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

/* =====================================
   🔥 INDEXES (PERFORMANCE BOOST)
===================================== */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ user: 1, batch: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

/* =====================================
   🔥 PRE SAVE SAFETY
===================================== */
orderSchema.pre("save", function () {
  if (this.status === "paid" && !this.paidAt) {
    this.paidAt = new Date();
  }
});

/* =====================================
   🔥 METHODS
===================================== */
orderSchema.methods.markFailed = function (reason = "") {
  this.status = "failed";
  this.failureReason = reason;
  return this.save();
};

orderSchema.methods.markPaid = function (paymentId) {
  this.status = "paid";
  this.razorpay_payment_id = paymentId;
  this.paidAt = new Date();
  return this.save();
};

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model("Order", orderSchema);
