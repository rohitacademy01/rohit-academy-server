import express from "express";
import {
  addClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getStreamClasses // ✅ NEW
} from "../controllers/classController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =====================================
   🌍 PUBLIC ROUTES
===================================== */

/* 🔥 MUST BE BEFORE :id */
router.get("/streams", getStreamClasses);

/* 📄 ALL CLASSES */
router.get("/", getClasses);

/* 🔍 SINGLE CLASS */
router.get("/:id", getClassById);

/* =====================================
   🔐 ADMIN ROUTES
===================================== */
router.use(protect, adminOnly);

/* ➕ CREATE */
router.post("/", addClass);

/* ✏ UPDATE */
router.put("/:id", updateClass);

/* ❌ DELETE */
router.delete("/:id", deleteClass);

export default router;