const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Information
  appointmentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Participants
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
  
  // Appointment Details
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  
  // Type and Purpose
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'check-up', 'procedure', 'test', 'other'],
    default: 'consultation'
  },
  reason: {
    type: String,
    trim: true,
    required: true
  },
  symptoms: [{
    name: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    duration: String // e.g., '2 days', '1 week'
  }],
  
  // Payment Information
  payment: {
    consultationFee: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'insurance', null],
      default: null
    },
    transactionId: String,
    paymentDate: Date
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  cancellationReason: String,
  cancellationDate: Date,
  
  // Medical Details
  diagnosis: [{
    name: String,
    code: String, // ICD-10 code
    notes: String
  }],
  
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  
  // Additional Notes
  notes: {
    type: String,
    trim: true
  },
  
  // Reminders and Follow-up
  reminderSent: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate appointment number before saving
appointmentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `APT-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

// Indexes for better query performance
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ date: 1, startTime: 1 });
appointmentSchema.index({ status: 1 });

// Virtual for appointment duration in minutes
appointmentSchema.virtual('duration').get(function() {
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  
  const start = new Date(2000, 0, 1, startHour, startMinute);
  const end = new Date(2000, 0, 1, endHour, endMinute);
  
  return (end - start) / (1000 * 60); // Convert to minutes
});

// Static method to check slot availability
appointmentSchema.statics.isSlotAvailable = async function(doctorId, date, startTime, endTime, excludeAppointmentId = null) {
  const query = {
    doctor: doctorId,
    date: new Date(date),
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    $or: [
      // New appointment starts during an existing one
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      // New appointment ends during an existing one
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      // New appointment completely contains an existing one
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existingAppointment = await this.findOne(query);
  return !existingAppointment;
};

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  const now = new Date();
  const appointmentDateTime = new Date(
    this.date.getFullYear(),
    this.date.getMonth(),
    this.date.getDate(),
    ...this.startTime.split(':').map(Number)
  );
  
  return appointmentDateTime > now && 
         ['scheduled', 'confirmed'].includes(this.status);
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;