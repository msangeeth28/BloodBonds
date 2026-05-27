const express = require("express");
const bcrypt = require("bcryptjs"); // ✅ Imported ONCE at the top (clean practice)
const jwt = require("jsonwebtoken");
const sendOtpEmail = require("../utils/sendOtpEmail");

const User = require("../models/User");
const OtpStore = require("../models/OtpStore");
const DonationHistory = require("../models/DonationHistory");
const { auth } = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Helper: creates a signed JWT token for a user
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Strong Password Validation (used in both registration & reset)
// Returns an error message string if the password is weak, or null if it's OK.
// ─────────────────────────────────────────────────────────────────────────────
function validateStrongPassword(password) {
  if (!password || password.length < 8)
    return "Password must contain at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return "Password must contain at least one special character.";
  return null; // null = password is strong ✅
}

// ── PUBLIC: Top donors for homepage leaderboard ───────────────────────────────
router.get(
  "/top-donors",
  asyncHandler(async (req, res) => {
    const donationAgg = await DonationHistory.aggregate([
      { $match: { donorId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$donorId",
          donationCount: { $sum: 1 },
          lastDonation: { $max: "$donatedAt" },
        },
      },
      { $sort: { donationCount: -1, lastDonation: -1 } },
      { $limit: 10 },
    ]);

    const donorIds = donationAgg.map((d) => d._id).filter(Boolean);
    const users = await User.find({
      _id: { $in: donorIds },
      role: "donor",
    }).select("name bloodGroup city profileImage");

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u.toObject();
    });

    const topDonors = donationAgg
      .filter((d) => d._id && userMap[d._id.toString()])
      .map((d, idx) => ({
        ...userMap[d._id.toString()],
        donationCount: d.donationCount,
        rank: idx + 1,
      }));

    res.json(topDonors);
  }),
);

// ── STEP 1: Donor sends registration data → generate OTP ─────────────────────
router.post(
  "/donor/send-otp",
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      mobile,
      aadhaar,
      password,
      bloodGroup,
      city,
      subLocation,
    } = req.body;

    if (
      !name ||
      !email ||
      !mobile ||
      !aadhaar ||
      !password ||
      !bloodGroup ||
      !city ||
      !subLocation
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Strong password validation
    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const [emailTaken, mobileTaken, aadhaarTaken] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ mobile }),
      User.findOne({ aadhaar }),
    ]);
    if (emailTaken)
      return res.status(400).json({ message: "Email already registered" });
    if (mobileTaken)
      return res.status(400).json({ message: "Mobile already registered" });
    if (aadhaarTaken)
      return res.status(400).json({ message: "Aadhaar already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpStore.findOneAndUpdate(
      { mobile },
      {
        otp,
        expiresAt,
        pendingData: {
          name,
          email: email.toLowerCase(),
          mobile,
          aadhaar,
          password: hashedPassword,
          bloodGroup,
          city,
          subLocation,
        },
      },
      { upsert: true, new: true },
    );

     await sendOtpEmail(email, otp);
    res.json({ message: "OTP generated. Please check the backend console." });
  }),
);

// ── STEP 2: Verify OTP → create donor account ────────────────────────────────
router.post(
  "/donor/verify-otp",
  asyncHandler(async (req, res) => {
    const { mobile, otp } = req.body;
    if (!mobile || !otp)
      return res.status(400).json({ message: "Mobile and OTP required" });

    const record = await OtpStore.findOne({ mobile });
    if (!record)
      return res
        .status(400)
        .json({ message: "OTP not found. Please register again." });

    if (new Date() > record.expiresAt) {
      await OtpStore.deleteOne({ mobile });
      return res
        .status(400)
        .json({ message: "OTP expired. Please register again." });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const user = await User.create({ ...record.pendingData, role: "donor" });
    await OtpStore.deleteOne({ mobile });

    const token = signToken(user);
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        city: user.city,
        subLocation: user.subLocation,
        mobile: user.mobile,
        profileImage: user.profileImage,
      },
    });
  }),
);

// ── Organization registration ─────────────────────────────────────────────────
router.post(
  "/organization/register",
  asyncHandler(async (req, res) => {
    const { organizationName, email, mobile, password, city, subLocation } =
      req.body;

    if (
      !organizationName ||
      !email ||
      !mobile ||
      !password ||
      !city ||
      !subLocation
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Strong password validation
    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const [emailTaken, mobileTaken] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ mobile }),
    ]);
    if (emailTaken)
      return res.status(400).json({ message: "Email already registered" });
    if (mobileTaken)
      return res.status(400).json({ message: "Mobile already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      organizationName,
      name: organizationName,
      email: email.toLowerCase(),
      mobile,
      password: hashed,
      role: "organization",
      city,
      subLocation,
      isVerified: false,
    });

    res.status(201).json({
      message: "Registration submitted. Awaiting admin verification.",
    });
  }),
);

// ── Login (all roles) ─────────────────────────────────────────────────────────
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid email or password" });

    if (user.role === "organization" && !user.isVerified) {
      return res.status(403).json({
        message: "Your organization is pending admin verification.",
        pending: true,
      });
    }

    const token = signToken(user);
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        organizationName: user.organizationName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        bloodGroup: user.bloodGroup,
        city: user.city,
        subLocation: user.subLocation,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
      },
    });
  }),
);

// ── Get current user profile ──────────────────────────────────────────────────
router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  }),
);

// ── Upload/update profile image ───────────────────────────────────────────────
router.put(
  "/profile-image",
  auth,
  asyncHandler(async (req, res) => {
    const { profileImage } = req.body;
    if (!profileImage)
      return res.status(400).json({ message: "No image provided" });

    if (!profileImage.startsWith("data:image/")) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const sizeInBytes = (profileImage.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "Image too large. Maximum size is 2MB." });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage },
      { new: true },
    ).select("-password");

    res.json({
      message: "Profile image updated",
      profileImage: user.profileImage,
    });
  }),
);

// =============================================================================
// FORGOT PASSWORD
// STEP 1: User enters Aadhaar → generate OTP → send via email
// =============================================================================
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber) {
      return res.status(400).json({ message: "Please enter your Aadhaar number." });
    }

    // The User model stores the field as "aadhaar"
    const user = await User.findOne({ aadhaar: aadhaarNumber });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this Aadhaar number." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP on the user document with a 10-minute expiry
    user.resetOtp = otp;
    user.resetOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP to user's registered email — throws if it fails (asyncHandler catches it)
    await sendOtpEmail(user.email, otp);

    res.json({
      message: `OTP sent to your registered email address. It is valid for 10 minutes.`,
    });
  }),
);

// =============================================================================
// FORGOT PASSWORD
// STEP 2: User enters OTP + new password → verify and update
// =============================================================================
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { aadhaarNumber, otp, newPassword } = req.body;

    if (!aadhaarNumber || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find user by Aadhaar and check OTP has not expired yet
    const user = await User.findOne({
      aadhaar: aadhaarNumber,
      resetOtpExpire: { $gt: new Date() }, // $gt = "greater than" → OTP still valid
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid Aadhaar number or OTP has expired. Please try again." });
    }

    // Check if the OTP matches what we stored
    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please check and try again." });
    }

    // Strong password validation
    const passwordError = validateStrongPassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Hash the new password and clear the OTP fields from the database
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpire = null;
    await user.save();

    res.json({ message: "Password reset successful! You can now log in with your new password." });
  }),
);

module.exports = router;
