import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

/* =====================================
   🔐 SAFE FILE NAME
===================================== */
const generateFileName = (originalName) => {
  const uniqueId = crypto.randomBytes(6).toString("hex");
  return `${originalName}-${uniqueId}`;
};

/* =====================================
   ☁️ UPLOAD PDF
===================================== */
export const uploadPDF = (buffer, fileName) =>
  new Promise((resolve, reject) => {

    try {

      /* ❌ BASIC VALIDATION */
      if (!buffer || buffer.length === 0) {
        return reject(new Error("Empty file buffer"));
      }

      /* ❌ SIZE LIMIT (10MB) */
      if (buffer.length > 10 * 1024 * 1024) {
        return reject(new Error("File too large (max 10MB)"));
      }

      /* 🔥 SAFE FILE NAME */
      const safeName = generateFileName(fileName || "file");

      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "rohit-academy/materials",
          public_id: safeName,
          overwrite: false, // 🔥 no overwrite
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error.message);
            return reject(error);
          }

          if (!result) {
            return reject(new Error("Upload failed"));
          }

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
          });
        }
      );

      /* ❌ STREAM ERROR */
      stream.on("error", (err) => {
        console.error("❌ Stream error:", err.message);
        reject(err);
      });

      stream.end(buffer);

    } catch (error) {
      console.error("❌ Upload error:", error.message);
      reject(error);
    }

  });

/* =====================================
   ❌ DELETE PDF
===================================== */
export const deletePDF = async (publicId) => {

  try {

    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    return result;

  } catch (error) {
    console.error("❌ Delete error:", error.message);
    return null;
  }
};