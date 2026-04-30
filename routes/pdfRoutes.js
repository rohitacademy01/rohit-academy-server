import express from "express";
import { getPDFsBySubject } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* GET /api/pdf/:subjectId?batchId=xxx */
router.get("/:subjectId", protect, getPDFsBySubject);

export default router;
