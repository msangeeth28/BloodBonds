const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    compatibleGroups: [{ type: String }], // extra compatible groups org selects

    hospital: { type: String, required: true },
    units: { type: Number, required: true, min: 1 },
    urgency: { type: String, enum: ["Low", "Medium", "High"], required: true },

    city: { type: String, required: true },
    subLocation: { type: String, required: true },

    status: { type: String, enum: ["Pending", "Fulfilled"], default: "Pending" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
