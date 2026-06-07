import express from "express";
import {
  addSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByClassStream
} from "../controllers/subjectController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ========================================
   📄 PUBLIC ROUTES
======================================== */

/* 🔥 FILTER (QUERY BASED - OLD) */
router.get("/", getSubjects);

/* 🔥 NEW ROUTES (VERY IMPORTANT ORDER) */
router.get("/:classId/:streamId", getSubjectsByClassStream);
router.get("/:classId", getSubjectsByClassStream);

/* ❗ ALWAYS LAST */
router.get("/:id", getSubjectById);


/* ========================================
   🔐 ADMIN ROUTES
======================================== */

router.use(protect, adminOnly);

/* ➕ CREATE */
router.post("/", addSubject);

/* ✏ UPDATE */
router.put("/:id", updateSubject);

/* ❌ DELETE */
router.delete("/:id", deleteSubject);

export default router;