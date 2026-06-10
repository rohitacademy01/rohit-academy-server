import express from "express";
import { getPDFsBySubject, generatePDFToken, viewPDF } from "../controllers/pdfController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/token/:id", protect, generatePDFToken);
router.get("/view/:id", viewPDF);
router.get("/:subjectId", protect, getPDFsBySubject);

export default router;