const express = require("express");
const User = require("../models/User");
const DonationHistory = require("../models/DonationHistory");
const { auth, requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(auth, requireRole("admin"));

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

router.get("/dashboard-stats", asyncHandler(async (req, res) => {
  const [totalDonors, totalOrganizations, verifiedOrganizations, totalDonations] =
    await Promise.all([
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ role: "organization" }),
      User.countDocuments({ role: "organization", isVerified: true }),
      DonationHistory.countDocuments(),
    ]);

  // Most active blood group from donation history
  const bloodGroupAgg = await DonationHistory.aggregate([
    { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  // Most active city from donation history
  const locationAgg = await DonationHistory.aggregate([
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  res.json({
    totalDonors,
    totalOrganizations,
    verifiedOrganizations,
    totalDonations,
    mostActiveBloodGroup: bloodGroupAgg[0]?._id || "N/A",
    mostActiveLocation:   locationAgg[0]?._id   || "N/A",
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Pending verification queue
router.get("/pending-organizations", asyncHandler(async (req, res) => {
  const pending = await User.find({ role: "organization", isVerified: false })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(pending);
}));

// Approve an organization
router.put("/organizations/:id/verify", asyncHandler(async (req, res) => {
  const org = await User.findOne({ _id: req.params.id, role: "organization" });
  if (!org) return res.status(404).json({ message: "Organization not found" });
  org.isVerified = true;
  await org.save();
  res.json({ message: "Organization verified" });
}));

// Remove an organization
router.delete("/organizations/:id", asyncHandler(async (req, res) => {
  await User.findOneAndDelete({ _id: req.params.id, role: "organization" });
  res.json({ message: "Organization removed" });
}));

// All verified organizations with search + pagination
router.get("/organizations", asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const query = { role: "organization", isVerified: true };
  if (search) query.organizationName = { $regex: search, $options: "i" };

  const [orgs, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ organizationName: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({ orgs, total, page: Number(page), pages: Math.ceil(total / limit) });
}));

// ─────────────────────────────────────────────────────────────────────────────
// DONORS — All donors sorted A→Z, with optional name search + pagination
// Each donor also gets their total donation count attached.
// ─────────────────────────────────────────────────────────────────────────────

router.get("/donors", asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 15 } = req.query;

  // Build the base query — search by name if provided
  const query = { role: "donor" };
  if (search) query.name = { $regex: search, $options: "i" };

  // Fetch all matching donors sorted alphabetically
  const [allDonors, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ name: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  if (allDonors.length === 0) {
    return res.json({ donors: [], total: 0, page: Number(page), pages: 0 });
  }

  // Get donation counts for just the donors on this page (efficient)
  const donorIds = allDonors.map((d) => d._id);

  const donationCounts = await DonationHistory.aggregate([
    { $match: { donorId: { $in: donorIds } } },
    { $group: { _id: "$donorId", donationCount: { $sum: 1 } } },
  ]);

  // Build a quick lookup map: donorId → donationCount
  const countMap = {};
  donationCounts.forEach((d) => {
    countMap[d._id.toString()] = d.donationCount;
  });

  // Attach donation count to each donor (0 if they haven't donated yet)
  const donors = allDonors.map((d) => ({
    ...d.toObject(),
    donationCount: countMap[d._id.toString()] || 0,
  }));

  res.json({
    donors,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
}));

// Remove a donor
router.delete("/donors/:id", asyncHandler(async (req, res) => {
  await User.findOneAndDelete({ _id: req.params.id, role: "donor" });
  res.json({ message: "Donor removed" });
}));

module.exports = router;
