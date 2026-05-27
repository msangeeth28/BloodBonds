const express = require("express");
const User = require("../models/User");
const EmergencyRequest = require("../models/EmergencyRequest");
const BloodRequirement = require("../models/BloodRequirement");
const DonationHistory = require("../models/DonationHistory");
const { auth, requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { BLOOD_COMPATIBILITY } = require("../utils/constants");

const router = express.Router();
router.use(auth, requireRole("donor"));

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY REQUESTS — matching blood group + same location
// ─────────────────────────────────────────────────────────────────────────────

router.get("/matching-requests", asyncHandler(async (req, res) => {
  const donor = await User.findById(req.user.id);
  if (!donor) return res.status(404).json({ message: "Donor not found" });

  // Find all blood groups this donor is compatible to donate to
  const donatableTo = Object.entries(BLOOD_COMPATIBILITY)
    .filter(([, eligibleDonors]) => eligibleDonors.includes(donor.bloodGroup))
    .map(([recipientGroup]) => recipientGroup);

  const requests = await EmergencyRequest.find({
    status: "Pending",
    city:        donor.city,
    subLocation: donor.subLocation,
    // Show if: request blood group matches compatibility, OR donor was explicitly listed
    $or: [
      { bloodGroup:       { $in: donatableTo } },
      { compatibleGroups: donor.bloodGroup    },
    ],
  }).populate("createdBy", "organizationName mobile");

  res.json(requests);
}));

// ─────────────────────────────────────────────────────────────────────────────
// BLOOD REQUIREMENTS — EXACT blood group match only
//
// A donor with blood group B- should only see requirements for B-.
// They must NOT see requirements for other blood groups, even compatible ones,
// because an org that posts a requirement for B- specifically needs B- blood.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/blood-requirements", asyncHandler(async (req, res) => {
  const donor = await User.findById(req.user.id);
  if (!donor) return res.status(404).json({ message: "Donor not found" });

  const requirements = await BloodRequirement.find({
    status:         "Active",
    city:           donor.city,
    subLocation:    donor.subLocation,
    remainingUnits: { $gt: 0 },
    // Exact match — only show requirements for the donor's own blood group
    bloodGroup:     donor.bloodGroup,
  }).sort({ createdAt: -1 });

  res.json(requirements);
}));

// ─────────────────────────────────────────────────────────────────────────────
// DONATION HISTORY
// ─────────────────────────────────────────────────────────────────────────────

router.get("/donation-history", asyncHandler(async (req, res) => {
  const history = await DonationHistory.find({ donorId: req.user.id }).sort({ donatedAt: -1 });
  res.json(history);
}));

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE (mobile, city, subLocation are editable)
// ─────────────────────────────────────────────────────────────────────────────

router.put("/update-profile", asyncHandler(async (req, res) => {
  const { mobile, city, subLocation } = req.body;
  const donor = await User.findById(req.user.id);
  if (!donor) return res.status(404).json({ message: "Donor not found" });

  if (mobile)      donor.mobile      = mobile;
  if (city)        donor.city        = city;
  if (subLocation) donor.subLocation = subLocation;

  await donor.save();

  res.json({
    message: "Profile updated",
    donor: {
      _id:          donor._id,
      name:         donor.name,
      email:        donor.email,
      mobile:       donor.mobile,
      bloodGroup:   donor.bloodGroup,
      city:         donor.city,
      subLocation:  donor.subLocation,
      role:         donor.role,
      profileImage: donor.profileImage,
    },
  });
}));

module.exports = router;
