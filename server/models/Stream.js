import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
    /* 📘 STREAM NAME */
    name: {
      type: String,
      required: true,
      trim: true
    },

    /* 🏫 CLASS REFERENCE */
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true
    },

    /* 🔢 ORDER (UI SORTING) */
    order: {
      type: Number,
      default: 0
    },

    /* 🔄 ACTIVE */
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
   🔥 UNIQUE COMBINATION
===================================== */
streamSchema.index(
  { name: 1, classId: 1 },
  { unique: true }
);

/* =====================================
   🔥 CLEAN DATA (IMPORTANT)
===================================== */
streamSchema.pre("save", async function () {
  if (this.name) {
    this.name = this.name.trim().toUpperCase();
  }
});


/* =====================================
   🔥 SAFE RESPONSE
===================================== */
streamSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model("Stream", streamSchema);