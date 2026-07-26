const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const emailService = require('../services/emailService');

const startReminderCron = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[ReminderCron] Running 15-minute interval check...');
      const now = new Date();
      
      // Look up to 2 days ahead to catch the 24h and 1h windows
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + 2);

      // Find all confirmed appointments where either reminder is unsent
      const appointments = await Appointment.find({
        status: 'confirmed',
        date: { $gte: new Date(now.setHours(0, 0, 0, 0)), $lte: futureDate },
        $or: [
          { reminder24hSent: false },
          { reminder1hSent: false }
        ]
      }).populate('patient', 'name email').populate('doctor', 'name');

      const currentRealTime = new Date(); // get actual now

      for (let apt of appointments) {
        if (!apt.patient?.email) continue; // Skip if no email

        // Parse appointment time
        const [h, m] = apt.startTime.split(':').map(Number);
        const aptTime = new Date(apt.date);
        aptTime.setHours(h, m, 0, 0);

        // Calculate hours difference
        const diffMs = aptTime - currentRealTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        // 1h Reminder (Catch-up tolerant: <= 1.25h)
        // Must be in the future (diffHours > 0)
        if (diffHours > 0 && diffHours <= 1.25 && !apt.reminder1hSent) {
          console.log(`[ReminderCron] Sending 1h reminder for Appt ${apt._id}`);
          const sent = await emailService.sendReminderEmail(
            apt.patient.email, apt.patient.name, apt.doctor.name, apt.date, apt.startTime, false
          );
          if (sent) {
            apt.reminder1hSent = true;
            await apt.save();
          }
        }
        
        // 24h Reminder (Catch-up tolerant: <= 24.25h)
        // Must be in the future (diffHours > 0)
        else if (diffHours > 0 && diffHours <= 24.25 && !apt.reminder24hSent) {
          console.log(`[ReminderCron] Sending 24h reminder for Appt ${apt._id}`);
          const sent = await emailService.sendReminderEmail(
            apt.patient.email, apt.patient.name, apt.doctor.name, apt.date, apt.startTime, true
          );
          if (sent) {
            apt.reminder24hSent = true;
            await apt.save();
          }
        }
      }
    } catch (error) {
      console.error('[ReminderCron] Error during execution:', error);
    }
  });

  console.log('[ReminderCron] Service initialized and scheduled.');
};

module.exports = { startReminderCron };
