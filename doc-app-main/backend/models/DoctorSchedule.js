const mongoose = require('mongoose');

const DoctorScheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedDates: [{
    date: { type: Date, required: true },
    reason: { type: String }
  }],
  blockedTimeSlots: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    reason: { type: String }
  }],
  // Standard weekly hours
  weeklyHours: {
    monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
    sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
  }
}, { timestamps: true });

module.exports = mongoose.model('DoctorSchedule', DoctorScheduleSchema);
