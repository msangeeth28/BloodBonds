const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    organizationName: { type: String },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["donor", "organization", "admin"],
      required: true,
    },

    // Temporary fields for Forgot Password OTP
    resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpire: {
    type: Date,
    default: null
  },

    // Donor fields
    aadhaar: { type: String, unique: true, sparse: true },
    bloodGroup: { type: String },

    // Location
    city: { type: String, required: true },
    subLocation: { type: String, required: true },

    // Organization-only
    isVerified: { type: Boolean, default: false },

    // Profile image (base64 data URL or relative path)
    profileImage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
