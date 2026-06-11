import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
      default: null,
      index: true
    },
    stream: {
      type: String,
      enum: ["PCB", "PCM", "Arts", "General"],
      default: "General"
    },
    description: {
      type: String,
      default: "",
      maxlength: 500
    },
    icon: {
      type: String,
      default: ""
    },
    order: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

/* INDEXES */
subjectSchema.index({ name: 1, classId: 1, streamId: 1 }, { unique: true });
subjectSchema.index({ classId: 1, streamId: 1, order: 1 });

/* PRE-SAVE - Mongoose 9 compatible (no next param, use throw) */
subjectSchema.pre("save", function () {
  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }
  if (!this.streamId && this.stream !== "General") {
    throw new Error("Stream ID required for this subject");
  }
});

/* STATIC */
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
