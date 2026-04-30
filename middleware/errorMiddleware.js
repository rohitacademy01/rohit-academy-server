const errorMiddleware = (err, req, res, next) => {

  /* =====================================
     🔥 SAFE LOGGING
  ===================================== */
  if (process.env.NODE_ENV === "development") {
    console.error("🔥 ERROR:", err);
  } else {
    console.error("🔥 ERROR:", err.message);
  }

  /* =====================================
     🧬 DUPLICATE KEY
  ===================================== */
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "Field";
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  /* =====================================
     🧬 INVALID OBJECT ID
  ===================================== */
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  /* =====================================
     🧬 VALIDATION ERROR
  ===================================== */
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map(
      (val) => val.message
    );
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  /* =====================================
     📄 MULTER ERRORS
  ===================================== */
  if (err.name === "MulterError") {

    let message = err.message;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size should be less than 10MB";
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded";
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  /* =====================================
     📄 CUSTOM FILE ERROR
  ===================================== */
  if (
    err.message === "Only PDF files allowed" ||
    err.message === "Only image files allowed"
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  /* =====================================
     ☁️ CLOUDINARY ERROR
  ===================================== */
  if (err.name === "CloudinaryError") {
    return res.status(500).json({
      success: false,
      message: "Cloud upload failed",
    });
  }

  /* =====================================
     🔐 JWT ERRORS
  ===================================== */
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Session expired, please login again",
    });
  }

  /* =====================================
     🚨 DEFAULT SAFE ERROR
  ===================================== */
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
  });
};

export default errorMiddleware;