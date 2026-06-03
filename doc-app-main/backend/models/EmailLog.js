const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String },
  type: { type: String, enum: ['welcome', 'appointment_confirmation', 'appointment_reminder_24h', 'appointment_reminder_1h', 'appointment_reminder_same_day', 'appointment_cancellation'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'type' }, // e.g., appointment id
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String }
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
