import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
{
  /* 🔢 CLASS NUMBER (PRIMARY IDENTIFIER) */
  classNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 12
  },

  /* 📘 CLASS NAME (DISPLAY) */
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^\d+$/, // only numeric names like "9", "10"
  },

  /* 🎓 LEVEL */
  level: {
    type: String,
    enum: ["School", "College"],
    default: "School",
    index: true
  },

  /* 🔥 STREAM FLAG */
  hasStreams: {
    type: Boolean,
    default: false,
    index: true
  },

  /* 🔢 ORDER (AUTO SORT) */
  order: {
    type: Number,
    default: function () {
      return this.classNumber;
    },
    min: 0
  },

  /* 📝 DESCRIPTION */
  description: {
    type: String,
    default: "",
    maxlength: 500
  },

  /* 🔥 ACTIVE FLAG */
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }

},
{ timestamps: true }
);

/* =====================================
   🔥 AUTO LOGIC
===================================== */

classSchema.pre("save", async function () {

  /* 🔹 CLEAN NAME */
  if (this.name) {
    this.name = this.name.trim().toLowerCase();
  }

  /* 🔥 AUTO STREAM ENABLE */
  this.hasStreams = this.classNumber >= 11;

  /* 🔥 AUTO ORDER */
  if (!this.order) {
    this.order = this.classNumber;
  }

  
});


/* =====================================
   🔥 INDEXES
===================================== */

classSchema.index({ level: 1, order: 1 });
classSchema.index({ classNumber: 1, isActive: 1 });


/* =====================================
   🔥 STATIC METHODS
===================================== */

/* 📄 GET ACTIVE CLASSES */

classSchema.statics.getAllActive = function () {

  return this.find({ isActive: true })
    .select("_id name classNumber hasStreams order")
    .sort({ order: 1, classNumber: 1 })
    .lean();
};


/* 📄 CHECK STREAM REQUIRED */

classSchema.statics.requiresStream = async function (classId) {

  const cls = await this.findById(classId)
    .select("classNumber")
    .lean();

  if (!cls) return false;

  return cls.classNumber >= 11;
};


export default mongoose.model("Class", classSchema);