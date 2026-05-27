const mongoose = require("mongoose");

// Tracks each individual donation against a requirement
const fulfillmentLogSchema = new mongoose.Schema({
  donorName:    { type: String },
  donorAadhaar: { type: String },
  donorMobile:  { type: String },
  units:        { type: Number, required: true },
  donatedAt:    { type: Date, default: Date.now },
  isRegistered: { type: Boolean, default: false }, // true if donor was found in DB
});

const bloodRequirementSchema = new mongoose.Schema(
  {
    bloodGroup:    { type: String, required: true },
    // NOTE: No max limit here — the 20-unit cap on CREATION is enforced in the
    // route handler only. Removing max:20 from the model allows add-units to work
    // freely after partial fulfillment without Mongoose throwing a validation error.
    requiredUnits:  { type: Number, required: true },
    remainingUnits: { type: Number, required: true },

    city:        { type: String, required: true },
    subLocation: { type: String, required: true },

    createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizationName:   { type: String, required: true },
    organizationMobile: { type: String },

    fulfillmentLogs: [fulfillmentLogSchema],

    status: { type: String, enum: ["Active", "Fulfilled"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BloodRequirement", bloodRequirementSchema);
