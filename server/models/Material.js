import mongoose from "mongoose";
import slugify from "slugify";

const materialSchema = new mongoose.Schema(
  {
    /* 📘 TITLE */
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 150,
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

    /* 🌿 STREAM (NEW 🔥) */
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true,
    },

    /* 📚 SUBJECT */
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    /* 📂 TYPE */
    type: {
      type: String,
      enum: ["Notes", "Sample Paper", "PYQ", "Assignment"],
      required: true,
      index: true,
    },

    /* 📄 PAGES */
    pages: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* 💰 PRICE */
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 5000,
      index: true,
    },

    /* 🎁 FREE FLAG */
    isFree: {
      type: Boolean,
      default: false,
      index: true,
    },

    /* 📎 FILE */
    fileUrl: {
      type: String,
      required: true,
    },

    cloudinaryId: {
      type: String,
      default: "",
      index: true,
    },

    /* 🖼 THUMBNAIL */
    thumbnail: {
      type: String,
      default: "",
    },

    /* 🖼 PREVIEW */
    previewImages: {
      type: [String],
      default: [],
    },

    /* 🔥 STATUS */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* 📥 DOWNLOADS */
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ⭐ RATING */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (v) => Math.round(v * 10) / 10,
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

/* =====================================
   🔥 SLUG AUTO GENERATE
===================================== */
materialSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
    });
  }

  /* 🔥 STREAM VALIDATION (IMPORTANT) */
  if (!this.streamId && this.classId) {
    // optional: tu controller me enforce karega
    console.warn("⚠️ StreamId missing for material");
  }

  next();
});

/* =====================================
   🔥 COMPOUND FILTER INDEX
===================================== */
materialSchema.index({
  classId: 1,
  streamId: 1,   // 🔥 NEW
  subjectId: 1,
  type: 1,
  isActive: 1,
});

/* =====================================
   🔎 TEXT SEARCH
===================================== */
materialSchema.index({
  title: "text",
  description: "text",
});

/* =====================================
   ⚡ SORT OPTIMIZATION
===================================== */
materialSchema.index({ createdAt: -1 });
materialSchema.index({ price: 1 });
materialSchema.index({ rating: -1 });

/* =====================================
   🔥 STATIC METHODS (PRO 🔥)
===================================== */

/* 📄 FILTER MATERIALS */
materialSchema.statics.getFiltered = function ({
  classId,
  streamId,
  subjectId,
  type,
}) {
  const filter = {
    isActive: true,
  };

  if (classId) filter.classId = classId;
  if (streamId) filter.streamId = streamId;
  if (subjectId) filter.subjectId = subjectId;
  if (type) filter.type = type;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .lean();
};

export default mongoose.model("Material", materialSchema);