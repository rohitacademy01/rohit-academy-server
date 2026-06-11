import Class from "../models/Class.js";
import Stream from "../models/Stream.js";
import logger from "../utils/logger.js";

/* =====================================
   ADD CLASS  POST /api/classes
===================================== */
export const addClass = async (req, res) => {
  try {
    let { name, type, hasStreams, order, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Class name required" });
    }

    type = type || "school";
    name = name.trim().toLowerCase();

    let classNumber = null;
    let displayName = "";
    let autoHasStreams = hasStreams === true || hasStreams === "true";
    let autoOrder = Number(order) || 0;

    /* SCHOOL TYPE VALIDATION */
    if (type === "school") {
      const num = Number(name.replace(/[^\d]/g, ""));
      if (!num || num < 1 || num > 12) {
        return res.status(400).json({ success: false, message: "School class must be between 1 and 12" });
      }
      classNumber = num;
      name = String(num);
      displayName = "Class " + num;
      autoHasStreams = num >= 11;
      autoOrder = num;
    } else {
      /* COLLEGE / PROFESSIONAL */
      displayName = name.toUpperCase() === name ? name : name.charAt(0).toUpperCase() + name.slice(1);
      if (!autoOrder) autoOrder = 100;
    }

    /* DUPLICATE CHECK */
    const existing = await Class.findOne({ name, isActive: true });
    if (existing) {
      return res.status(400).json({ success: false, message: "Class/Course already exists" });
    }

    const newClass = await Class.create({
      name,
      displayName,
      type,
      classNumber,
      hasStreams: autoHasStreams,
      order: autoOrder,
      description: description || "",
    });

    logger.info("Class created: " + newClass.displayName);

    return res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    logger.error("Add class error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   GET CLASSES  GET /api/classes
===================================== */
export const getClasses = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const classes = await Class.find(filter)
      .select("_id name displayName classNumber hasStreams order type")
      .sort({ type: 1, order: 1, classNumber: 1 });

    return res.json({ success: true, data: classes });
  } catch (error) {
    logger.error("Get classes error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   GET STREAM CLASSES  GET /api/classes/streams
===================================== */
export const getStreamClasses = async (req, res) => {
  try {
    const classes = await Class.find({ hasStreams: true, isActive: true })
      .select("_id name displayName classNumber type")
      .sort({ type: 1, order: 1, classNumber: 1 });

    return res.json({ success: true, data: classes });
  } catch (error) {
    logger.error("Get stream classes error: " + error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch stream classes" });
  }
};

/* =====================================
   GET CLASS BY ID  GET /api/classes/:id
===================================== */
export const getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .select("_id name displayName classNumber hasStreams order isActive type");

    if (!classDoc || !classDoc.isActive) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    return res.json({ success: true, data: classDoc });
  } catch (error) {
    logger.error("Get class error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   UPDATE CLASS  PUT /api/classes/:id
===================================== */
export const updateClass = async (req, res) => {
  try {
    let { name, order, isActive, hasStreams, description } = req.body;

    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (name) {
      const newName = name.trim().toLowerCase();

      if (classDoc.type === "school") {
        const num = Number(newName.replace(/[^\d]/g, ""));
        if (!num || num < 1 || num > 12) {
          return res.status(400).json({ success: false, message: "School class must be between 1 and 12" });
        }
        classDoc.name = String(num);
        classDoc.classNumber = num;
        classDoc.displayName = "Class " + num;
        classDoc.hasStreams = num >= 11;
        classDoc.order = num;
      } else {
        const exists = await Class.findOne({ name: newName, isActive: true });
        if (exists && exists._id.toString() !== req.params.id) {
          return res.status(400).json({ success: false, message: "Name already exists" });
        }
        classDoc.name = newName;
        classDoc.displayName = newName.charAt(0).toUpperCase() + newName.slice(1);
      }
    }

    if (order !== undefined) classDoc.order = Number(order) || 0;
    if (isActive !== undefined) classDoc.isActive = isActive;
    if (description !== undefined) classDoc.description = description;

    /* Manual hasStreams for non-school */
    if (classDoc.type !== "school" && hasStreams !== undefined) {
      classDoc.hasStreams = hasStreams === true || hasStreams === "true";
    }

    await classDoc.save();
    logger.info("Class updated: " + classDoc.displayName);

    return res.json({ success: true, data: classDoc });
  } catch (error) {
    logger.error("Update class error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* =====================================
   DELETE CLASS  DELETE /api/classes/:id
===================================== */
export const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const streamExists = await Stream.findOne({ classId: classDoc._id, isActive: true });
    if (streamExists) {
      return res.status(400).json({ success: false, message: "Cannot delete class with active streams" });
    }

    classDoc.isActive = false;
    await classDoc.save();

    logger.warn("Class deactivated: " + classDoc.displayName);
    return res.json({ success: true, message: "Class deactivated" });
  } catch (error) {
    logger.error("Delete class error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
