const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const normalizeTime = (time) => {
  if (!time) return null;
  const t = String(time).trim();
  // Already 24h HH:MM
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  // 12h e.g. 02:30 PM
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return t;
};

const getOrCreateDemoDoctor = async () => {
  let doctor = await User.findOne({ role: 'doctor' });
  if (!doctor) {
    const bcrypt = require('bcryptjs');
    doctor = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@medconnect.com',
      phone: '9876543210',
      dob: new Date('1985-06-15'),
      gender: 'female',
      password: await bcrypt.hash('doctor123', 10),
      role: 'doctor',
      doctorProfile: {
        specialization: 'General Physician',
        consultationFee: 500,
      },
    });
  }
  return doctor;
};

router.get('/user', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name doctorProfile')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason, appointmentType } = req.body;

    if (!date || !reason?.trim()) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }

    const start = normalizeTime(startTime) || '10:00';
    let end = normalizeTime(endTime) || '10:30';

    // Ensure end is after start
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      const endMins = sh * 60 + sm + 30;
      end = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
    }

    let resolvedDoctorId = doctorId;
    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      resolvedDoctorId = null;
    }
    if (!resolvedDoctorId) {
      const doctor = await getOrCreateDemoDoctor();
      resolvedDoctorId = doctor._id;
    }

    const count = await Appointment.countDocuments();
    const appointmentNumber = `APT-${String(count + 1).padStart(6, '0')}`;

    const appointment = await Appointment.create({
      appointmentNumber,
      patient: req.user._id,
      doctor: resolvedDoctorId,
      date: new Date(date),
      startTime: start,
      endTime: end,
      reason: reason.trim(),
      appointmentType: appointmentType || 'consultation',
      status: 'scheduled',
      payment: { consultationFee: 500, paymentStatus: 'pending' },
      createdBy: req.user._id,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name doctorProfile');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create appointment error:', error);
    const message = error.name === 'ValidationError'
      ? Object.values(error.errors).map((e) => e.message).join(', ')
      : error.message;
    res.status(500).json({ message: message || 'Error creating appointment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { date, startTime, reason } = req.body;
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot edit a confirmed appointment' });
    }
    if (date) appointment.date = date;
    if (startTime) appointment.startTime = normalizeTime(startTime) || startTime;
    if (reason) appointment.reason = reason;
    await appointment.save();
    res.json({ message: 'Appointment updated', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

module.exports = router;
