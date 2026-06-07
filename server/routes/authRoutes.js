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

const router = express.Router();

router.post("/firebase-login", firebaseLogin);
router.post("/register", register);
router.post("/login", emailLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/set-username", protect, setUsername);

export default router;
