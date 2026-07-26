const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/prescriptions/my
// Get all prescriptions for the logged-in patient or doctor
router.get('/my', async (req, res) => {
  try {
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user._id } 
      : { patient: req.user._id };

    const prescriptions = await Prescription.find(query)
      .populate('doctor', 'name doctorProfile')
      .populate('patient', 'name')
      .populate('appointment', 'date type')
      .sort({ date: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/prescriptions
// Doctor or Admin creates a new prescription
router.post('/', async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only doctors or admins can write prescriptions' });
    }

    const { patientId, appointmentId, medications, notes } = req.body;

    if (!patientId || !appointmentId || !medications || medications.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify appointment belongs to this doctor if user is a doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this appointment' });
    }

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user.role === 'doctor' ? req.user._id : appointment.doctor,
      appointment: appointmentId,
      diagnosis: req.body.diagnosis,
      medications,
      notes,
      followUpDate: req.body.followUpDate
    });

    if (appointment.status !== 'completed') {
      appointment.status = 'completed';
      await appointment.save();
    }

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/prescriptions/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctor', 'name doctorProfile')
      .populate('patient', 'name email dob phone')
      .populate('appointment', 'date type reason');
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
