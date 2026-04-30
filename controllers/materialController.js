import mongoose from "mongoose";
import Material from "../models/Material.js";
import Class from "../models/Class.js";
import Subject from "../models/Subject.js";
import logger from "../utils/logger.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import fs from "fs/promises";
import path from "path";
import { generatePreview } from "../utils/pdfPreview.js";

/* =====================================
   ☁️ HELPERS
===================================== */
const uploadPDFToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "materials", resource_type: "raw" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

const uploadImageToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/* =====================================
   🧠 FILTER BUILDER
===================================== */
const buildFilter = ({ classId, subjectId, streamId }) => {
  const filter = { isActive: true };

  if (classId) filter.classId = classId;
  if (subjectId) filter.subjectId = subjectId;
  if (streamId) filter.streamId = streamId;

  return filter;
};

/* =====================================
   ➕ ADD MATERIAL
===================================== */
export const addMaterial = async (req, res, next) => {
  let tempPath = null;

  try {
    const { title, classId, subjectId, streamId, price, type } = req.body;

    const pdfFile = req.files?.file?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!title || !classId || !subjectId || !price || !type || !pdfFile) {
      throw new Error("Required fields missing");
    }

    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      throw new Error("Invalid class/subject ID");
    }

    const [cls, sub] = await Promise.all([
      Class.findById(classId),
      Subject.findById(subjectId)
    ]);

    if (!cls || !sub) throw new Error("Invalid class/subject");

    /* 🔥 STREAM VALIDATION */
    if (cls.hasStreams && !streamId) {
      throw new Error("Stream required for this class");
    }

    /* 🔥 SUBJECT VALIDATION */
    if (sub.classId.toString() !== classId) {
      throw new Error("Subject does not belong to class");
    }

    if (cls.hasStreams && sub.streamId?.toString() !== streamId) {
      throw new Error("Subject does not belong to stream");
    }

    /* 📄 TEMP FILE */
    tempPath = path.join("uploads", Date.now() + ".pdf");

    await fs.mkdir("uploads", { recursive: true });
    await fs.writeFile(tempPath, pdfFile.buffer);

    await generatePreview(tempPath, "uploads");

    /* ☁️ UPLOAD */
    const pdf = await uploadPDFToCloudinary(pdfFile.buffer);

    let previews = [];

    for (let i = 1; i <= 2; i++) {
      const file = `uploads/preview-${i}.jpg`;
      try {
        await fs.access(file);
        const up = await cloudinary.uploader.upload(file, {
          folder: "materials/previews"
        });
        previews.push(up.secure_url);
        await fs.unlink(file);
      } catch {}
    }

    let thumb = "";
    if (thumbnailFile) {
      const t = await uploadImageToCloudinary(
        thumbnailFile.buffer,
        "materials/thumbnails"
      );
      thumb = t.secure_url;
    }

    const material = await Material.create({
      title,
      classId,
      subjectId,
      streamId: cls.hasStreams ? streamId : null,
      type,
      price,
      fileUrl: pdf.secure_url,
      cloudinaryId: pdf.public_id,
      thumbnail: thumb,
      previewImages: previews
    });

    logger.info(`📦 Material created: ${title}`);

    res.status(201).json({
      success: true,
      data: material
    });

  } catch (err) {
    logger.error(`Add material error: ${err.message}`);
    next(err);
  } finally {
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch {}
    }
  }
};

/* =====================================
   📄 GET MATERIALS (QUERY)
===================================== */
export const getMaterials = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);

    const materials = await Material.find(filter)
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("streamId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: materials });

  } catch (err) {
    next(err);
  }
};

/* =====================================
   📄 GET MATERIALS BY CLASS + SUBJECT
   🔥 THIS FIXES YOUR ERROR
===================================== */
export const getMaterialsByClassSubject = async (req, res, next) => {
  try {

    const { classId, subjectId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(classId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid IDs"
      });
    }

    const materials = await Material.find({
      classId,
      subjectId,
      isActive: true
    })
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("streamId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: materials
    });

  } catch (err) {
    next(err);
  }
};

/* =====================================
   🔍 GET SINGLE MATERIAL
===================================== */
export const getMaterialById = async (req, res, next) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const material = await Material.findById(req.params.id)
      .populate("classId", "name")
      .populate("subjectId", "name")
      .populate("streamId", "name");

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      });
    }

    res.json({ success: true, data: material });

  } catch (err) {
    next(err);
  }
};

/* =====================================
   ✏ UPDATE MATERIAL
===================================== */
export const updateMaterial = async (req, res, next) => {
  try {

    const material = await Material.findById(req.params.id);

    if (!material) throw new Error("Material not found");

    const { title, price, description, isActive } = req.body;

    if (title) material.title = title;
    if (price !== undefined) material.price = price;
    if (description !== undefined) material.description = description;
    if (isActive !== undefined) material.isActive = isActive;

    await material.save();

    res.json({ success: true, data: material });

  } catch (err) {
    next(err);
  }
};

/* =====================================
   ❌ DELETE MATERIAL
===================================== */
export const deleteMaterial = async (req, res, next) => {
  try {

    const material = await Material.findById(req.params.id);

    if (!material) throw new Error("Material not found");

    if (material.cloudinaryId) {
      await cloudinary.uploader.destroy(material.cloudinaryId, {
        resource_type: "raw"
      });
    }

    await material.deleteOne();

    res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};

/* =====================================
   🔁 TOGGLE STATUS
===================================== */
export const toggleMaterialStatus = async (req, res, next) => {
  try {

    const material = await Material.findById(req.params.id);

    if (!material) throw new Error("Material not found");

    material.isActive = !material.isActive;
    await material.save();

    res.json({
      success: true,
      data: material
    });

  } catch (err) {
    next(err);
  }
};