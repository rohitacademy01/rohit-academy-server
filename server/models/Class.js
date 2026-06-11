import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
{
  /* CLASS NAME */
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  /* DISPLAY NAME (e.g. "Class 9", "BA", "Computer Science") */
  displayName: {
    type: String,
    trim: true,
    default: "",
  },

  /* TYPE */
  type: {
    type: String,
    enum: ["school", "college", "professional"],
    default: "school",
    index: true,
  },

  /* CLASS NUMBER (only for school type) */
  classNumber: {
    type: Number,
    default: null,
    sparse: true,
  },

  /* STREAM FLAG */
  hasStreams: {
    type: Boolean,
    default: false,
    index: true,
  },

  /* ORDER */
  order: {
    type: Number,
    default: 0,
    min: 0,
  },

  /* DESCRIPTION */
  description: {
    type: String,
    default: "",
    maxlength: 500,
  },

  /* ACTIVE FLAG */
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  /* LEVEL (kept for backward compat) */
  level: {
    type: String,
    enum: ["School", "College"],
    default: "School",
    index: true,
  },

},
{ timestamps: true }
);

/* AUTO LOGIC */
classSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }

  /* School auto logic */
  if (this.type === "school" && this.classNumber) {
    this.hasStreams = this.classNumber >= 11;
    if (!this.order) this.order = this.classNumber;
    this.level = "School";
    if (!this.displayName) this.displayName = "Class " + this.classNumber;
  }

  /* College/Professional */
  if (this.type === "college" || this.type === "professional") {
    this.level = "College";
    if (!this.displayName) this.displayName = this.name;
  }

  next();
});

/* INDEXES */
classSchema.index({ type: 1, isActive: 1 });
classSchema.index({ order: 1 });

/* STATIC: GET ALL ACTIVE */
classSchema.statics.getAllActive = function () {
  return this.find({ isActive: true })
    .select("_id name displayName classNumber hasStreams order type")
    .sort({ type: 1, order: 1, classNumber: 1 })
    .lean();
};

/* STATIC: CHECK STREAM REQUIRED */
classSchema.statics.requiresStream = async function (classId) {
  const cls = await this.findById(classId).select("hasStreams").lean();
  if (!cls) return false;
  return cls.hasStreams;
};

export default mongoose.model("Class", classSchema);
