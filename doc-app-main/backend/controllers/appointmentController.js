const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { doctor, date, startTime, endTime, reason } = req.body;
    
    // Check if slot is available
    const isAvailable = await Appointment.isSlotAvailable(doctor, date, startTime);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    // Prevent booking in the past (date and time)
    const now = new Date();
    const appointmentDateTime = new Date(date + 'T' + startTime);
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointment in the past. Please select a future date and time.'
      });
    }

    // Accept appointment type (in-person/video-call)
    const { type = 'in-person' } = req.body;

    // Create new appointment
    const appointment = new Appointment({
      doctor,
      patient: req.user.id,
      date: new Date(date),
      startTime,
      endTime,
      reason,
      type,
      status: 'pending'
    });

    await appointment.save();
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get all appointments for a user
// @route   GET /api/appointments
// @access  Private
exports.getUserAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [
        { patient: req.user.id },
        { doctor: req.user.id }
      ]
    })
    .populate('doctor', 'name email specialization')
    .populate('patient', 'name email')
    .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/appointments/available-slots/:doctorId/:date
// @access  Private
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    // Define all possible time slots
    const allSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', 
      '14:00', '15:00', '16:00', '17:00'
    ];

    // Get all booked appointments for the doctor on the given date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    });

    // Extract booked time slots
    const bookedSlots = bookedAppointments.map(apt => apt.startTime);

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is authorized to update this appointment
    if (appointment.doctor.toString() !== req.user.id && 
        appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};