const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');

// GET /api/doctors - public, list all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: { $ne: false } }).select('name email doctorProfile');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctors/:id/blocked-dates - get blocked dates for a specific doctor
router.get('/:id/blocked-dates', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findOne({ doctor: req.params.id });
    if (!schedule) return res.json({ blockedDates: [] });
    res.json({ blockedDates: schedule.blockedDates.map(b => b.date) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
