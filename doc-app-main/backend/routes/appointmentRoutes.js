// server/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Middleware to check authentication
const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Please login to continue' });
};

router.use(isAuth);

// GET user's appointments
router.get('/user', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// EDIT appointment (date/time)
router.put('/:id', async (req, res) => {
  try {
    const { date, startTime, reason } = req.body;
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status === 'confirmed') return res.status(400).json({ message: 'Cannot edit a confirmed appointment' });

    if (date) appointment.date = date;
    if (startTime) appointment.startTime = startTime;
    if (reason) appointment.reason = reason;

    await appointment.save();
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// CANCEL appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
  }
});

module.exports = router;
