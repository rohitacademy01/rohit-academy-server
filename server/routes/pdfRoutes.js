import express from "express";
import { getPDFsBySubject, generatePDFToken, viewPDF } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Token generate — requires login */
router.post("/token/:id", protect, generatePDFToken);

/* View PDF inline — token in query param (no protect middleware) */
router.get("/view/:id", viewPDF);

/* Get PDFs by subject — requires login */
router.get("/:subjectId", protect, getPDFsBySubject);

export default router;
