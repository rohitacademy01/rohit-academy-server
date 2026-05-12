import { v2 as cloudinary } from "cloudinary";

/* =====================================
   🔒 ENV CHECK (SAFE MODE)
===================================== */
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

/* =====================================
   ☁️ INIT CLOUDINARY (ONLY IF CONFIGURED)
===================================== */
if (isCloudinaryConfigured) {

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  console.log("☁️ Cloudinary initialized");
  console.log("🔑 Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("🔑 Key length:", process.env.CLOUDINARY_API_KEY?.length);
console.log("🔑 Secret length:", process.env.CLOUDINARY_API_SECRET?.length);

} else {

  console.warn("⚠️ Cloudinary not configured");

}

/* =====================================
   🛡 HELPER
===================================== */
export const isCloudinaryEnabled = () => !!isCloudinaryConfigured;

/* =====================================
   🧪 LIGHT TEST (SAFE)
===================================== */
export const testCloudinaryConnection = async () => {

  if (!isCloudinaryConfigured) {
    console.warn("⚠️ Cloudinary skipped (no config)");
    return false;
  }

  try {
    // lightweight test (no heavy API call)
    await cloudinary.utils.api_sign_request(
      { timestamp: Date.now() },
      process.env.CLOUDINARY_API_SECRET
    );

    console.log("☁️ Cloudinary ready");
    return true;

  } catch (error) {
    console.error("❌ Cloudinary test failed:", error.message);
    return false;
  }

};

export default cloudinary;