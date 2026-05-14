import mongoose from "mongoose";
import PDF from "../models/PDF.js";
import Batch from "../models/Batch.js";
import Subject from "../models/Subject.js";
import Order from "../models/Order.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import logger from "../utils/logger.js";

/* =====================================
   🔐 GENERATE SIGNED URL (1-hour expiry)
   Prevents direct Cloudinary URL access without auth
===================================== */
const getSignedUrl = (cloudinaryId, fallbackUrl) => {
  if (!cloudinaryId) return fallbackUrl || "";
  try {
    return cloudinary.url(cloudinaryId, {
      resource_type: "raw",
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      secure: true,
    });
  } catch (err) {
    logger.error(`❌ Signed URL generation failed: ${err.message}`);
    return fallbackUrl || "";
  }
};

/* =====================================
   ☁️ CLOUDINARY HELPERS
===================================== */
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const safeName = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "rohit-academy/pdfs",
        public_id: safeName,
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const deleteFromCloudinary = async (cloudinaryId) => {
  if (!cloudinaryId) return;
  try {
    await cloudinary.uploader.destroy(cloudinaryId, { resource_type: "raw" });
  } catch (err) {
    logger.error(`❌ Cloudinary delete: ${err.message}`);
  }
};

/* =====================================
   ➕ UPLOAD PDF  POST /api/admin/pdf/upload
===================================== */
export const uploadPDF = async (req, res) => {
  try {
    const { title, subjectId, batchId, category } = req.body;
    const pdfFile = req.file;

    if (!title || !subjectId || !batchId || !category) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!pdfFile) {
      return res.status(400).json({ success: false, message: "PDF file is required" });
    }
    if (pdfFile.mimetype !== "application/pdf") {
      return res.status(400).json({ success: false, message: "Only PDF files allowed" });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: "Invalid subject or batch ID" });
    }

    const [subject, batch] = await Promise.all([
      Subject.findById(subjectId).lean(),
      Batch.findById(batchId).lean(),
    ]);

    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

    const uploadResult = await uploadToCloudinary(pdfFile.buffer);

    const newPDF = await PDF.create({
      title: title.trim(),
      subjectId,
      batchId,
      category,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      fileSize: pdfFile.size,
    });

    await newPDF.populate([
      { path: "subjectId", select: "name" },
      { path: "batchId", select: "name" },
    ]);

    return res.status(201).json({ success: true, message: "PDF uploaded successfully", pdf: newPDF });
  } catch (err) {
    logger.error(`❌ uploadPDF: ${err.message}`);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

/* =====================================
   📄 GET PDFs BY SUBJECT  GET /api/pdf/:subjectId
===================================== */
export const getPDFsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { batchId, category, search, page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: "Invalid subject ID" });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Login required" });

    if (!batchId || !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, message: "Batch ID required" });
    }

    const order = await Order.findOne({ user: userId, batch: batchId, status: "paid" }).lean();
    if (!order) {
      return res.status(403).json({ success: false, message: "Purchase required to access study materials" });
    }

    const filter = { subjectId, batchId, isActive: true };
    if (category && category !== "all") filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [pdfs, total, recent] = await Promise.all([
      PDF.find(filter)
        .populate("subjectId", "name icon")
        .populate("batchId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PDF.countDocuments(filter),
      PDF.find({ subjectId, batchId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);

    return res.json({
      success: true,
      pdfs: pdfs.map((pdf) => ({
        ...pdf,
        fileUrl: getSignedUrl(pdf.cloudinaryId, pdf.fileUrl),
      })),
      recent: recent.map((r) => ({
        ...r,
        fileUrl: getSignedUrl(r.cloudinaryId, r.fileUrl),
      })),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    logger.error(`❌ getPDFsBySubject: ${err.message}`);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   📋 GET ALL PDFs (ADMIN)  GET /api/admin/pdf
===================================== */
export const getAllPDFs = async (req, res) => {
  try {
    const { batchId, subjectId, category, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) filter.batchId = batchId;
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) filter.subjectId = subjectId;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [pdfs, total] = await Promise.all([
      PDF.find(filter)
        .populate("subjectId", "name")
        .populate("batchId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      PDF.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      pdfs,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    logger.error(`❌ getAllPDFs: ${err.message}`);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   ✏️ UPDATE PDF  PUT /api/admin/pdf/:id
===================================== */
export const updatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;
    const pdfFile = req.file;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid PDF ID" });
    }

    const pdf = await PDF.findById(id);
    if (!pdf) return res.status(404).json({ success: false, message: "PDF not found" });

    if (title && title.trim()) pdf.title = title.trim();
    if (category) pdf.category = category;

    if (pdfFile) {
      if (pdfFile.mimetype !== "application/pdf") {
        return res.status(400).json({ success: false, message: "Only PDF files allowed" });
      }
      await deleteFromCloudinary(pdf.cloudinaryId);
      const uploadResult = await uploadToCloudinary(pdfFile.buffer);
      pdf.fileUrl = uploadResult.secure_url;
      pdf.cloudinaryId = uploadResult.public_id;
      pdf.fileSize = pdfFile.size;
    }

    await pdf.save();
    await pdf.populate([{ path: "subjectId", select: "name" }, { path: "batchId", select: "name" }]);

    return res.json({ success: true, message: "PDF updated successfully", pdf });
  } catch (err) {
    logger.error(`❌ updatePDF: ${err.message}`);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* =====================================
   ❌ DELETE PDF  DELETE /api/admin/pdf/:id
===================================== */
export const deletePDF = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid PDF ID" });
    }

    const pdf = await PDF.findById(id);
    if (!pdf) return res.status(404).json({ success: false, message: "PDF not found" });

    await deleteFromCloudinary(pdf.cloudinaryId);
    await pdf.deleteOne();

    return res.json({ success: true, message: "PDF deleted successfully" });
  } catch (err) {
    logger.error(`❌ deletePDF: ${err.message}`);
    return res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/* =====================================
   📺 STREAM PDF INLINE  GET /api/pdf/stream/:id
===================================== */
export const streamPDF = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    const pdf = await PDF.findById(id).lean();
    if (!pdf) return res.status(404).json({ success: false, message: "PDF not found" });

    const order = await Order.findOne({ user: userId, batch: pdf.batchId, status: "paid" }).lean();
    if (!order) return res.status(403).json({ success: false, message: "Purchase required" });

    const signedUrl = getSignedUrl(pdf.cloudinaryId, pdf.fileUrl);
    const axios = (await import("axios")).default;
    const response = await axios.get(signedUrl, { responseType: "stream" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=" + pdf.title + ".pdf");
    res.setHeader("Cache-Control", "private, max-age=3600");

    response.data.pipe(res);
  } catch (err) {
    logger.error(❌ streamPDF: ${err.message});
    return res.status(500).json({ success: false, message: "Stream failed" });
  }
};