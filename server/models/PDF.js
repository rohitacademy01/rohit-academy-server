import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["notes", "sample", "pyq", "assignment"],
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

pdfSchema.index({ subjectId: 1, category: 1, isActive: 1 });
pdfSchema.index({ batchId: 1, subjectId: 1 });
pdfSchema.index({ createdAt: -1 });
pdfSchema.index({ title: "text" });

export default mongoose.model("PDF", pdfSchema);
