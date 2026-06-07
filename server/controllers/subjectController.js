import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";

/* =====================================
   🧠 COMMON FILTER BUILDER
===================================== */
const buildFilter = ({ classId, streamId }) => {
  const filter = { isActive: true };

  if (classId) filter.classId = classId;
  if (streamId) filter.streamId = streamId;

  return filter;
};

/* =====================================
   ➕ ADD SUBJECT
===================================== */
export const addSubject = async (req, res) => {
  try {

    let { name, classId, streamId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({
        success: false,
        message: "Name and Class required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId"
      });
    }

    name = name.trim().toLowerCase();

    const cls = await Class.findById(classId);

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    /* 🔥 STREAM VALIDATION */
    if (cls.hasStreams && !streamId) {
      return res.status(400).json({
        success: false,
        message: "Stream is required for this class"
      });
    }

    if (!cls.hasStreams) {
      streamId = null;
    }

    /* ❌ DUPLICATE CHECK */
    const exists = await Subject.findOne({
      name,
      classId,
      streamId: streamId || null
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists"
      });
    }

    const subject = await Subject.create({
      name,
      classId,
      streamId
    });

    res.status(201).json({
      success: true,
      data: subject
    });

  } catch (error) {

    console.error("Add subject error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add subject"
    });
  }
};

/* =====================================
   📄 GET SUBJECTS (QUERY BASED)
===================================== */
export const getSubjects = async (req, res) => {
  try {

    const { classId, streamId } = req.query;

    const filter = buildFilter({ classId, streamId });

    const subjects = await Subject.find(filter)
      .populate("classId", "name classNumber")
      .populate("streamId", "name")
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {

    console.error("Fetch subjects error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects"
    });
  }
};

/* =====================================
   📄 GET SUBJECTS BY CLASS + STREAM
===================================== */
export const getSubjectsByClassStream = async (req, res) => {
  try {

    const { classId, streamId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId"
      });
    }

    const filter = buildFilter({ classId, streamId });

    const subjects = await Subject.find(filter)
      .populate("classId", "name")
      .populate("streamId", "name")
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {

    console.error("Fetch subjects error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects"
    });
  }
};

/* =====================================
   🔍 GET SUBJECT BY ID
===================================== */
export const getSubjectById = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const subject = await Subject.findById(req.params.id)
      .populate("classId", "name classNumber")
      .populate("streamId", "name");

    if (!subject || !subject.isActive) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    res.json({
      success: true,
      data: subject
    });

  } catch (error) {

    console.error("Get subject error:", error.message);

    res.status(500).json({
      success: false,
      message: "Error fetching subject"
    });
  }
};

/* =====================================
   ✏ UPDATE SUBJECT
===================================== */
export const updateSubject = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const cls = await Class.findById(subject.classId);

    if (!cls) {
      return res.status(400).json({
        success: false,
        message: "Invalid class"
      });
    }

    const {
      name,
      streamId,
      description,
      icon,
      order,
      isActive
    } = req.body;

    /* 🔥 STREAM VALIDATION */
    if (cls.hasStreams && !streamId) {
      return res.status(400).json({
        success: false,
        message: "Stream required"
      });
    }

    const updatedName = name
      ? name.trim().toLowerCase()
      : subject.name;

    /* ❌ DUPLICATE CHECK */
    const exists = await Subject.findOne({
      _id: { $ne: id },
      name: updatedName,
      classId: subject.classId,
      streamId: cls.hasStreams ? streamId : null
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Duplicate subject"
      });
    }

    /* 🔥 UPDATE */
    subject.name = updatedName;
    subject.streamId = cls.hasStreams ? streamId : null;

    if (description !== undefined) subject.description = description;
    if (icon !== undefined) subject.icon = icon;
    if (order !== undefined) subject.order = order;
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();

    res.json({
      success: true,
      data: subject
    });

  } catch (error) {

    console.error("Update subject error:", error.message);

    res.status(500).json({
      success: false,
      message: "Update failed"
    });
  }
};

/* =====================================
   ❌ DELETE SUBJECT (SOFT)
===================================== */
export const deleteSubject = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    subject.isActive = false;
    await subject.save();

    res.json({
      success: true,
      message: "Subject deleted (soft)"
    });

  } catch (error) {

    console.error("Delete subject error:", error.message);

    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
};