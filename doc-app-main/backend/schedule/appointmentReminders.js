// backend/schedule/appointmentReminders.js
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const EmailLog = require('../models/EmailLog');

// Helper to format date+time to JavaScript Date
function combineDateTime(date, time) {
  const [hour, minute] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function sendReminder(appointment, type) {
  const patient = await User.findById(appointment.patient);
  if (!patient) return;
  const html = `
    <h2>Appointment ${type.replace('_', ' ')}</h2>
    <p>Dear ${patient.name},</p>
    <p>Your appointment with Dr. ${appointment.doctorName || 'your doctor'} is scheduled for <strong>${appointment.date.toDateString()}</strong> at <strong>${appointment.startTime}</strong>.</p>
    <p>Appointment ID: ${appointment._id}</p>
    <p>Thank you for using MedConnect.</p>
  `;
  await sendEmail({
    email: patient.email,
    subject: `MedConnect ${type.replace('_', ' ')} Reminder`,
    message: html,
  });
  // Log email
  await EmailLog.create({
    to: patient.email,
    subject: `MedConnect ${type.replace('_', ' ')} Reminder`,
    html,
    type,
    referenceId: appointment._id,
    status: 'sent',
  });
}

// Cron runs every minute to check for upcoming appointments
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Find appointments that are scheduled and not cancelled
    const appointments = await Appointment.find({
      status: { $in: ['scheduled', 'confirmed'] },
    }).populate('doctor', 'name');

    for (const appt of appointments) {
      // Attach doctorName for template
      appt.doctorName = appt.doctor?.name || '';
      const apptDateTime = combineDateTime(appt.date, appt.startTime);
      const diffMs = apptDateTime - now;
      const diffHours = diffMs / (1000 * 60 * 60);

      // 24 hour reminder
      if (diffHours > 23 && diffHours <= 24) {
        const exists = await EmailLog.findOne({ referenceId: appt._id, type: 'appointment_reminder_24h' });
        if (!exists) await sendReminder(appt, 'appointment_reminder_24h');
      }
      // 1 hour reminder
      else if (diffHours > 0 && diffHours <= 1) {
        const exists = await EmailLog.findOne({ referenceId: appt._id, type: 'appointment_reminder_1h' });
        if (!exists) await sendReminder(appt, 'appointment_reminder_1h');
      }
      // Same day reminder (any time today before appointment)
      else if (diffHours > 0 && diffHours <= 0.5) { // within 30 minutes as same day reminder
        const exists = await EmailLog.findOne({ referenceId: appt._id, type: 'appointment_reminder_same_day' });
        if (!exists) await sendReminder(appt, 'appointment_reminder_same_day');
      }
    }
  } catch (err) {
    console.error('Appointment reminder cron error:', err);
  }
});
