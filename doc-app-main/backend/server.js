// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require('express-session');
const passport = require('passport');
require("dotenv").config(); // ensure you have a .env with MONGO_URI
require('./config/auth'); // Initialize passport

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const Prescription = require("./models/Prescription");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

// CRA dev proxy sends X-Forwarded-For — required for express-rate-limit
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allows loading images from frontend

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use("/api", limiter);

// Middleware — allow CRA dev server on any localhost port (3000, 3001, 3002, …)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  process.env.FRONTEND_URL,
].filter(Boolean);

const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }));
} else {
  // Development: allow all origins (or use CRA proxy with same-origin requests)
  app.use(cors({ origin: true, credentials: true }));
}
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Public prescription verification
app.get("/api/verify/:verificationId", async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      verificationId: req.params.verificationId,
    }).select("-__v");
    if (!prescription) {
      return res.status(404).json({ valid: false, message: "Prescription not found" });
    }
    res.json({
      valid: true,
      verificationId: prescription.verificationId,
      doctorName: prescription.doctorName,
      patientName: prescription.patientName,
      consultationDate: prescription.consultationDate,
      medicinesCount: prescription.medicines.length,
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: "Verification failed" });
  }
});

// Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
    // Successful authentication, redirect to the frontend with user data
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  }
);

// Logout route
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('http://localhost:3000/login');
  });
});

// Health check
app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running..." }));

// Global Error Handlers (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// DB + start
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });
