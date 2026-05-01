import mongoose from "mongoose";
import User from "../models/User.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import Material from "../models/Material.js";
import Order from "../models/Order.js";
import Batch from "../models/Batch.js";
import logger from "../utils/logger.js";

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
   👥 GET ALL USERS
===================================== */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.pagination || {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: "user" })
        .select("-password -loginAttempts -lockUntil -resetPasswordToken -resetPasswordExpire")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "user" }),
    ]);

    res.json({ success: true, data: users, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   🔁 TOGGLE BLOCK USER
===================================== */
export const toggleUserBlock = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    if (req.user?._id?.toString() === id || req.user?.id?.toString() === id) {
      return res.status(400).json({ success: false, message: "Cannot modify yourself" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? "blocked" : "unblocked"}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   ❌ DELETE USER
===================================== */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    await User.findByIdAndUpdate(id, { isBlocked: true });
    res.json({ success: true, message: "User deactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   📄 GET ALL MATERIALS
===================================== */
export const getAllMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.pagination || {};
    const skip = (page - 1) * limit;
    const [materials, total] = await Promise.all([
      Material.find()
        .populate("classId", "name")
        .populate("streamId", "name")
        .populate("subjectId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Material.countDocuments(),
    ]);
    res.json({ success: true, data: materials, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch materials" });
  }
};

/* =====================================
   📦 GET ALL ORDERS
===================================== */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.pagination || {};
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find()
        .populate("user", "name phone email")
        .populate("batch", "name price")
        .populate("materials", "title price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);
    res.json({ success: true, data: orders, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* =====================================
   🗑️ DELETE MATERIAL (Admin)
===================================== */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    await Material.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: "Material deactivated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
