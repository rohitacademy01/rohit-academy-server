import express from "express";
import {
  addMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
  getMaterialsByClassSubject // 🔥 NEW
} from "../controllers/materialController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { uploadPDF } from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* =====================================
   🌍 PUBLIC ROUTES
===================================== */

/* 🔥 FILTERED MATERIALS (MOST IMPORTANT) */
router.get("/:classId/:subjectId", getMaterialsByClassSubject);

/* 📄 Get all materials */
router.get("/", getMaterials);

/* 🔍 Get single material */
router.get("/:id", getMaterialById);


/* =====================================
   🔐 ADMIN ROUTES
===================================== */

router.use(protect, adminOnly);

/* ➕ CREATE */
router.post(
  "/",
  uploadPDF.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  addMaterial
);

/* ✏️ UPDATE */
router.put(
  "/:id",
  uploadPDF.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  updateMaterial
);

/* 🔁 TOGGLE ACTIVE */
router.patch("/:id/toggle", toggleMaterialStatus);

/* ❌ DELETE */
router.delete("/:id", deleteMaterial);

export default router;