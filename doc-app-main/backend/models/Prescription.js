const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, default: '' },
  duration: { type: String, default: '' },
  instructions: { type: String, default: '' },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, required: true },
  doctorSpecialization: { type: String, default: '' },
  hospitalName: { type: String, default: 'MedConnect Clinic' },
  hospitalAddress: { type: String, default: '' },
  patientName: { type: String, required: true },
  medicines: [medicineSchema],
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  consultationDate: { type: Date, default: Date.now },
  verificationId: { type: String, unique: true, required: true },
  digitalSignature: { type: String, default: 'Dr. MedConnect' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
}, { timestamps: true });

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ verificationId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
