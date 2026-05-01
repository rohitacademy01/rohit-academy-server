import Class from "../models/Class.js";
import Stream from "../models/Stream.js";
import logger from "../utils/logger.js";

/* =====================================
   🔧 HELPER: EXTRACT CLASS NUMBER
===================================== */
const extractClassNumber = (name) => {

  if (!name) return null;

  const sanitized = name.replace(/[^\d]/g, "");
  const num = Number(sanitized);

  if (!num || num < 1 || num > 12) return null;

  return num;
};

/* =====================================
   ➕ ADD CLASS
===================================== */
export const addClass = async (req, res) => {
  try {

    let { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name required"
      });
    }

    name = name.trim().toLowerCase();

    /* 🔢 EXTRACT NUMBER */
    const classNumber = extractClassNumber(name);

    if (!classNumber) {
      return res.status(400).json({
        success: false,
        message: "Class must be between 1 and 12"
      });
    }

    /* ❌ DUPLICATE CHECK */
    const existing = await Class.findOne({
      $or: [
        { name },
        { classNumber }
      ],
      isActive: true
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Class already exists"
      });
    }

    const hasStreams = classNumber >= 11;

    const newClass = await Class.create({
      name: String(classNumber),
      classNumber,
      hasStreams,
      order: classNumber
    });

    logger.info(`Class created: ${classNumber}`);

    res.status(201).json({
      success: true,
      data: newClass
    });

  } catch (error) {

    logger.error(`Add class error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


/* =====================================
   📄 GET CLASSES
===================================== */
export const getClasses = async (req, res) => {
  try {

    const classes = await Class.find({ isActive: true })
      .select("_id name classNumber hasStreams order")
      .sort({ classNumber: 1 });

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {

    logger.error(`Get classes error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


/* =====================================
   🔥 GET STREAM CLASSES (11 & 12 ONLY)
===================================== */
export const getStreamClasses = async (req, res) => {
  try {

    const classes = await Class.find({
      hasStreams: true,
      isActive: true
    })
      .select("_id name classNumber")
      .sort({ classNumber: 1 });

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {

    logger.error(`Get stream classes error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Failed to fetch stream classes"
    });

  }
};


/* =====================================
   🔍 GET CLASS BY ID
===================================== */
export const getClassById = async (req, res) => {
  try {

    const classDoc = await Class.findById(req.params.id)
      .select("_id name classNumber hasStreams order isActive");

    if (!classDoc || !classDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.json({
      success: true,
      data: classDoc
    });

  } catch (error) {

    logger.error(`Get class error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


/* =====================================
   ✏ UPDATE CLASS
===================================== */
export const updateClass = async (req, res) => {
  try {

    let { name, order, isActive } = req.body;

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    /* 🔥 UPDATE NAME */
    if (name) {

      const newName = name.trim().toLowerCase();

      const classNumber = extractClassNumber(newName);

      if (!classNumber) {
        return res.status(400).json({
          success: false,
          message: "Class must be between 1 and 12"
        });
      }

      const exists = await Class.findOne({
        $or: [
          { name: String(classNumber) },
          { classNumber }
        ],
        isActive: true
      });

      if (exists && exists._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "Class already exists"
        });
      }

      classDoc.name = String(classNumber);
      classDoc.classNumber = classNumber;
      classDoc.hasStreams = classNumber >= 11;
    }

    /* 🔢 ORDER VALIDATION */
    if (order !== undefined) {

      order = Number(order);

      if (isNaN(order) || order < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid order"
        });
      }

      classDoc.order = order;
    }

    if (isActive !== undefined) {
      classDoc.isActive = isActive;
    }

    await classDoc.save();

    logger.info(`Class updated: ${classDoc.classNumber}`);

    res.json({
      success: true,
      data: classDoc
    });

  } catch (error) {

    logger.error(`Update class error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


/* =====================================
   ❌ DELETE CLASS (SAFE SOFT DELETE)
===================================== */
export const deleteClass = async (req, res) => {
  try {

    const classDoc = await Class.findById(req.params.id);

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    /* 🔒 CHECK STREAM DEPENDENCY */
    const streamExists = await Stream.findOne({
      classId: classDoc._id,
      isActive: true
    });

    if (streamExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete class with streams"
      });
    }

    classDoc.isActive = false;

    await classDoc.save();

    logger.warn(`Class deactivated: ${classDoc.classNumber}`);

    res.json({
      success: true,
      message: "Class deactivated"
    });

  } catch (error) {

    logger.error(`Delete class error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};