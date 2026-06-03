const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { generatePrescriptionPdf } = require('../utils/prescriptionPdf');

router.use(protect);

// Patient: list own prescriptions
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user._id })
      .sort({ consultationDate: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
});

// Get single prescription
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch prescription' });
  }
});

// Doctor/Admin: create prescription for patient
router.post('/', async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only doctors can create prescriptions' });
    }

    const {
      patientId, doctorName, doctorSpecialization, hospitalName, hospitalAddress,
      medicines, diagnosis, notes, consultationDate, appointmentId,
    } = req.body;

    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      doctorName: doctorName || req.user.name,
      doctorSpecialization: doctorSpecialization || req.user.doctorProfile?.specialization || '',
      hospitalName: hospitalName || req.user.doctorProfile?.hospitalAffiliation?.name || 'MedConnect Clinic',
      hospitalAddress: hospitalAddress || req.user.doctorProfile?.hospitalAffiliation?.address || '',
      patientName: patient.name,
      medicines,
      diagnosis,
      notes,
      consultationDate: consultationDate || new Date(),
      verificationId: `MC-RX-${uuidv4().split('-')[0].toUpperCase()}`,
      digitalSignature: `Dr. ${doctorName || req.user.name}`,
      appointment: appointmentId,
    });

    res.status(201).json(prescription);
  } catch (err) {
    console.error('Create prescription error:', err);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
});

// Download PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const pdfBuffer = await generatePrescriptionPdf(
      prescription,
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription.verificationId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// Public verification (no auth)
module.exports = router;
