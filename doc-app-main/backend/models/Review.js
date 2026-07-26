const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// One review per appointment
reviewSchema.index({ appointmentId: 1 }, { unique: true });
// Optimize queries for a specific doctor's reviews
reviewSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
