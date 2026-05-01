import mongoose from "mongoose";
import Stream from "../models/Stream.js";
import Class from "../models/Class.js";
import logger from "../utils/logger.js";

/* =====================================
   ➕ CREATE STREAM
===================================== */
export const createStream = async (req, res) => {
  try {

    logger.info("🔥 CREATE STREAM API HIT");
    logger.info("BODY:", JSON.stringify(req.body));

    let { name, classId, order } = req.body;

    /* ❌ VALIDATION */
    if (!name || !classId) {
      logger.warn("❌ Missing name or classId");
      return res.status(400).json({
        success: false,
        message: "Name & classId required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      logger.warn("❌ Invalid classId:", classId);
      return res.status(400).json({
        success: false,
        message: "Invalid classId"
      });
    }

    /* ✅ FIX: uppercase normalization */
    name = name.trim().toUpperCase();
    logger.info("Normalized name:", name);

    if (name.length < 2 || name.length > 20) {
      logger.warn("❌ Invalid name length:", name);
      return res.status(400).json({
        success: false,
        message: "Invalid stream name"
      });
    }

    order = Number(order) || 0;
    if (order < 0) order = 0;
    logger.info("Final order:", order);

    /* 🔍 CHECK CLASS */
    logger.info("🔍 Fetching class:", classId);

    const cls = await Class.findById(classId);

    logger.info("Class result:", cls);

    if (!cls) {
      logger.error("❌ Class not found");
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    /* 🔥 STREAM ONLY FOR 11+ */
    const classNumber = Number(cls.name);
    logger.info("Parsed classNumber:", classNumber);

    if (classNumber < 11) {
      logger.warn("❌ Class < 11 restriction hit");
      return res.status(400).json({
        success: false,
        message: "Streams only allowed for class 11 and 12"
      });
    }

    /* ✅ FIX: duplicate check */
    logger.info("🔍 Checking duplicate stream");

    const exists = await Stream.findOne({
      name,
      classId
    });

    logger.info("Duplicate result:", exists);

    if (exists) {
      logger.warn("❌ Stream already exists");
      return res.status(400).json({
        success: false,
        message: "Stream already exists for this class"
      });
    }

    logger.info("🆕 Creating stream...");

    const stream = await Stream.create({
      name,
      classId,
      order
    });

    logger.info("✅ Stream created:", stream);

    res.status(201).json({
      success: true,
      data: stream
    });

  } catch (error) {

    logger.error("🔥 CREATE STREAM ERROR FULL:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create stream",
      error: error.message
    });

  }
};


/* =====================================
   📄 GET ALL STREAMS
===================================== */
export const getAllStreams = async (req, res) => {
  try {

    logger.info("📄 GET ALL STREAMS");

    const streams = await Stream.find({ isActive: true })
      .populate("classId", "name classNumber")
      .sort({ order: 1, createdAt: 1 });

    logger.info(`Fetched streams count: ${streams.length}`);

    res.json({
      success: true,
      data: streams
    });

  } catch (error) {

    logger.error("🔥 GET ALL STREAMS ERROR:", error);
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch streams"
    });

  }
};


/* =====================================
   📄 GET STREAMS BY CLASS
===================================== */
export const getStreamsByClass = async (req, res) => {
  try {

    const { classId } = req.params;

    logger.info("📄 GET STREAMS BY CLASS:", classId);

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      logger.warn("❌ Invalid classId");
      return res.status(400).json({
        success: false,
        message: "Invalid classId"
      });
    }

    const streams = await Stream.find({
      classId,
      isActive: true
    })
      .populate("classId", "name classNumber")
      .sort({ order: 1, createdAt: 1 });

    logger.info(`Streams found: ${streams.length}`);

    res.json({
      success: true,
      data: streams
    });

  } catch (error) {

    logger.error("🔥 GET STREAM ERROR:", error);
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch streams"
    });

  }
};


/* =====================================
   ✏ UPDATE STREAM
===================================== */
export const updateStream = async (req, res) => {
  try {

    const { id } = req.params;
    let { name, order, isActive } = req.body;

    logger.info("✏ UPDATE STREAM:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn("❌ Invalid stream ID");
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID"
      });
    }

    const stream = await Stream.findById(id);

    logger.info("Stream found:", stream);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    if (name) {
      name = name.trim().toUpperCase();
      logger.info("Updated name:", name);

      const exists = await Stream.findOne({
        name,
        classId: stream.classId,
        _id: { $ne: id }
      });

      if (exists) {
        logger.warn("❌ Duplicate stream update attempt");
        return res.status(400).json({
          success: false,
          message: "Stream already exists"
        });
      }

      stream.name = name;
    }

    if (order !== undefined) {
      order = Number(order) || 0;
      if (order < 0) order = 0;
      stream.order = order;
    }

    if (isActive !== undefined) {
      stream.isActive = isActive;
    }

    await stream.save();

    logger.info("✅ Stream updated:", stream);

    res.json({
      success: true,
      data: stream
    });

  } catch (error) {

    logger.error("🔥 UPDATE STREAM ERROR:", error);
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update stream"
    });

  }
};


/* =====================================
   ❌ DELETE STREAM
===================================== */
export const deleteStream = async (req, res) => {
  try {

    const { id } = req.params;

    logger.info("❌ DELETE STREAM:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID"
      });
    }

    const stream = await Stream.findById(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found"
      });
    }

    stream.isActive = false;

    await stream.save();

    logger.warn(`Stream deactivated: ${stream.name}`);

    res.json({
      success: true,
      message: "Stream deleted"
    });

  } catch (error) {

    logger.error("🔥 DELETE STREAM ERROR:", error);
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete stream"
    });

  }
};