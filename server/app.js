import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import adminPdfRoutes from "./routes/adminPdfRoutes.js";

/* Import webhook handler directly — must be before json parser */
import { razorpayWebhook } from "./controllers/paymentController.js";

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  "https://rohitacademy.net",
  "https://www.rohitacademy.net",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes(".vercel.app")) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn("CORS Blocked:", origin);
    return callback(new Error("CORS blocked"));
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later" },
});

app.use("/api", limiter);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ====================================================
   🔔 RAZORPAY WEBHOOK — raw body BEFORE express.json()
==================================================== */
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

/* JSON / URL-encoded parsers (after webhook) */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("🚀 Rohit Academy API Running..."));
app.get("/api/health", (req, res) =>
  res.json({ success: true, status: "OK", timestamp: new Date() })
);

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/pdf", pdfRoutes);

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/pdf", adminPdfRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route Not Found" });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack || err.message);
  if (err.name === "CastError")
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  if (err.code === 11000)
    return res.status(400).json({ success: false, message: "Duplicate field value" });
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});

export default app;
