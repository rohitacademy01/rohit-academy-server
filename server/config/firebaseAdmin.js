import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;

try {
  console.log("🔥 NODE_ENV:", process.env.NODE_ENV);

  /* =====================================
     🔥 LOAD SERVICE ACCOUNT
  ===================================== */

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("📦 Using ENV Firebase Config");

    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  } else {
    const filePath =
      process.env.NODE_ENV === "production"
        ? "/etc/secrets/serviceAccount.json"
        : "./config/serviceAccount.json";

    console.log("📂 Reading file from:", filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error("Service account file not found");
    }

    const fileData = fs.readFileSync(filePath, "utf8");
    serviceAccount = JSON.parse(fileData);

    console.log("✅ File loaded successfully");
  }

  /* =====================================
     🔍 VALIDATION (🔥 IMPORTANT)
  ===================================== */

  if (!serviceAccount.project_id) {
    throw new Error("Invalid Firebase config (missing project_id)");
  }

  console.log("🔥 FIREBASE PROJECT:", serviceAccount.project_id);

  /* =====================================
     🚀 INIT FIREBASE ADMIN
  ===================================== */

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("🚀 Firebase Admin Initialized");
  } else {
    console.log("⚡ Firebase already initialized");
  }

} catch (error) {
  console.error("🔥 Firebase Admin Init Error FULL:", error.message);
}

export default admin;