import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import admin from "../config/firebaseAdmin.js";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPurchaseConfirmationEmail } from "../services/emailService.js";

const safeUser = (user) => ({
  _id: user._id,
  phone: user.phone,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  role: user.role || "user",
  authProvider: user.authProvider,
});

/* =====================================
   🔥 FIREBASE / GOOGLE LOGIN
===================================== */
export const firebaseLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Firebase token required" });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid Firebase token" });
    }

    const firebaseId = decoded.uid;
    const email = decoded.email ? decoded.email.toLowerCase().trim() : null;
    let phone = null;
    if (decoded.phone_number) {
      const cleaned = decoded.phone_number.replace(/\D/g, "");
      phone = cleaned.length >= 10 ? cleaned.slice(-10) : null;
    }
    const avatar = decoded.picture || "";
    const displayName = decoded.name || "";

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "No email or phone in token" });
    }

    let user = await User.findOne({
      $or: [
        { firebaseId },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (user) {
      if (!user.firebaseId) user.firebaseId = firebaseId;
      if (avatar && !user.avatar) user.avatar = avatar;
      if (displayName && !user.name) user.name = displayName;
      user.lastLogin = new Date();
      user.authProvider = "firebase";
      user.isVerified = true;
      await user.save();
    } else {
      const newData = {
        firebaseId,
        avatar,
        authProvider: "firebase",
        role: "user",
        isVerified: true,
        name: displayName || "user_" + Math.random().toString(36).substring(2, 8),
        lastLogin: new Date(),
      };
      if (email) newData.email = email;
      if (phone) newData.phone = phone;

      try {
        user = await User.create(newData);
      } catch (err) {
        if (err.code === 11000) {
          user = await User.findOne({
            $or: [
              { firebaseId },
              ...(email ? [{ email }] : []),
              ...(phone ? [{ phone }] : []),
            ],
          });
        } else throw err;
      }
    }

    if (!user) return res.status(500).json({ success: false, message: "User creation failed" });
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Account blocked" });

    const jwtToken = generateToken({ id: user._id.toString(), role: user.role || "user" });

    return res.json({ success: true, token: jwtToken, user: safeUser(user) });
  } catch (error) {
    logger.error("FIREBASE LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   📝 REGISTER (Email + Password)
===================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    if (phone) {
      const cleaned = phone.replace(/\D/g, "").slice(-10);
      const existingPhone = await User.findOne({ phone: cleaned });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: "Phone already registered" });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.replace(/\D/g, "").slice(-10) : undefined,
      authProvider: "email",
      isVerified: true,
      role: "user",
    });

    const jwtToken = generateToken({ id: user._id.toString(), role: "user" });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: jwtToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email or phone already exists" });
    }
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

/* =====================================
   🔐 EMAIL LOGIN
===================================== */
export const emailLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      authProvider: { $in: ["email", "firebase"] },
    }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account blocked. Contact support." });
    }

    if (typeof user.isLocked === "function" && user.isLocked()) {
      return res.status(403).json({ success: false, message: "Too many attempts. Try again in 15 minutes." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (user.incrementLoginAttempts) await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.updateLoginTime) await user.updateLoginTime();

    const jwtToken = generateToken({ id: user._id.toString(), role: user.role || "user" });

    return res.json({ success: true, token: jwtToken, user: safeUser(user) });
  } catch (error) {
    console.error("EMAIL LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* =====================================
   🔑 FORGOT PASSWORD
===================================== */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    /* Always return success to prevent email enumeration */
    if (!user) {
      return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "https://rohitacademy.net"}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailErr) {
      /* Rollback token if email fails */
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      logger.error(`Password reset email failed for ${email}: ${emailErr.message}`);
      return res.status(500).json({ success: false, message: "Email could not be sent. Please try again." });
    }

    return res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   🔑 RESET PASSWORD
===================================== */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.authProvider = "email";
    await user.save();

    const jwtToken = generateToken({ id: user._id.toString(), role: user.role || "user" });

    return res.json({
      success: true,
      message: "Password reset successful",
      token: jwtToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
};

/* =====================================
   👤 GET CURRENT USER
===================================== */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id)
      .select("_id name email phone avatar role authProvider")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   ✏️ UPDATE PROFILE
===================================== */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name.trim();
    if (phone) {
      const cleaned = phone.replace(/\D/g, "").slice(-10);
      if (cleaned.length === 10) {
        const existing = await User.findOne({ phone: cleaned, _id: { $ne: userId } });
        if (existing) return res.status(400).json({ success: false, message: "Phone already in use" });
        user.phone = cleaned;
      }
    }

    await user.save();
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* =====================================
   🔐 ADMIN LOGIN
===================================== */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const adminUser = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
    }).select("+password");

    if (!adminUser) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (adminUser.isBlocked) {
      return res.status(403).json({ success: false, message: "Account blocked" });
    }

    const isMatch = await adminUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    await adminUser.updateLoginTime();

    const token = generateToken({ id: adminUser._id.toString(), role: "admin" });

    return res.json({
      success: true,
      token,
      user: safeUser(adminUser),
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* =====================================
   🆕 SET NAME/USERNAME
===================================== */
export const setUsername = async (req, res) => {
  try {
    let { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name required" });

    name = name.trim();
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.name = name;
    await user.save();
    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
