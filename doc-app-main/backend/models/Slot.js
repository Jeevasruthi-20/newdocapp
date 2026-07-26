const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // Normalized to midnight
  startTime: { type: String, required: true }, // e.g., '09:00'
  endTime: { type: String, required: true },   // e.g., '09:20'
  isBooked: { type: Boolean, default: false },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null }
}, { timestamps: true });

// Prevent duplicate slot generation risk
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
