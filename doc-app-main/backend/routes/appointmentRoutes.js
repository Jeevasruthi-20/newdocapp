const express = require('express');
const EmailLog = require('../models/EmailLog');
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const normalizeTime = (time) => {
  if (!time) return null;
  const t = String(time).trim();
  // Already 24h HH:MM
  if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) {
    const [h, m] = t.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }
  // 12h e.g. 02:30 PM
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return t;
};

const getOrCreateDemoDoctor = async () => {
  let doctor = await User.findOne({ role: 'doctor' });
  if (!doctor) {
    const bcrypt = require('bcryptjs');
    doctor = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@medconnect.com',
      phone: '9876543210',
      dob: new Date('1985-06-15'),
      gender: 'female',
      password: await bcrypt.hash('doctor123', 10),
      role: 'doctor',
      doctorProfile: {
        specialization: 'General Physician',
        consultationFee: 500,
      },
    });
  }
  return doctor;
};

router.get('/my', async (req, res) => {
  try {
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user._id } 
      : { patient: req.user._id };
      
    const appointments = await Appointment.find(query)
      .populate('doctor', 'name doctorProfile')
      .populate('patient', 'name email dob phone')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, reason, appointmentType, type } = req.body;

    if (!date || !reason?.trim()) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }

    const start = normalizeTime(startTime) || '10:00';
    let end = normalizeTime(endTime) || '10:30';

    // Ensure end is after start
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      const endMins = sh * 60 + sm + 30;
      end = `${String(Math.floor(endMins / 60) % 24).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
    }

    let resolvedDoctorId = doctorId;
    if (doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) {
      resolvedDoctorId = null;
    }
    if (!resolvedDoctorId) {
      const doctor = await getOrCreateDemoDoctor();
      resolvedDoctorId = doctor._id;
    }

    const count = await Appointment.countDocuments();
    const appointmentNumber = `APT-${String(count + 1).padStart(6, '0')}`;

    const meetLink = type === 'video' ? `https://meet.jit.si/medconnect-${Math.random().toString(36).substring(2, 10)}` : undefined;

    const appointment = await Appointment.create({
      appointmentNumber,
      patient: req.user._id,
      doctor: resolvedDoctorId,
      date: new Date(date),
      startTime: start,
      endTime: end,
      reason: reason.trim(),
      appointmentType: appointmentType || 'consultation',
      type: type || 'in-person',
      meetLink,
      status: 'scheduled',
      payment: { consultationFee: 500, paymentStatus: 'pending' },
      createdBy: req.user._id,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name doctorProfile');

    // Send appointment confirmation email (non-blocking)
    try {
      const patient = await User.findById(req.user._id);
      const doctorName = populated.doctor?.name || '';
      const html = `
        <h2>Appointment Confirmation</h2>
        <p>Dear ${patient.name},</p>
        <p>Your appointment with Dr. ${doctorName} is scheduled for <strong>${populated.date.toDateString()}</strong> at <strong>${populated.startTime}</strong>.</p>
        <p>Appointment ID: ${populated._id}</p>
        <p>Thank you for using MedConnect.</p>
      `;
      await sendEmail({ email: patient.email, subject: 'MedConnect Appointment Confirmation', message: html });
      await EmailLog.create({
        to: patient.email,
        subject: 'MedConnect Appointment Confirmation',
        html,
        type: 'appointment_confirmation',
        referenceId: populated._id,
        status: 'sent',
      });
    } catch (emailErr) {
      console.error('[Booking] Email/log error (non-fatal):', emailErr.message);
    }
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create appointment error:', error);
    const message = error.name === 'ValidationError'
      ? Object.values(error.errors).map((e) => e.message).join(', ')
      : error.message;
    res.status(500).json({ message: message || 'Error creating appointment' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { date, startTime, reason } = req.body;
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot edit a confirmed appointment' });
    }
    if (date) appointment.date = date;
    if (startTime) appointment.startTime = normalizeTime(startTime) || startTime;
    if (reason) appointment.reason = reason;
    await appointment.save();
    res.json({ message: 'Appointment updated', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

/* ─── GET /api/appointments/available-slots ─────────────────────────────────
   Returns array of already-taken startTimes (24h) for a doctor on a date.
   Excludes a specific appointment ID (used when rescheduling own appt).
─────────────────────────────────────────────────────────────────────────── */
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date, excludeId } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'doctorId and date are required' });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    // 1. Check DoctorSchedule for blocked dates or non-working days
    const DoctorSchedule = require('../models/DoctorSchedule');
    const schedule = await DoctorSchedule.findOne({ doctor: doctorId });
    
    let allSlotsBlocked = false;
    let blockedTimes = [];

    if (schedule) {
      // Check if entire date is blocked
      const isBlockedDate = schedule.blockedDates.some(b => {
        const bDate = new Date(b.date);
        bDate.setHours(0, 0, 0, 0);
        return bDate.getTime() === queryDate.getTime();
      });

      if (isBlockedDate) {
        allSlotsBlocked = true;
      } else {
        // Check weekly hours
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[queryDate.getDay()];
        if (schedule.weeklyHours && schedule.weeklyHours[dayName] && schedule.weeklyHours[dayName].isWorking === false) {
          allSlotsBlocked = true;
        }

        // Check specific blocked time slots
        const dailyBlocks = schedule.blockedTimeSlots.filter(b => {
          const bDate = new Date(b.date);
          bDate.setHours(0, 0, 0, 0);
          return bDate.getTime() === queryDate.getTime();
        });

        dailyBlocks.forEach(block => {
          // Add all 30m intervals between startTime and endTime to blockedTimes
          // Assuming HH:MM format
          let current = block.startTime;
          while (current < block.endTime) {
            blockedTimes.push(current);
            // Add 30 mins
            let [h, m] = current.split(':').map(Number);
            m += 30;
            if (m >= 60) {
              h += 1;
              m -= 60;
            }
            current = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          }
        });
      }
    }

    if (allSlotsBlocked) {
      // Return all possible slots as taken
      const allSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
      ];
      return res.json(allSlots);
    }

    const query = {
      doctor: doctorId,
      date: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
    };
    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      query._id = { $ne: excludeId };
    }

    const booked = await Appointment.find(query).select('startTime');
    let takenTimes = booked.map((a) => a.startTime);
    takenTimes = [...new Set([...takenTimes, ...blockedTimes])];

    res.json(takenTimes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available slots', error: error.message });
  }
});

/* ─── PUT /api/appointments/:id/reschedule ───────────────────────────────────
   Reschedule a pending appointment:
   - Only allowed if status is 'scheduled' (pending), not confirmed
   - Validates slot availability (no double-booking)
   - Keeps status as 'scheduled'
   - Sends email notifications to patient and doctor
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'date, startTime, and endTime are required' });
    }

    // Find appointment belonging to this patient
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    }).populate('doctor', 'name email').populate('patient', 'name email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Block rescheduling if confirmed
    if (appointment.status === 'confirmed') {
      return res.status(400).json({
        message: 'Rescheduling is not allowed after the doctor has confirmed your appointment.',
      });
    }

    // Block rescheduling of cancelled appointments
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a cancelled appointment.' });
    }

    // Check past date
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({ message: 'Cannot reschedule to a past date.' });
    }

    // Check slot availability (exclude current appointment itself)
    const isAvailable = await Appointment.isSlotAvailable(
      appointment.doctor._id,
      date,
      startTime,
      endTime,
      appointment._id
    );

    if (!isAvailable) {
      return res.status(409).json({
        message: 'That time slot is already booked. Please choose a different time.',
      });
    }

    // Save old values for email
    const oldDate      = appointment.date;
    const oldStartTime = appointment.startTime;

    // Update the appointment
    appointment.date      = new Date(date);
    appointment.startTime = startTime;
    appointment.endTime   = endTime;
    appointment.status    = 'scheduled'; // keep as pending
    appointment.updatedBy = req.user._id;
    await appointment.save();

    // ── Email to Patient ──────────────────────────────────────────────────
    const patientName = appointment.patient?.name || 'Patient';
    const doctorName  = appointment.doctor?.name  || 'Your Doctor';
    const newDateStr  = new Date(date).toDateString();
    const oldDateStr  = new Date(oldDate).toDateString();

    const patientHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:linear-gradient(135deg,#7c3aed,#0069c0);padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">📅 Appointment Rescheduled</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been rescheduled.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f8fafc">
              <td style="padding:10px;font-weight:bold;color:#64748b">Previous Date</td>
              <td style="padding:10px">${oldDateStr} at ${oldStartTime}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;color:#64748b">New Date</td>
              <td style="padding:10px;color:#16a34a"><strong>${newDateStr} at ${startTime}</strong></td>
            </tr>
            <tr style="background:#f8fafc">
              <td style="padding:10px;font-weight:bold;color:#64748b">Status</td>
              <td style="padding:10px">⏳ Pending Doctor Confirmation</td>
            </tr>
          </table>
          <p style="color:#64748b;font-size:0.9rem">The appointment status remains <em>Pending</em> until the doctor confirms the new time.</p>
          <p>Thank you for using <strong>MedConnect</strong>.</p>
        </div>
      </div>
    `;

    // ── Email to Doctor ───────────────────────────────────────────────────
    const doctorHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:linear-gradient(135deg,#0069c0,#0ea5e9);padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">🔔 Patient Rescheduled an Appointment</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
          <p>Your patient <strong>${patientName}</strong> has rescheduled their appointment.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f8fafc">
              <td style="padding:10px;font-weight:bold;color:#64748b">Patient</td>
              <td style="padding:10px">${patientName}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold;color:#64748b">Previous Slot</td>
              <td style="padding:10px">${oldDateStr} at ${oldStartTime}</td>
            </tr>
            <tr style="background:#f8fafc">
              <td style="padding:10px;font-weight:bold;color:#64748b">New Slot</td>
              <td style="padding:10px;color:#16a34a"><strong>${newDateStr} at ${startTime}</strong></td>
            </tr>
          </table>
          <p style="color:#64748b;font-size:0.9rem">Please log in to the MedConnect admin panel to review and confirm the new appointment time.</p>
        </div>
      </div>
    `;

    // Send emails (non-blocking — don't fail the response if email fails)
    const emailPromises = [];
    if (appointment.patient?.email) {
      emailPromises.push(
        sendEmail({
          email: appointment.patient.email,
          subject: '📅 MedConnect — Your Appointment Has Been Rescheduled',
          message: patientHtml,
        }).catch((e) => console.error('Patient email error:', e))
      );
    }
    if (appointment.doctor?.email) {
      emailPromises.push(
        sendEmail({
          email: appointment.doctor.email,
          subject: `🔔 MedConnect — ${patientName} Rescheduled Their Appointment`,
          message: doctorHtml,
        }).catch((e) => console.error('Doctor email error:', e))
      );
    }
    await Promise.allSettled(emailPromises);

    // Re-populate for response
    const updated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name doctorProfile')
      .populate('patient', 'name email');

    res.json({ message: 'Appointment rescheduled successfully', appointment: updated });
  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ message: error.message || 'Error rescheduling appointment' });
  }
});

/* ─── PUT /api/appointments/doctor-delay ────────────────────────────────────
   Doctor reports a delay. Updates delayMinutes and cascades expectedStartTime
   for all subsequent appointments for that doctor on that day.
─────────────────────────────────────────────────────────────────────────── */
router.put('/doctor-delay', async (req, res) => {
  try {
    const { delayMinutes, date, fromTime } = req.body;
    
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can report delays' });
    }

    const doctorId = req.user._id;
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find all appointments from this time onwards on this day
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: targetDate, $lt: nextDay },
      status: { $in: ['scheduled', 'confirmed'] },
      startTime: { $gte: fromTime }
    }).sort({ startTime: 1 });

    const updatedAppointments = [];

    for (let apt of appointments) {
      apt.delayMinutes = delayMinutes;
      
      // Calculate expectedStartTime
      const [h, m] = apt.startTime.split(':').map(Number);
      const totalMins = h * 60 + m + Number(delayMinutes);
      const expectedH = Math.floor(totalMins / 60) % 24;
      const expectedM = totalMins % 60;
      apt.expectedStartTime = `${String(expectedH).padStart(2, '0')}:${String(expectedM).padStart(2, '0')}`;
      
      await apt.save();
      updatedAppointments.push(apt);

      // Email Patient
      if (apt.patient) {
        const patient = await User.findById(apt.patient);
        if (patient && patient.email) {
          const html = `
            <h2>Appointment Delay Notice</h2>
            <p>Dear ${patient.name},</p>
            <p>Your doctor is currently running behind schedule.</p>
            <p>Your expected consultation time has been updated from <strong>${apt.startTime}</strong> to <strong>${apt.expectedStartTime}</strong>.</p>
            <p>We apologize for the inconvenience.</p>
          `;
          sendEmail({
            email: patient.email,
            subject: 'MedConnect - Appointment Delay Update',
            message: html
          }).catch(console.error);
        }
      }
    }

    res.json({ message: `Updated delay for ${updatedAppointments.length} appointments`, appointments: updatedAppointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/check-in ────────────────────────────────────
   Patient checks in when arriving at the clinic.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/check-in', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    if (appointment.checkInTime) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    // Assign a queue number for the day
    const targetDate = new Date(appointment.date);
    targetDate.setHours(0,0,0,0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await Appointment.countDocuments({
      doctor: appointment.doctor,
      date: { $gte: targetDate, $lt: nextDay },
      checkInTime: { $exists: true }
    });

    appointment.checkInTime = new Date();
    appointment.queueNumber = count + 1;
    await appointment.save();

    res.json({ message: 'Checked in successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/accept-delay ────────────────────────────────
   Patient accepts the new delayed time.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/accept-delay', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.delayAccepted = true;
    await appointment.save();

    res.json({ message: 'Delay accepted. See you at the updated time!', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/reschedule-from-delay ───────────────────────
   Patient requests to reschedule when doctor is running late.
   Marks appointment as 'rescheduled' so admin can follow up.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/reschedule-from-delay', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id })
      .populate('doctor', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = 'rescheduled';
    appointment.cancellationReason = 'Patient requested reschedule due to doctor delay';
    await appointment.save();

    // Notify patient
    try {
      const patient = await User.findById(req.user._id);
      await sendEmail({
        email: patient.email,
        subject: 'MedConnect - Reschedule Requested',
        message: `<h2>Reschedule Request Confirmed</h2><p>Dear ${patient.name}, your reschedule request for the appointment with Dr. ${appointment.doctor?.name} has been noted. Our team will contact you shortly to find a new time.</p>`,
      });
    } catch (emailErr) {
      console.error('[Reschedule] Email error (non-fatal):', emailErr.message);
    }

    res.json({ message: 'Reschedule request submitted. Our team will contact you.', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── GET /api/appointments/queue/:doctorId ─────────────────────────────────
   Get live queue details for a specific doctor today.
─────────────────────────────────────────────────────────────────────────── */
router.get('/queue/:doctorId', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkedInAppointments = await Appointment.find({
      doctor: req.params.doctorId,
      date: { $gte: today, $lt: tomorrow },
      checkInTime: { $exists: true },
      status: { $nin: ['completed', 'cancelled', 'no-show'] }
    }).sort({ queueNumber: 1 }).populate('patient', 'name');

    res.json({
      totalWaiting: checkedInAppointments.length,
      currentPatient: checkedInAppointments.length > 0 ? checkedInAppointments[0] : null,
      queue: checkedInAppointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/prescription ────────────────────────────────
   Doctor saves a prescription for the appointment.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/prescription', async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can upload prescriptions' });
    }

    const { prescription } = req.body;
    if (!prescription) {
      return res.status(400).json({ message: 'Prescription text is required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.prescription = prescription;
    appointment.status = 'completed'; // auto mark as completed when prescribed
    await appointment.save();

    res.json({ message: 'Prescription saved successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── DOCTOR SCHEDULE ENDPOINTS ───────────────────────────────────────────── */

router.get('/schedule', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Forbidden' });
    let schedule = await DoctorSchedule.findOne({ doctor: req.user._id });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.user._id });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/schedule/block-date', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Forbidden' });
    const { date, reason } = req.body;
    let schedule = await DoctorSchedule.findOne({ doctor: req.user._id });
    if (!schedule) {
      schedule = await DoctorSchedule.create({ doctor: req.user._id });
    }
    schedule.blockedDates.push({ date: new Date(date), reason });
    await schedule.save();
    res.json({ message: 'Date blocked', schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/schedule/block-date/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Forbidden' });
    let schedule = await DoctorSchedule.findOne({ doctor: req.user._id });
    if (schedule) {
      schedule.blockedDates = schedule.blockedDates.filter(bd => bd._id.toString() !== req.params.id);
      await schedule.save();
    }
    res.json({ message: 'Block removed', schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/confirm ─────────────────────────────────────
   Doctor confirms the appointment.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/confirm', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Authorization check: Only assigned doctor can confirm
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm this appointment' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    res.json({ message: 'Appointment confirmed successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/complete ────────────────────────────────────
   Doctor completes the appointment.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/complete', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Authorization check
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this appointment' });
    }

    appointment.status = 'completed';
    appointment.payment.paymentStatus = 'paid'; // Automatically mark payment as paid upon completion
    await appointment.save();

    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ─── PUT /api/appointments/:id/cancel ──────────────────────────────────────
   Doctor cancels the appointment.
─────────────────────────────────────────────────────────────────────────── */
router.put('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Authorization check
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = 'Cancelled by doctor';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
