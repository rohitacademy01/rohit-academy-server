import User from "../models/User.js";
import logger from "../utils/logger.js";

/* =====================================
   🔐 ADMIN ONLY MIDDLEWARE (FINAL SECURE)
===================================== */
const adminOnly = async (req, res, next) => {
  try {

    /* =====================================
       🔍 AUTH CHECK (STRICT)
    ===================================== */
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    /* =====================================
       🔐 ALWAYS VERIFY FROM DB (NO TRUST TOKEN)
    ===================================== */
    const user = await User.findById(userId)
      .select("role isBlocked")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    /* =====================================
       ⛔ BLOCK CHECK
    ===================================== */
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked"
      });
    }

    /* =====================================
       🔐 ROLE CHECK (FINAL)
    ===================================== */
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied (admin only)"
      });
    }

    /* =====================================
       🔥 ATTACH VERIFIED USER (CLEAN)
    ===================================== */
    req.user = {
      ...req.user,
      _id: userId,
      role: user.role
    };

    return next();

  } catch (error) {

    logger.error(`❌ Admin middleware error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Admin authorization failed"
    });
  }
};

export { adminOnly };
export default adminOnly;