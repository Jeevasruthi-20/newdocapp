// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const DoctorSchedule = require('../models/DoctorSchedule');
const { adminAuth } = require('../middleware/adminMiddleware');

router.use(adminAuth);

// GET all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error: error.message });
  }
});

// GET all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// UPDATE appointment status
router.put('/appointments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// DELETE patient account
router.delete('/patient/:id', async (req, res) => {
  try {
    const patient = await User.findOneAndDelete({ _id: req.params.id, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient', error: error.message });
  }
});

// GET all doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// GET doctor schedule
router.get('/schedule/:doctorId', async (req, res) => {
  try {
    let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.params.doctorId });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
});

// POST block date for doctor
router.post('/schedule/:doctorId/block-date', async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.params.doctorId });
    }

    const alreadyBlocked = schedule.blockedDates.some(b => 
      new Date(b.date).getTime() === new Date(date).getTime()
    );

    if (alreadyBlocked) {
      return res.status(400).json({ message: 'Date is already blocked' });
    }

    schedule.blockedDates.push({ date: new Date(date), reason });
    await schedule.save();

    res.json({ message: 'Date blocked successfully', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking date', error: error.message });
  }
});

// GET Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const appointmentCount = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'scheduled' });

    res.json({
      totalPatients: patientCount,
      totalDoctors: doctorCount,
      totalAppointments: appointmentCount,
      pendingAppointments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;
