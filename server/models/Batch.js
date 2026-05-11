import mongoose from "mongoose";
import slugify from "slugify";

const batchSchema = new mongoose.Schema(
  {
    /* 📘 BATCH NAME */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
      index: true,
    },

    /* 🔗 SLUG */
    slug: {
      type: String,
      unique: true,
      index: true,
    },

    /* 📝 DESCRIPTION */
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    /* 🏫 CLASS */
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    /* 🌿 STREAM (Optional - only for 11/12) */
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true,
    },

    /* 📚 SUBJECTS INCLUDED */
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    /* 💰 PRICE */
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 50000,
      index: true,
    },

    /* 🎁 ORIGINAL PRICE (for discount display) */
    originalPrice: {
      type: Number,
      default: 0,
    },

    /* 🖼 THUMBNAIL */
    thumbnail: {
      type: String,
      default: "",
    },

    thumbnailId: {
      type: String,
      default: "",
    },

    /* 🔥 FEATURED */
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* 🔥 ACTIVE */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* 📊 STATS */
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* 🔢 ORDER */
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =====================================
   🔥 SLUG AUTO GENERATE
===================================== */
batchSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    }) + "-" + Date.now();
  }
});

/* =====================================
   🔥 INDEXES
===================================== */
batchSchema.index({ classId: 1, streamId: 1, isActive: 1 });
batchSchema.index({ isFeatured: 1, isActive: 1 });
batchSchema.index({ price: 1 });
batchSchema.index({ createdAt: -1 });
batchSchema.index({ name: "text", description: "text" });

/* =====================================
   🔥 VIRTUAL - discount %
===================================== */
batchSchema.virtual("discountPercent").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

export default mongoose.model("Batch", batchSchema);
