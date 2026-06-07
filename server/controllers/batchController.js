import Batch from "../models/Batch.js";
import Class from "../models/Class.js";
import Stream from "../models/Stream.js";
import Subject from "../models/Subject.js";
import Material from "../models/Material.js";
import Order from "../models/Order.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/* =====================================
   ☁️ UPLOAD THUMBNAIL
===================================== */
const uploadThumbnail = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "batches/thumbnails" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/* =====================================
   ➕ CREATE BATCH (ADMIN)
===================================== */
export const createBatch = async (req, res) => {
  try {
    const {
      name,
      description,
      classId,
      streamId,
      subjects,
      price,
      originalPrice,
      isFeatured,
      order,
    } = req.body;

    if (!name || !classId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, class and price are required",
      });
    }

    /* 🔍 VALIDATE CLASS */
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    /* 🔍 VALIDATE STREAM */
    if (cls.hasStreams && !streamId) {
      return res.status(400).json({
        success: false,
        message: "Stream required for this class",
      });
    }

    let thumbnailUrl = "";
    let thumbnailId = "";

    /* 🖼 UPLOAD THUMBNAIL */
    if (req.file) {
      const result = await uploadThumbnail(req.file.buffer);
      thumbnailUrl = result.secure_url;
      thumbnailId = result.public_id;
    }

    const batch = await Batch.create({
      name: name.trim(),
      description: description || "",
      classId,
      streamId: streamId || null,
      subjects: Array.isArray(subjects) ? subjects : subjects ? [subjects] : [],
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      isFeatured: isFeatured === "true" || isFeatured === true,
      order: Number(order) || 0,
      thumbnail: thumbnailUrl,
      thumbnailId,
    });

    await batch.populate([
      { path: "classId", select: "name classNumber" },
      { path: "streamId", select: "name" },
      { path: "subjects", select: "name" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      batch,
    });
  } catch (error) {
    console.error("💥 CREATE BATCH ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Batch name already exists" });
    }
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

/* =====================================
   📋 GET ALL BATCHES (PUBLIC)
===================================== */
export const getBatches = async (req, res) => {
  try {
    const { classId, streamId, featured, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };

    if (classId) filter.classId = classId;
    if (streamId) filter.streamId = streamId;
    if (featured === "true") filter.isFeatured = true;

    const skip = (Number(page) - 1) * Number(limit);

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate("classId", "name classNumber hasStreams")
        .populate("streamId", "name")
        .populate("subjects", "name icon")
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Batch.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      batches,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("💥 GET BATCHES ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   🔍 GET SINGLE BATCH
===================================== */
export const getBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findOne({
      $or: [{ _id: id }, { slug: id }],
      isActive: true,
    })
      .populate("classId", "name classNumber hasStreams")
      .populate("streamId", "name")
      .populate("subjects", "name icon description")
      .lean();

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    /* 📊 TOTAL MATERIALS IN BATCH */
    const totalMaterials = await Material.countDocuments({
      classId: batch.classId._id,
      ...(batch.streamId ? { streamId: batch.streamId._id } : {}),
      subjectId: { $in: batch.subjects.map((s) => s._id) },
      isActive: true,
    });

    return res.json({
      success: true,
      batch: { ...batch, totalMaterials },
    });
  } catch (error) {
    console.error("💥 GET BATCH ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   ✏️ UPDATE BATCH (ADMIN)
===================================== */
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    /* 🖼 UPLOAD NEW THUMBNAIL */
    if (req.file) {
      /* Delete old */
      if (batch.thumbnailId) {
        await cloudinary.uploader.destroy(batch.thumbnailId).catch(() => {});
      }
      const result = await uploadThumbnail(req.file.buffer);
      updates.thumbnail = result.secure_url;
      updates.thumbnailId = result.public_id;
    }

    /* 🔹 CLEAN UPDATES */
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice);
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === "true" || updates.isFeatured === true;
    }
    if (updates.subjects && !Array.isArray(updates.subjects)) {
      updates.subjects = [updates.subjects];
    }

    Object.assign(batch, updates);
    await batch.save();

    await batch.populate([
      { path: "classId", select: "name classNumber" },
      { path: "streamId", select: "name" },
      { path: "subjects", select: "name" },
    ]);

    return res.json({
      success: true,
      message: "Batch updated",
      batch,
    });
  } catch (error) {
    console.error("💥 UPDATE BATCH ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   🗑️ DELETE BATCH (ADMIN)
===================================== */
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    /* 🖼 DELETE THUMBNAIL */
    if (batch.thumbnailId) {
      await cloudinary.uploader.destroy(batch.thumbnailId).catch(() => {});
    }

    await batch.deleteOne();

    return res.json({ success: true, message: "Batch deleted" });
  } catch (error) {
    console.error("💥 DELETE BATCH ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   📚 GET BATCH MATERIALS (PROTECTED)
===================================== */
export const getBatchMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const batch = await Batch.findById(id).lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    /* 🔐 CHECK PURCHASE */
    if (userId) {
      const purchased = await Order.findOne({
        user: userId,
        batch: id,
        status: "paid",
      });

      if (!purchased) {
        return res.status(403).json({
          success: false,
          message: "Purchase required to access materials",
        });
      }
    } else {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const materials = await Material.find({
      classId: batch.classId,
      ...(batch.streamId ? { streamId: batch.streamId } : {}),
      subjectId: { $in: batch.subjects },
      isActive: true,
    })
      .populate("subjectId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, materials });
  } catch (error) {
    console.error("💥 GET BATCH MATERIALS ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   🎯 GET MY PURCHASED BATCHES
===================================== */
export const getMyBatches = async (req, res) => {
  try {
    const userId = req.user?.id;

    const orders = await Order.find({
      user: userId,
      status: "paid",
      batch: { $ne: null },
    })
      .populate({
        path: "batch",
        populate: [
          { path: "classId", select: "name classNumber" },
          { path: "streamId", select: "name" },
          { path: "subjects", select: "name icon" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const batches = orders
      .filter((o) => o.batch)
      .map((o) => ({
        ...o.batch,
        purchasedAt: o.paidAt || o.createdAt,
        orderId: o._id,
      }));

    return res.json({ success: true, batches });
  } catch (error) {
    console.error("💥 GET MY BATCHES ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================
   🔍 CHECK IF BATCH PURCHASED
===================================== */
export const checkBatchAccess = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { batchId } = req.params;

    const order = await Order.findOne({
      user: userId,
      batch: batchId,
      status: "paid",
    });

    return res.json({ success: true, hasAccess: !!order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
