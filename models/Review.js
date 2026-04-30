import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer"
      }
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    isApproved: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

/* =====================================
   🔥 ONE USER = ONE REVIEW
===================================== */
reviewSchema.index(
  { user: 1, material: 1 },
  { unique: true }
);

/* =====================================
   ⚡ FAST QUERY INDEX
===================================== */
reviewSchema.index({ material: 1, isApproved: 1 });

/* =====================================
   🔥 AUTO CLEAN COMMENT
===================================== */
reviewSchema.pre("save", function (next) {
  if (this.comment) {
    this.comment = this.comment.trim();
  }
  next();
});

export default mongoose.model("Review", reviewSchema);