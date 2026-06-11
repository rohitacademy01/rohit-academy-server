import mongoose from "mongoose";
import slugify from "slugify";

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 50000,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    thumbnailId: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* SLUG AUTO GENERATE - Mongoose 9 compatible (no next param) */
batchSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    }) + "-" + Date.now();
  }
});

/* INDEXES */
batchSchema.index({ classId: 1, streamId: 1, isActive: 1 });
batchSchema.index({ isFeatured: 1, isActive: 1 });
batchSchema.index({ price: 1 });
batchSchema.index({ createdAt: -1 });
batchSchema.index({ name: "text", description: "text" });

/* VIRTUAL */
batchSchema.virtual("discountPercent").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

export default mongoose.model("Batch", batchSchema);
