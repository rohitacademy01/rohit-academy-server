import express from "express";
import {
  createBatch,
  getBatches,
  getBatch,
  updateBatch,
  deleteBatch,
  getBatchMaterials,
  getMyBatches,
  checkBatchAccess,
} from "../controllers/batchController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/* =====================================
   🌍 PUBLIC ROUTES
===================================== */
router.get("/", getBatches);
router.get("/:id", getBatch);

/* =====================================
   🔐 USER PROTECTED ROUTES
===================================== */
router.get("/user/my-batches", protect, getMyBatches);
router.get("/:batchId/access", protect, checkBatchAccess);
router.get("/:id/materials", protect, getBatchMaterials);

/* =====================================
   🔐 ADMIN ROUTES
===================================== */
router.post("/", protect, adminOnly, upload.single("thumbnail"), createBatch);
router.put("/:id", protect, adminOnly, upload.single("thumbnail"), updateBatch);
router.delete("/:id", protect, adminOnly, deleteBatch);

export default router;
