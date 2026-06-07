import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { uploadPDF, getAllPDFs, updatePDF, deletePDF } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { adminLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF files allowed"), false);
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ success: false, message: "Invalid ID" });
  next();
};

router.use(protect, adminOnly, adminLimiter);

router.post("/upload", upload.single("file"), uploadPDF);
router.get("/", getAllPDFs);
router.put("/:id", validateId, upload.single("file"), updatePDF);
router.delete("/:id", validateId, deletePDF);

export default router;
