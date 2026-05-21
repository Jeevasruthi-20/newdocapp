// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

router.post("/signup", async (req, res) => {
  try {
    const { 
      name, email, phone, dob, gender, password,
      bloodGroup, allergies, conditions, medications, 
      emergencyContactName, emergencyContactPhone, emergencyContactRelation
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
      gender: gender || 'male', // Default to male if not provided, though it should be required
      password: hashedPassword,
      bloodGroup: bloodGroup || null,
      allergies: allergies ? [{ name: allergies }] : [],
      medicalConditions: conditions ? [{ name: conditions }] : [],
      medications: medications ? [{ name: medications }] : [],
      emergencyContact: {
        name: emergencyContactName || '',
        phone: emergencyContactPhone || '',
        relationship: emergencyContactRelation || ''
      }
    });


    await newUser.save();

    // Send Welcome Email
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Welcome to MedConnect!',
        message: `<h1>Welcome, ${newUser.name}!</h1><p>Your registration was successful. We are glad to have you with us!</p>`,
      });
    } catch (emailErr) {
      console.error("Email send failed during signup:", emailErr);
    }

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
});

// Login route
router.post("/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      const userResponse = user.toObject();
      delete userResponse.password;
      return res.json({ message: 'Login successful', user: userResponse });
    });
  })(req, res, next);
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user session
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user.toObject();
    delete user.password;
    res.json(user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Forgot Password (OTP-based)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    const message = `
      <h1>Password Reset OTP</h1>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message: message
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified correctly" });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// Reset Password (using OTP)
router.post("/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
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
    const { email } = req.params;
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

module.exports = router;
