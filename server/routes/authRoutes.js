import express from "express";
import {
  firebaseLogin,
  register,
  emailLogin,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  setUsername,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

/* Public — rate limited */
router.post("/firebase-login", authLimiter, firebaseLogin);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, emailLogin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

/* Protected */
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/set-username", protect, setUsername);

export default router;
