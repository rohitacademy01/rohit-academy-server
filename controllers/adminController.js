mport mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Material from "../models/Material.js";
import Order from "../models/Order.js";
import Batch from "../models/Batch.js";

import logger from "../utils/logger.js";

/* =====================================
   🔐 ADMIN LOGIN
===================================== */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email & password required" });
    }

    // find admin user
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });

  } catch (error) {
    logger.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

/* =====================================
   📊 ADMIN STATS
===================================== */
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers, totalMaterials, totalOrders, totalBatches,
      revenueResult, totalDownloads, recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Material.countDocuments({ isActive: true }),
      Order.countDocuments({ status: "paid" }),
      Batch.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Material.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }]),
      Order.find({ status: "paid" })
        .populate("user", "name email phone")
        .populate("batch", "name price")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const totalDownloadsCount = totalDownloads[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalMaterials,
        totalOrders,
        totalBatches,
        totalRevenue,
        totalDownloads: totalDownloadsCount,
        recentOrders,
      },
    });
  } catch (error) {
    logger.error("Stats error:", error);
    res.status(500).json({ success: false, message: "Failed to load stats" });
  }
};

/* =====================================
   👥 USERS
===================================== */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.pagination || {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: "user" })
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "user" }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page, pages: Math.ceil(total / limit) }
    });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================
   🚫 BLOCK USER
===================================== */
export const toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================
   ❌ DELETE USER
===================================== */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false });

    await User.findByIdAndUpdate(id, { isBlocked: true });

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================
   📄 MATERIALS
===================================== */
export const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate("classId subjectId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: materials });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================
   📦 ORDERS
===================================== */
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user batch materials")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });

  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================
   🗑️ DELETE MATERIAL
===================================== */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false });

    await Material.findByIdAndUpdate(id, { isActive: false });

    res.json({ success: true });

  } catch {
    res.status(500).json({ success: false });
  }
};