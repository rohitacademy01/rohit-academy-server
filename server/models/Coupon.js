import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,   // 🔥 FIX
      trim: true,
      minlength: 3,
      maxlength: 20,
      index: true
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 1,    // 🔥 FIX
      max: 100
    },

    expiryDate: {
      type: Date,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    usageLimit: {
      type: Number,
      default: 100,
      min: 1
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },

    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    minAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

/* =====================================
   🔥 INDEXES
===================================== */
couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });

/* =====================================
   🔥 PRE-SAVE CLEAN
===================================== */
couponSchema.pre("save", function (next) {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
  next();
});

export default mongoose.model("Coupon", couponSchema);