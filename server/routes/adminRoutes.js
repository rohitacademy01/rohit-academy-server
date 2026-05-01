import express from "express";
import mongoose from "mongoose";
import {
  getAdminStats, getAllUsers, deleteUser, getAllOrders, getAllMaterials, toggleUserBlock, deleteMaterial
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { adminLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

const validateId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  next();
};

const validatePagination = (req, res, next) => {
  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || 20;
  if (page < 1) page = 1;
  if (limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  req.pagination = { page, limit };
  next();
};

router.use(protect, adminOnly, adminLimiter);

router.get("/stats", getAdminStats);
router.get("/users", validatePagination, getAllUsers);
router.delete("/users/:id", validateId, deleteUser);
router.patch("/users/:id/toggle-block", validateId, toggleUserBlock);
router.get("/orders", validatePagination, getAllOrders);
router.get("/materials", validatePagination, getAllMaterials);
router.delete("/materials/:id", validateId, deleteMaterial);

export default router;
