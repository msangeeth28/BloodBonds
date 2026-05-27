const mongoose = require("mongoose");

// Temporary OTP + pending registration data
const otpStoreSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    pendingData: { type: Object, required: true }, // full registration payload
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired docs
otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OtpStore", otpStoreSchema);
