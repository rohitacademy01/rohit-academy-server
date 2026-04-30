import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firebaseId: { type: String, trim: true, unique: true, sparse: true, index: true },
    phone: { type: String, match: [/^[6-9]\d{9}$/, "Invalid phone number"], unique: true, sparse: true, index: true },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true, index: true },
    password: { type: String, minlength: 6, select: false },
    name: { type: String, trim: true, maxlength: 50, default: "" },
    avatar: { type: String, default: "" },
    authProvider: { type: String, enum: ["firebase", "email"], default: "firebase", index: true },
    role: { type: String, enum: ["user", "admin", "teacher"], default: "user", index: true },
    isVerified: { type: Boolean, default: true, index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    lastLogin: { type: Date, default: Date.now },
    lastLoginIP: { type: String, default: "" },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ email: 1, phone: 1 });

userSchema.pre("save", async function () {
  try {
    if (this.phone) this.phone = this.phone.replace(/\D/g, "").slice(-10);
    if (this.email) this.email = this.email.toLowerCase().trim();
    if (this.isModified("password") && this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  } catch (err) {
    throw err;
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.updateLoginTime = function () {
  this.lastLogin = new Date();
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save();
};

userSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil > Date.now()) return Promise.resolve(this);
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  return this.save();
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

export default mongoose.model("User", userSchema);
