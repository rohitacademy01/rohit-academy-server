import express from "express";
import { getPDFsBySubject, streamPDF } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stream/:id", protect, streamPDF);
router.get("/:subjectId", protect, getPDFsBySubject);

export default router;