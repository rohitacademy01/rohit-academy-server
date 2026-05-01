import jwt from "jsonwebtoken";
import logger from "./logger.js";

/**
 * 🔐 Generate JWT Token (PRO VERSION)
 * @param {Object} payload - { id, role }
 * @param {String} expiresIn - default: 7d
 */
const generateToken = (payload = {}, expiresIn = "7d") => {
  try {

    /* =====================================
       ❌ ENV CHECK
    ===================================== */
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    /* =====================================
       ❌ PAYLOAD VALIDATION
    ===================================== */
    if (!payload?.id) {
      throw new Error("Token payload must contain user id");
    }

    /* =====================================
       🔥 SAFE & OPTIMIZED PAYLOAD
       👉 ROLE ADD (IMPORTANT FIX)
    ===================================== */
    const safePayload = {
      id: String(payload.id),
      role: payload.role || "user"
    };

    /* =====================================
       🔐 SIGN TOKEN
    ===================================== */
    const token = jwt.sign(
      safePayload,
      process.env.JWT_SECRET,
      {
        expiresIn,
        algorithm: "HS256",
        issuer: "rohit-academy",
        subject: String(payload.id),
      }
    );

    return token;

  } catch (error) {

    logger.error(`Token generation failed: ${error.message}`);

    throw new Error("Token generation failed");
  }
};

export default generateToken;