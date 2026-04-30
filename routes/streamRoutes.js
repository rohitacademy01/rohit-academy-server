import express from "express";
import {
  createStream,
  getStreamsByClass,
  updateStream,
  deleteStream,
  getAllStreams // 🔥 NEW
} from "../controllers/streamController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =====================================
   🌍 PUBLIC ROUTES
===================================== */

/* 🔥 GET ALL STREAMS (NEW) */
router.get("/", getAllStreams);

/* 📄 GET STREAMS BY CLASS */
router.get("/class/:classId", getStreamsByClass);


/* =====================================
   🔐 ADMIN ROUTES
===================================== */

/* 🔒 Apply middleware once */
router.use(protect, adminOnly);

/* ➕ CREATE STREAM */
router.post("/", createStream);

/* ✏ UPDATE STREAM */
router.put("/:id", updateStream);

/* ❌ DELETE STREAM */
router.delete("/:id", deleteStream);

export default router;