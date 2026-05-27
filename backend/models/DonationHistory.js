const mongoose = require("mongoose");

const donationHistorySchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donorName: String,
    donorAadhaar: String,

    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    organizationName: String,

    requestId: { type: mongoose.Schema.Types.ObjectId },
    requestType: { type: String, enum: ["emergency", "requirement"], default: "emergency" },

    bloodGroup: String,
    units: Number,
    hospital: String,
    city: String,
    subLocation: String,

    donatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationHistory", donationHistorySchema);
