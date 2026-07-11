const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: true
  },
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g., '500mg'
    frequency: { type: String, required: true }, // e.g., 'Twice a day'
    duration: { type: String, required: true }, // e.g., '5 days'
    beforeAfterFood: { type: String }, // e.g., 'Before Food'
    instructions: { type: String } // e.g., 'With warm water'
  }],
  notes: {
    type: String
  },
  followUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
