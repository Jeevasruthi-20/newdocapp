// server/routes/adminRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const DoctorSchedule = require('../models/DoctorSchedule');
const Prescription = require('../models/Prescription');
const AuditLog = require('../models/AuditLog');
const { adminAuth } = require('../middleware/adminMiddleware');

const router = express.Router();
router.use(adminAuth);

// GET all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error: error.message });
  }
});

// GET all appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// UPDATE appointment status
router.put('/appointments/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, rejectionReason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name')
      .session(session);
    
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const oldStatus = appointment.status;
    
    if (oldStatus !== status) {
      appointment.status = status;
      if (status === 'cancelled' && rejectionReason) {
        appointment.rejectionReason = rejectionReason;
        appointment.cancellationReason = rejectionReason;
      }
      await appointment.save({ session });
      
      if (status === 'cancelled') {
        const Slot = require('../models/Slot');
        await Slot.findOneAndUpdate(
          { appointment: appointment._id },
          { isBooked: false, appointment: null },
          { session }
        );
      }

      await AuditLog.create([{
        entityType: 'appointment',
        entityId: appointment._id,
        action: 'STATUS_CHANGE',
        performedByAdmin: req.user._id,
        attributedDoctor: appointment.doctor._id,
        oldValue: oldStatus,
        newValue: status
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Send emails asynchronously
    if (oldStatus !== status) {
      const emailService = require('../services/emailService');
      const { formatDoctorName } = require('../utils/formatters');
      const p = appointment.patient;
      const d = appointment.doctor;
      const Notification = require('../models/Notification');
      if (status === 'confirmed') {
        emailService.sendBookingConfirmedEmail(p.email, p.name, d.name, appointment.date, appointment.startTime, appointment.consultationType, appointment.appointmentNumber).catch(e => console.error(e));
        Notification.create({
          receiverId: p._id,
          receiverRole: 'patient',
          message: `The admin has approved your appointment with ${formatDoctorName(d.name)} on ${new Date(appointment.date).toDateString()}.`
        }).catch(e => console.error(e));
      } else if (status === 'cancelled') {
        emailService.sendBookingCancelledEmail(p.email, p.name, d.name, appointment.date, appointment.startTime, appointment.rejectionReason).catch(e => console.error(e));
        Notification.create({
          receiverId: p._id,
          receiverRole: 'patient',
          message: `Your appointment with ${formatDoctorName(d.name)} on ${new Date(appointment.date).toDateString()} has been cancelled by the admin.`
        }).catch(e => console.error(e));
      }
    }

    res.json(appointment);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// DELETE patient account
router.delete('/patient/:id', async (req, res) => {
  try {
    const patient = await User.findOneAndDelete({ _id: req.params.id, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting patient', error: error.message });
  }
});

// GET all doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// POST a new doctor (Admin)
router.post('/doctors', async (req, res) => {
  try {
    const { name, email, specialty, fee } = req.body;
    if (!name || !email || !specialty) {
      return res.status(400).json({ message: 'Name, email, and specialty are required.' });
    }
    
    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email is already registered.' });

    const bcrypt = require('bcryptjs');
    const doctor = await User.create({
      name,
      email,
      role: 'doctor',
      isActive: true,
      password: await bcrypt.hash('doctor123', 10), // Random default
      phone: '0000000000', // Required field
      dob: new Date('1980-01-01'), // Required field
      gender: 'other', // Required field
      doctorProfile: {
        specialization: specialty,
        consultationFee: fee || 500
      }
    });

    // Create a default schedule for them
    await DoctorSchedule.create({
      doctor: doctor._id,
      weeklyHours: {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '10:00', end: '14:00', isWorking: true },
        sunday: { start: '', end: '', isWorking: false }
      },
      slotDuration: 30,
      bufferTime: 0
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error creating doctor', error: error.message });
  }
});

// PUT update an existing doctor (Admin)
router.put('/doctors/:id', async (req, res) => {
  try {
    const { name, email, specialty, fee } = req.body;
    
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (name) doctor.name = name;
    if (email) doctor.email = email;
    if (specialty) doctor.doctorProfile.specialization = specialty;
    if (fee !== undefined) doctor.doctorProfile.consultationFee = fee;

    await doctor.save();
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
});

// PATCH deactivate / reactivate a doctor (Admin soft-delete)
router.patch('/doctors/:id/deactivate', async (req, res) => {
  try {
    const { isActive } = req.body;
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isActive: isActive },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor status', error: error.message });
  }
});

// GET doctor schedule
router.get('/schedule/:doctorId', async (req, res) => {
  try {
    let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.params.doctorId });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error: error.message });
  }
});

// POST block date for doctor
router.post('/schedule/:doctorId/block-date', async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    let schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.params.doctorId });
    }

    const alreadyBlocked = schedule.blockedDates.some(b => 
      new Date(b.date).getTime() === new Date(date).getTime()
    );

    if (alreadyBlocked) {
      return res.status(400).json({ message: 'Date is already blocked' });
    }

    schedule.blockedDates.push({ date: new Date(date), reason });
    await schedule.save();

    res.json({ message: 'Date blocked successfully', schedule });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking date', error: error.message });
  }
});

// POST generate slots for a doctor
router.post('/schedule/:doctorId/generate-slots', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (start > end) return res.status(400).json({ message: 'Invalid date range' });

    const DoctorSchedule = require('../models/DoctorSchedule');
    const Slot = require('../models/Slot');
    const Appointment = require('../models/Appointment');
    
    const schedule = await DoctorSchedule.findOne({ doctor: req.params.doctorId });
    if (!schedule) {
      return res.status(404).json({ message: 'Doctor schedule not found' });
    }

    const doctor = await User.findById(req.params.doctorId);
    if (doctor && doctor.isActive === false) {
      return res.status(400).json({ message: 'Cannot generate slots for an inactive doctor' });
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let generatedCount = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);
      current.setHours(0,0,0,0);
      
      // Skip blocked dates
      const isBlocked = schedule.blockedDates.some(b => {
        const bDate = new Date(b.date);
        bDate.setHours(0,0,0,0);
        return bDate.getTime() === current.getTime();
      });
      if (isBlocked) continue;

      const dayName = days[current.getDay()];
      const dayHours = schedule.weeklyHours && schedule.weeklyHours[dayName];
      if (!dayHours || !dayHours.isWorking || !dayHours.start || !dayHours.end) continue;

      let [h, m] = dayHours.start.split(':').map(Number);
      let endMins = dayHours.end.split(':');
      const endTotalMins = Number(endMins[0]) * 60 + Number(endMins[1]);
      const duration = schedule.slotDuration || 20;
      const buffer = schedule.bufferTime || 5;

      while (h * 60 + m + duration <= endTotalMins) {
        const startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotEndMins = h * 60 + m + duration;
        const endTimeStr = `${String(Math.floor(slotEndMins / 60)).padStart(2, '0')}:${String(slotEndMins % 60).padStart(2, '0')}`;

        // Check if an appointment already exists for this exact time
        const existingApt = await Appointment.findOne({ 
          doctor: req.params.doctorId, 
          date: current, 
          startTime: startTimeStr,
          status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
        });

        await Slot.findOneAndUpdate(
          { doctor: req.params.doctorId, date: current, startTime: startTimeStr },
          {
            $setOnInsert: { endTime: endTimeStr },
            $set: { 
              isBooked: !!existingApt,
              appointment: existingApt ? existingApt._id : null
            }
          },
          { upsert: true, new: true }
        );
        generatedCount++;

        // Increment for next slot
        const nextTotal = slotEndMins + buffer;
        h = Math.floor(nextTotal / 60);
        m = nextTotal % 60;
      }
    }

    res.json({ message: `Successfully generated/updated ${generatedCount} slots` });
  } catch (error) {
    res.status(500).json({ message: 'Error generating slots', error: error.message });
  }
});


// PUT report delay for doctor
router.put('/schedule/:doctorId/delay', async (req, res) => {
  try {
    const { delayMinutes, date, fromTime } = req.body;
    
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: req.params.doctorId,
      date: { $gte: targetDate, $lt: nextDay },
      status: { $in: ['scheduled', 'confirmed'] },
      startTime: { $gte: fromTime }
    }).sort({ startTime: 1 }).populate('patient', 'name email').populate('doctor', 'name');

    const updatedAppointments = [];
    const emailPromises = [];
    const emailService = require('../services/emailService');

    for (let apt of appointments) {
      apt.delayMinutes = delayMinutes;
      const [h, m] = apt.startTime.split(':').map(Number);
      const totalMins = h * 60 + m + Number(delayMinutes);
      const expectedH = Math.floor(totalMins / 60) % 24;
      const expectedM = totalMins % 60;
      apt.expectedStartTime = `${String(expectedH).padStart(2, '0')}:${String(expectedM).padStart(2, '0')}`;
      apt.status = 'delayed';
      
      await apt.save();
      updatedAppointments.push(apt);

      if (apt.patient?.email) {
        emailPromises.push(
          emailService.sendDelayEmail(apt.patient.email, apt.patient.name, apt.doctor?.name, apt.startTime, apt.expectedStartTime)
        );
      }
    }

    Promise.allSettled(emailPromises);

    // Shift unbooked slots
    const Slot = require('../models/Slot');
    const unbookedSlots = await Slot.find({
      doctor: req.params.doctorId,
      date: targetDate,
      isBooked: false,
      startTime: { $gte: fromTime }
    });

    for (let slot of unbookedSlots) {
      const shiftMins = Number(delayMinutes);
      
      const [hStart, mStart] = slot.startTime.split(':').map(Number);
      const totalStartMins = hStart * 60 + mStart + shiftMins;
      const expectedStartH = Math.floor(totalStartMins / 60) % 24;
      const expectedStartM = totalStartMins % 60;
      slot.startTime = `${String(expectedStartH).padStart(2, '0')}:${String(expectedStartM).padStart(2, '0')}`;

      const [hEnd, mEnd] = slot.endTime.split(':').map(Number);
      const totalEndMins = hEnd * 60 + mEnd + shiftMins;
      const expectedEndH = Math.floor(totalEndMins / 60) % 24;
      const expectedEndM = totalEndMins % 60;
      slot.endTime = `${String(expectedEndH).padStart(2, '0')}:${String(expectedEndM).padStart(2, '0')}`;
      
      await slot.save();
    }

    res.json({ message: `Updated delay for ${updatedAppointments.length} appointments and shifted ${unbookedSlots.length} unbooked slots`, appointments: updatedAppointments });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting delay', error: error.message });
  }
});

// GET Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const appointmentCount = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });
    const totalPrescriptions = await Prescription.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    const allSchedules = await DoctorSchedule.find();
    const totalBlockedDates = allSchedules.reduce((acc, curr) => acc + (curr.blockedDates ? curr.blockedDates.length : 0), 0);

    res.json({
      totalPatients: patientCount,
      totalDoctors: doctorCount,
      totalAppointments: appointmentCount,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalPrescriptions,
      todayAppointments,
      totalBlockedDates
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// POST /api/admin/prescriptions
router.post('/prescriptions', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { patientId, appointmentId, doctorId, diagnosis, medications, notes, followUpDate } = req.body;

    if (!patientId || !appointmentId || !doctorId || !diagnosis || !medications || medications.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const prescription = new Prescription({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId,
      diagnosis,
      medications,
      notes,
      followUpDate: followUpDate || undefined
    });
    await prescription.save({ session });

    // Mark appointment as completed
    const appointment = await Appointment.findById(appointmentId).session(session);
    if (appointment && appointment.status !== 'completed') {
      const oldStatus = appointment.status;
      appointment.status = 'completed';
      await appointment.save({ session });
      
      await AuditLog.create([{
        entityType: 'appointment',
        entityId: appointment._id,
        action: 'STATUS_CHANGE',
        performedByAdmin: req.user._id,
        attributedDoctor: appointment.doctor,
        oldValue: oldStatus,
        newValue: 'completed'
      }], { session });
    }

    await AuditLog.create([{
      entityType: 'prescription',
      entityId: prescription._id,
      action: 'PRESCRIPTION_CREATED',
      performedByAdmin: req.user._id,
      attributedDoctor: doctorId,
      oldValue: null,
      newValue: { diagnosis, medicineCount: medications.length }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Trigger email async
    try {
      const p = await User.findById(patientId);
      const d = await User.findById(doctorId);
      const emailService = require('../services/emailService');
      emailService.sendPrescriptionReadyEmail(p.email, p.name, d.name, appointment.date, diagnosis).catch(e => console.error(e));
    } catch(err) {
      console.error(err);
    }

    res.status(201).json(prescription);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error creating prescription', error: error.message });
  }
});

// GET Audit Logs
router.get('/audit-logs/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Fetch logs for the specific entity
    // Also, if asking for appointment, let's fetch associated prescription logs too
    let query = { entityType, entityId };
    
    if (entityType === 'appointment') {
      const prescription = await Prescription.findOne({ appointment: entityId });
      if (prescription) {
        query = {
          $or: [
            { entityType: 'appointment', entityId: entityId },
            { entityType: 'prescription', entityId: prescription._id }
          ]
        };
      }
    }

    const logs = await AuditLog.find(query)
      .populate('performedByAdmin', 'name email')
      .populate('attributedDoctor', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
});

// GET Notifications count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const AdminNotification = require('../models/AdminNotification');
    const count = await AdminNotification.countDocuments({ isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications count', error: error.message });
  }
});

// PUT Mark Notifications Read
router.put('/notifications/mark-read', async (req, res) => {
  try {
    const AdminNotification = require('../models/AdminNotification');
    await AdminNotification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// Analytics Endpoints

router.get('/analytics/appointments-over-time', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    const days = range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const format = days <= 30 ? '%Y-%m-%d' : '%Y-W%U';

    const data = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { 
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

router.get('/analytics/status-breakdown', async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

router.get('/analytics/top-specialties', async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorData'
        }
      },
      { $unwind: '$doctorData' },
      {
        $group: {
          _id: '$doctorData.doctorProfile.specialization',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { specialty: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

router.get('/analytics/doctor-utilization', async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorData'
        }
      },
      { $unwind: '$doctorData' },
      {
        $group: {
          _id: '$doctorData.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { doctorName: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;
