import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    /* 📘 SUBJECT NAME */
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50
    },

    /* 🏫 CLASS */
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    /* 🌿 STREAM (NEW - RELATION BASED) */
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true
    },

    /* ⚠️ FALLBACK (OLD SUPPORT - OPTIONAL) */
    stream: {
      type: String,
      enum: ["PCB", "PCM", "Arts", "General"],
      default: "General"
    },

    /* 📝 DESCRIPTION */
    description: {
      type: String,
      default: "",
      maxlength: 500
    },

    /* 🎨 ICON */
    icon: {
      type: String,
      default: ""
    },

    /* 🔢 ORDER */
    order: {
      type: Number,
      default: 0,
      min: 0
    },

    /* 🔥 ACTIVE FLAG */
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/* =====================================
   🔥 UNIQUE INDEX (SMART)
===================================== */
subjectSchema.index(
  { name: 1, classId: 1, streamId: 1 },
  { unique: true }
);

/* =====================================
   🔥 QUERY OPTIMIZATION
===================================== */
subjectSchema.index({ classId: 1, streamId: 1, order: 1 });

/* =====================================
   🔥 PRE-SAVE CLEAN + VALIDATION
===================================== */
subjectSchema.pre("save", function (next) {

  /* 🔹 NAME CLEAN */
  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }

  /* 🔥 STREAM VALIDATION (IMPORTANT) */
  if (!this.streamId && this.stream !== "General") {
    throw new Error("Stream ID required for this subject");

  
});

/* =====================================
   🔥 STATIC METHODS (BONUS 🔥)
===================================== */

/* 📄 GET SUBJECTS BY CLASS + STREAM */
subjectSchema.statics.getByClassAndStream = function (classId, streamId) {
  return this.find({
    classId,
    ...(streamId ? { streamId } : {}),
    isActive: true
  })
    .sort({ order: 1 })
    .lean();
};

export default mongoose.model("Subject", subjectSchema);