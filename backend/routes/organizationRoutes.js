const express = require("express");
const User = require("../models/User");
const EmergencyRequest = require("../models/EmergencyRequest");
const BloodRequirement = require("../models/BloodRequirement");
const DonationHistory = require("../models/DonationHistory");
const { auth, requireRole } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.use(auth, requireRole("organization"));

// =============================================================================
// EMERGENCY REQUESTS
// =============================================================================

// Create a new emergency request
router.post("/emergency-requests", asyncHandler(async (req, res) => {
  const { patientName, bloodGroup, compatibleGroups, units, urgency } = req.body;

  if (!patientName || !bloodGroup || !units || !urgency) {
    return res.status(400).json({ message: "All fields required" });
  }

  const org = await User.findById(req.user.id);

  await EmergencyRequest.create({
    patientName,
    bloodGroup,
    compatibleGroups: compatibleGroups || [],
    hospital:    org.organizationName,
    units:       Number(units),
    urgency,
    city:        org.city,
    subLocation: org.subLocation,
    createdBy:   org._id,
  });

  res.status(201).json({ message: "Emergency request created" });
}));

// Get all emergency requests for this organization
router.get("/emergency-requests", asyncHandler(async (req, res) => {
  //{ status: "Pending" } to ensure fulfilled items disappear from the active UI
  const requests = await EmergencyRequest.find({ createdBy: req.user.id, status: "Pending" }).sort({ createdAt: -1 });
  res.json(requests);
}));

// Mark an emergency request as fulfilled
// BLOOD GROUP VALIDATION: If an Aadhaar is provided, the donor's blood group
// must match the request's primary blood group OR one of its compatible groups.
// If it doesn't match → reject with a clear 422 error (do NOT fulfill the request).
router.put("/emergency-requests/:id/fulfill", asyncHandler(async (req, res) => {
  const { donorAadhaar, donorName, donorMobile } = req.body;

  const request = await EmergencyRequest.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!request) return res.status(404).json({ message: "Request not found" });
  if (request.status === "Fulfilled") return res.status(400).json({ message: "Already fulfilled" });

  const org = await User.findById(req.user.id);
  let donor = null;
  let donorNotFound = false;

  // ── Blood group validation when Aadhaar is provided ──────────────────────
  if (donorAadhaar) {
    donor = await User.findOne({ aadhaar: donorAadhaar, role: "donor" });

    if (!donor) {
      // Aadhaar typed but not found in DB — mark as not found, still allow fulfillment
      donorNotFound = true;
    } else {
      // Donor found — now check blood group compatibility
      // Accepted blood groups = the request's main group + any compatible groups the org listed
      const acceptedGroups = [request.bloodGroup, ...(request.compatibleGroups || [])];

      if (!acceptedGroups.includes(donor.bloodGroup)) {
        // Blood group mismatch — stop here, do NOT fulfill
        return res.status(422).json({
          message:
            `Blood group mismatch! This donor's blood group is ${donor.bloodGroup}, ` +
            `but this request needs ${request.bloodGroup}` +
            (request.compatibleGroups?.length
              ? ` (or compatible: ${request.compatibleGroups.join(", ")})`
              : "") +
            `. Please enter the Aadhaar of a compatible donor.`,
          donorBloodGroup:   donor.bloodGroup,
          requiredBloodGroup: request.bloodGroup,
        });
      }
    }
  }

  // All checks passed — mark the request as fulfilled
  request.status = "Fulfilled";
  await request.save();

  // Record the donation in history
  if (donor) {
    // Registered donor found via Aadhaar
    await DonationHistory.create({
      donorId:          donor._id,
      donorName:        donor.name,
      donorAadhaar,
      organizationId:   org._id,
      organizationName: org.organizationName,
      requestId:        request._id,
      requestType:      "emergency",
      bloodGroup:       request.bloodGroup,
      units:            request.units,
      hospital:         org.organizationName,
      city:             org.city,
      subLocation:      org.subLocation,
    });
  } else if (donorName && donorMobile) {
    // Manual entry — unregistered donor
    await DonationHistory.create({
      donorName,
      organizationId:   org._id,
      organizationName: org.organizationName,
      requestId:        request._id,
      requestType:      "emergency",
      bloodGroup:       request.bloodGroup,
      units:            request.units,
      hospital:         org.organizationName,
      city:             org.city,
      subLocation:      org.subLocation,
    });
  }

  res.json({
    message: "Request fulfilled successfully",
    donorNotFound: donorNotFound
      ? "Aadhaar not found in system. Request still marked fulfilled."
      : null,
  });
}));

// =============================================================================
// BLOOD REQUIREMENTS
// =============================================================================

// Create a new blood requirement
// The 20-unit cap only applies at creation — add-units has no cap
router.post("/blood-requirements", asyncHandler(async (req, res) => {
  const { bloodGroup, requiredUnits } = req.body;

  if (!bloodGroup || !requiredUnits) {
    return res.status(400).json({ message: "Blood group and units required" });
  }
  if (Number(requiredUnits) > 20) {
    return res.status(400).json({ message: "Maximum 20 units allowed when creating a requirement" });
  }

  const org = await User.findById(req.user.id);

  await BloodRequirement.create({
    bloodGroup,
    requiredUnits:      Number(requiredUnits),
    remainingUnits:     Number(requiredUnits),
    city:               org.city,
    subLocation:        org.subLocation,
    createdBy:          org._id,
    organizationName:   org.organizationName,
    organizationMobile: org.mobile,
  });

  res.status(201).json({ message: "Blood requirement created" });
}));

// Get all blood requirements for this organization
router.get("/blood-requirements", asyncHandler(async (req, res) => {
  // { status: "Active" } to prevent ghost rendering of fulfilled items
  const reqs = await BloodRequirement.find({ createdBy: req.user.id, status: "Active" }).sort({ createdAt: -1 });
  res.json(reqs);
}));

// Partially or fully fulfill a blood requirement
// BLOOD GROUP VALIDATION: If an Aadhaar is provided, the donor's blood group
// must EXACTLY match the requirement's blood group.
// Blood requirements are strict — no compatible groups concept here.
// If it doesn't match → reject with a clear 422 error (do NOT record the donation).
router.put("/blood-requirements/:id/fulfill", asyncHandler(async (req, res) => {
  const { units, donorAadhaar, donorName, donorMobile } = req.body;

  if (!units || Number(units) < 1) {
    return res.status(400).json({ message: "Units must be at least 1" });
  }

  const requirement = await BloodRequirement.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });

  if (Number(units) > requirement.remainingUnits) {
    return res.status(400).json({
      message: `Only ${requirement.remainingUnits} units remaining for this requirement`,
    });
  }

  const org = await User.findById(req.user.id);
  let donor = null;

  // ── Blood group validation when Aadhaar is provided ──────────────────────
  if (donorAadhaar) {
    donor = await User.findOne({ aadhaar: donorAadhaar, role: "donor" });

    if (donor) {
      // Blood requirements are strict — only the exact blood group is accepted
      if (donor.bloodGroup !== requirement.bloodGroup) {
        // Mismatch — stop here, do NOT record anything
        return res.status(422).json({
          message:
            `Blood group mismatch! This donor's blood group is ${donor.bloodGroup}, ` +
            `but this requirement is for ${requirement.bloodGroup} only. ` +
            `Please enter the Aadhaar of a ${requirement.bloodGroup} donor.`,
          donorBloodGroup:    donor.bloodGroup,
          requiredBloodGroup: requirement.bloodGroup,
        });
      }
    }
    // If donor not found by Aadhaar, we fall through and log with the typed Aadhaar
  }

  // All checks passed — record the fulfillment
  requirement.fulfillmentLogs.push({
    donorName:    donor ? donor.name : donorName,
    donorAadhaar: donorAadhaar || null,
    donorMobile:  donor ? donor.mobile : donorMobile,
    units:        Number(units),
    isRegistered: !!donor,
  });

  requirement.remainingUnits -= Number(units);
  if (requirement.remainingUnits === 0) requirement.status = "Fulfilled";
  await requirement.save();

  // Create donation history only for registered donors
  if (donor) {
    await DonationHistory.create({
      donorId:          donor._id,
      donorName:        donor.name,
      donorAadhaar,
      organizationId:   org._id,
      organizationName: org.organizationName,
      requestId:        requirement._id,
      requestType:      "requirement",
      bloodGroup:       requirement.bloodGroup,
      units:            Number(units),
      city:             org.city,
      subLocation:      org.subLocation,
    });
  }

  res.json({
    message: "Fulfillment recorded successfully",
    remainingUnits: requirement.remainingUnits,
  });
}));

// Add more units to an existing requirement (no cap — org can always add more stock)
router.put("/blood-requirements/:id/add-units", asyncHandler(async (req, res) => {
  const { additionalUnits } = req.body;

  if (!additionalUnits || Number(additionalUnits) < 1) {
    return res.status(400).json({ message: "Enter a valid number of units to add" });
  }

  const requirement = await BloodRequirement.findOne({ _id: req.params.id, createdBy: req.user.id });
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });

  requirement.requiredUnits  += Number(additionalUnits);
  requirement.remainingUnits += Number(additionalUnits);

  // Re-activate if it was previously fulfilled
  if (requirement.status === "Fulfilled") requirement.status = "Active";

  await requirement.save();

  res.json({ message: "Units added successfully", requirement });
}));

// DELETE an emergency request permanently
router.delete("/emergency-requests/:id", asyncHandler(async (req, res) => {
  const request = await EmergencyRequest.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  if (!request) return res.status(404).json({ message: "Request not found" });
  res.json({ message: "Emergency request deleted successfully" });
}));

// DELETE a blood requirement permanently
router.delete("/blood-requirements/:id", asyncHandler(async (req, res) => {
  const requirement = await BloodRequirement.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });
  res.json({ message: "Blood requirement deleted successfully" });
}));

// =============================================================================
// DASHBOARD STATS
// =============================================================================

router.get("/dashboard-stats", asyncHandler(async (req, res) => {
  const orgId = req.user.id;

  // A) "Total Emergency Reqs"
  // Logic: Counts ALL requests ever created. Deleted items are naturally excluded because they no longer exist in DB.
  const totalRequests = await EmergencyRequest.countDocuments({ 
    createdBy: orgId 
  });

  // D) "Pending Blood Requests"
  // Logic: Counts ONLY items where status is strictly "Pending"
  const pendingRequests = await EmergencyRequest.countDocuments({ 
    createdBy: orgId, 
    status: "Pending" 
  });

  // E) "Total Fulfilled Blood Requests"
  // Logic: Counts ALL historically fulfilled requests.
  const fulfilledRequests = await EmergencyRequest.countDocuments({ 
    createdBy: orgId, 
    status: "Fulfilled" 
  });

  // B) "Total Blood Requirements"
  // Logic: Counts ALL requirements ever created.
  const totalRequirements = await BloodRequirement.countDocuments({ 
    createdBy: orgId 
  });

  // C) "Active Requirements"
  // Logic: Counts ONLY requirements that are currently "Active"
  const activeRequirements = await BloodRequirement.countDocuments({ 
    createdBy: orgId, 
    status: "Active" 
  });

  // Send the exactly matched keys back to the frontend
  res.json({
    totalRequests,
    pendingRequests,
    fulfilledRequests,
    totalRequirements,
    activeRequirements
  });
}));


// =============================================================================
// ORGANIZATION PROFILE UPDATE
// =============================================================================

router.put("/profile", asyncHandler(async (req, res) => {
  const { mobile, subLocation } = req.body;
  const org = await User.findById(req.user.id);
  if (!org) return res.status(404).json({ message: "Organization not found" });

  if (mobile)      org.mobile      = mobile;
  if (subLocation) org.subLocation = subLocation;

  await org.save();

  res.json({
    message: "Profile updated",
    org: {
      _id:              org._id,
      organizationName: org.organizationName,
      email:            org.email,
      mobile:           org.mobile,
      city:             org.city,
      subLocation:      org.subLocation,
      role:             org.role,
      profileImage:     org.profileImage,
    },
  });
}));

module.exports = router;
