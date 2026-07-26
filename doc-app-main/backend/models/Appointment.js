const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Basic Information
  appointmentNumber: {
    type: String,
    unique: true,
    index: true,
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
  type: {
    type: String,
    enum: ['in-person', 'video'],
    default: 'in-person'
  },
  consultationType: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
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
  
  // Telemedicine & Prescriptions
  meetLink: String,
  prescription: String,

  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'in-progress', 'delayed'],
    default: 'pending'
  },
  
  // Automations
  /** @deprecated Use reminder24hSent and reminder1hSent instead */
  reminderSent: { type: Boolean, default: false },
  reminder24hSent: { type: Boolean, default: false },
  reminder1hSent: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  cancellationReason: String,
  cancellationDate: Date,
  
  // Delay Management & Queue
  delayMinutes: {
    type: Number,
    default: 0
  },
  expectedStartTime: {
    type: String // will default to startTime if no delay
  },
  checkInTime: Date,
  queueNumber: Number,
  isEmergency: {
    type: Boolean,
    default: false
  },
  delayAccepted: {
    type: Boolean,
    default: false
  },
  
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

// Generate appointment number before validation/save
const assignAppointmentNumber = async function () {
  if (this.isNew && !this.appointmentNumber) {
    const count = await this.constructor.countDocuments();
    this.appointmentNumber = `APT-${(count + 1).toString().padStart(6, '0')}`;
  }
  if (!this.expectedStartTime) {
    this.expectedStartTime = this.startTime;
  }
};

appointmentSchema.pre('validate', assignAppointmentNumber);
appointmentSchema.pre('save', assignAppointmentNumber);

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