const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const sendEmail = require("../utils/sendEmail");
const { protect } = require("../middleware/authMiddleware");
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  JWT_REFRESH_SECRET,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.refreshTokenExpires;
  return obj;
};

const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const userData = sanitizeUser(user);
  res.json({
    message: "Success",
    accessToken,
    refreshToken,
    user: userData,
  });
};

router.post("/signup", async (req, res) => {
  try {
    const {
      name, email, phone, dob, gender, password,
      bloodGroup, allergies, conditions, medications,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      dob: new Date(dob),
      gender: gender || "male",
      password: hashedPassword,
      bloodGroup: bloodGroup || null,
      allergies: allergies ? [{ name: allergies }] : [],
      medicalConditions: conditions ? [{ name: conditions }] : [],
      medications: medications ? [{ name: medications }] : [],
      emergencyContact: {
        name: emergencyContactName || "",
        phone: emergencyContactPhone || "",
        relationship: emergencyContactRelation || "",
      },
    });

    await newUser.save();

    try {
      await sendEmail({
        email: newUser.email,
        subject: "Welcome to MedConnect!",
        message: `<h1>Welcome, ${newUser.name}!</h1><p>Your registration was successful.</p>`,
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    await issueTokens(newUser, res);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await issueTokens(user, res);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("+refreshTokenHash +refreshTokenExpires");

    if (
      !user ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(refreshToken) ||
      user.refreshTokenExpires < new Date()
    ) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    await issueTokens(user, res);
  } catch (err) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
});

router.post("/logout", protect, async (req, res) => {
  try {
    req.user.refreshTokenHash = undefined;
    req.user.refreshTokenExpires = undefined;
    await req.user.save({ validateBeforeSave: false });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

router.get("/me", protect, (req, res) => {
  res.json(sanitizeUser(req.user));
});

// Legacy session logout
router.get("/logout", (req, res) => {
  if (req.logout) {
    req.logout(() => res.json({ message: "Logged out" }));
  } else {
    res.json({ message: "Logged out" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 600000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `<h1>Password Reset OTP</h1><p>Your OTP: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });
    res.json({ message: "OTP verified correctly" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
});

router.get("/profile/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
