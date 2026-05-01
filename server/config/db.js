import mongoose from "mongoose";

/* =====================================
   🔗 CONNECT DATABASE
===================================== */
const connectDB = async () => {

  try {

    /* 🔒 ENV CHECK */
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI missing in environment");
      process.exit(1);
    }

    /* ⚙️ MONGOOSE SETTINGS */
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "rohitacademy", // optional but recommended
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 DB Name: ${conn.connection.name}`);

    /* =====================================
       📡 CONNECTION EVENTS
    ===================================== */

    mongoose.connection.on("error", (err) => {
      console.error("🔴 MongoDB error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🟢 MongoDB reconnected");
    });

  } catch (error) {

    console.error(`🔴 Initial DB Connection Failed: ${error.message}`);

    /* 🔁 RETRY AFTER 5 SEC */
    setTimeout(connectDB, 5000);
  }

};

export default connectDB;