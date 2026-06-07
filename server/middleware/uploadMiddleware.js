import multer from "multer";

/* =====================================
   📦 MEMORY STORAGE
===================================== */
const storage = multer.memoryStorage();

/* =====================================
   🔍 STRICT FILE FILTER
===================================== */
const fileFilter = (req, file, cb) => {

  const { fieldname, mimetype } = file;

  /* 📄 PDF */
  if (fieldname === "file") {
    if (mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files allowed"), false);
    }
    return cb(null, true);
  }

  /* 🖼 THUMBNAIL */
  if (fieldname === "thumbnail") {
    if (!mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"), false);
    }
    return cb(null, true);
  }

  /* 🖼 PREVIEW IMAGES */
  if (fieldname === "previewImages") {
    if (!mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"), false);
    }
    return cb(null, true);
  }

  return cb(null, true);
};

/* =====================================
   📤 MAIN UPLOAD (PDF + THUMBNAIL)
===================================== */
export const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2 // 🔥 max 2 files (file + thumbnail)
  }
});

/* =====================================
   🖼 PREVIEW IMAGES
===================================== */
export const uploadPreviewImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 5
  }
}).array("previewImages", 5);

/* =====================================
   🚨 ERROR HANDLER
===================================== */
export const handleMulterError = (err, req, res, next) => {

  if (err instanceof multer.MulterError) {

    let message = err.message;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large (max 10MB)";
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded";
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload failed"
    });
  }

  next();
};