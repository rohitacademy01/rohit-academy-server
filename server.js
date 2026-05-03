import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: "/etc/secrets/.env" });
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";

/* =====================================
   🌍 ENV VALIDATION
===================================== */
const REQUIRED_ENV = ["MONGO_URI"];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing ENV: ${key}`);
    process.exit(1);
  }
});

/* =====================================
   🔹 CONFIG
===================================== */
const PORT = process.env.PORT || 10000;
let server;

/* =====================================
   🔹 MONGODB CONNECT
===================================== */
const connectDB = async () => {
  try {

    console.log("🔄 Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "rohitacademy",
      autoIndex: true,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    /* 🔥 Runtime Error Listener */
    mongoose.connection.on("error", (err) => {
      console.error("🔴 MongoDB runtime error:", err.message);
    });

  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    process.exit(1);
  }
};

/* =====================================
   🔥 GLOBAL ERROR HANDLING
===================================== */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION!");
  console.error(err.stack || err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION!");
  console.error(err.stack || err.message);

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

/* =====================================
   🚀 START SERVER
===================================== */
const startServer = async () => {
  try {

    await connectDB();

    server = app.listen(PORT, () => {
      console.log("=================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log("=================================");
    });

    /* ❌ PORT IN USE */
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} already in use`);
      } else {
        console.error("❌ Server error:", err.message);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error("❌ Server start failed:", err.message);
    process.exit(1);
  }
};

startServer();

/* =====================================
   🛑 GRACEFUL SHUTDOWN
===================================== */
const shutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down...`);

  try {

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log("🧹 HTTP server closed");
    }

    await mongoose.connection.close();
    console.log("🧹 MongoDB connection closed");

  } catch (err) {
    console.error("❌ Shutdown error:", err.message);
  }

  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);