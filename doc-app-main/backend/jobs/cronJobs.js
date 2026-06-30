const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const initCronJobs = () => {
  // 1. Auto-cancel unconfirmed appointments after 24 hours
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const expiredAppointments = await Appointment.find({
        status: 'scheduled', // wait, status is 'scheduled', or 'pending'
        createdAt: { $lte: twentyFourHoursAgo }
      });

      // Filter those that have not been approved. Our system uses 'scheduled' for waiting, and 'confirmed' for approved.
      for (const apt of expiredAppointments) {
        apt.status = 'cancelled';
        apt.reason = (apt.reason || '') + ' [Auto-cancelled: not confirmed by doctor within 24 hours]';
        await apt.save();

        const patient = await User.findById(apt.patient);
        if (patient) {
          await sendEmail({
            email: patient.email,
            subject: 'Appointment Cancelled - MedConnect',
            message: `Your appointment request on ${new Date(apt.date).toDateString()} was automatically cancelled because it was not confirmed in time. Please try booking another slot.`,
          });
        }
      }
      if (expiredAppointments.length > 0) {
        console.log(`[Cron] Auto-cancelled ${expiredAppointments.length} unconfirmed appointments.`);
      }
    } catch (error) {
      console.error('[Cron Error] Auto-cancel:', error);
    }
  });

  // 2. 24-hour reminder email
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const tomorrowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcoming = await Appointment.find({
        status: 'confirmed',
        date: { $gte: tomorrowStart, $lte: tomorrowEnd },
        reminder24hSent: { $ne: true }
      }).populate('patient doctor');

      for (const apt of upcoming) {
        if (apt.patient && apt.patient.email) {
          await sendEmail({
            email: apt.patient.email,
            subject: 'Reminder: Your Appointment Tomorrow',
            message: `Hello ${apt.patient.name}, this is a reminder for your appointment with Dr. ${apt.doctor?.name} tomorrow at ${apt.startTime}.`,
          });
          apt.reminder24hSent = true;
          await apt.save();
        }
      }
    } catch (error) {
      console.error('[Cron Error] 24h reminder:', error);
    }
  });

  console.log('[Cron] Background jobs initialized');
};

module.exports = initCronJobs;
