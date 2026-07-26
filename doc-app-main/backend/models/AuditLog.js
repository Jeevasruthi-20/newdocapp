const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    required: true,
    enum: ['appointment', 'prescription']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType' // Dynamically references Appointment or Prescription
  },
  action: {
    type: String,
    required: true,
    // e.g., 'STATUS_CHANGE', 'PRESCRIPTION_CREATED'
  },
  performedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The admin who clicked the button
  },
  attributedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional to prevent edge-case failures if a doctor is unassigned
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null // e.g., 'pending'
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null // Structured object. For status: 'confirmed'. For prescription: { diagnosis: 'Flu', medicineCount: 3 }
  }
}, { timestamps: true });

// Explicit compound index for efficient chronological querying per entity
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
