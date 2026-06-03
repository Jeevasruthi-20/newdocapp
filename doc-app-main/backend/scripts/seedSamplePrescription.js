/**
 * Creates a sample prescription for the first patient user.
 * Run after seedDoctor.js: node scripts/seedSamplePrescription.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Prescription = require('../models/Prescription');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const patient = await User.findOne({ role: 'patient' });
  const doctor = await User.findOne({ role: 'doctor' });
  if (!patient) {
    console.log('No patient found. Sign up a patient account first.');
    process.exit(0);
  }
  const existing = await Prescription.findOne({ patient: patient._id });
  if (existing) {
    console.log('Sample prescription already exists:', existing.verificationId);
    process.exit(0);
  }
  const rx = await Prescription.create({
    patient: patient._id,
    doctor: doctor?._id,
    doctorName: doctor?.name || 'Dr. Priya Sharma',
    doctorSpecialization: 'Cardiology',
    hospitalName: 'MedConnect Heart Center',
    hospitalAddress: 'Chennai, India',
    patientName: patient.name,
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', instructions: 'After meals' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', instructions: 'Morning' },
    ],
    diagnosis: 'Type 2 Diabetes with hypertension',
    consultationDate: new Date(),
    verificationId: `MC-RX-${uuidv4().split('-')[0].toUpperCase()}`,
    digitalSignature: 'Dr. Priya Sharma',
  });
  console.log('✅ Sample prescription created:', rx.verificationId);
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
