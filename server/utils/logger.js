import winston from "winston";
import fs from "fs";
import path from "path";

/* =====================================
   📁 ENSURE LOG DIRECTORY
===================================== */
const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/* =====================================
   🎨 COLORS (DEV ONLY)
===================================== */
const colors = {
  info: "green",
  warn: "yellow",
  error: "red",
  debug: "blue",
};

winston.addColors(colors);

/* =====================================
   🧾 FORMAT
===================================== */
const logFormat = winston.format.printf(
  ({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] ${level.toUpperCase()}: ${message} - ${stack}`
      : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }
);

/* =====================================
   🔧 BASE FORMAT
===================================== */
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  logFormat
);

/* =====================================
   🚀 LOGGER
===================================== */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",

  format: baseFormat,

  transports: [

    /* 🖥 CONSOLE */
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? baseFormat // clean logs
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: "HH:mm:ss" }),
              logFormat
            ),
    }),

    /* ❌ ERROR LOG */
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    }),

    /* 📦 ALL LOG */
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

export default logger;