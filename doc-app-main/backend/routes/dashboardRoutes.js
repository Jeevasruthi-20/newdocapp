const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/patient', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ patient: userId })
        .populate('doctor', 'name doctorProfile.specialization profileImage')
        .sort({ date: -1 })
        .limit(20),
      Prescription.find({ patient: userId })
        .sort({ consultationDate: -1 })
        .limit(10),
    ]);

    const upcoming = appointments.filter(
      (a) => ['scheduled', 'confirmed'].includes(a.status) && new Date(a.date) >= now
    );
    const past = appointments.filter(
      (a) => a.status === 'completed' || (new Date(a.date) < now && a.status !== 'cancelled')
    );
    const cancelled = appointments.filter((a) => a.status === 'cancelled');

    const stats = {
      totalAppointments: appointments.length,
      upcomingCount: upcoming.length,
      completedCount: past.length,
      prescriptionsCount: prescriptions.length,
      cancelledCount: cancelled.length,
    };

    const profileFields = [
      'name', 'email', 'phone', 'dob', 'gender', 'bloodGroup',
      'profileImage', 'address', 'height', 'weight', 'allergies',
      'medicalConditions', 'emergencyContact',
    ];
    const filled = profileFields.filter((f) => {
      const v = req.user[f];
      if (v === null || v === undefined || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.values(v).some((x) => x);
      return true;
    }).length;
    const profileCompletion = Math.round((filled / profileFields.length) * 100);

    const notifications = [];
    upcoming.slice(0, 3).forEach((apt) => {
      notifications.push({
        id: apt._id,
        type: 'appointment',
        title: 'Upcoming appointment',
        message: `${apt.doctor?.name || 'Doctor'} on ${new Date(apt.date).toLocaleDateString()}`,
        date: apt.date,
      });
    });
    if (profileCompletion < 80) {
      notifications.push({
        id: 'profile',
        type: 'reminder',
        title: 'Complete your profile',
        message: `Your profile is ${profileCompletion}% complete`,
        date: new Date(),
      });
    }

    const recentActivity = [
      ...appointments.slice(0, 5).map((a) => ({
        type: 'appointment',
        title: `Appointment ${a.status}`,
        date: a.updatedAt || a.createdAt,
        meta: a.doctor?.name,
      })),
      ...prescriptions.slice(0, 3).map((p) => ({
        type: 'prescription',
        title: 'Prescription issued',
        date: p.createdAt,
        meta: p.doctorName,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage,
        bloodGroup: req.user.bloodGroup,
        role: req.user.role,
      },
      stats,
      profileCompletion,
      upcomingAppointments: upcoming.slice(0, 5),
      pastAppointments: past.slice(0, 5),
      prescriptions: prescriptions.slice(0, 5),
      medicalConditions: req.user.medicalConditions || [],
      medications: req.user.medications || [],
      notifications,
      recentActivity,
      healthSummary: {
        bloodGroup: req.user.bloodGroup || 'Not set',
        allergies: (req.user.allergies || []).map((a) => a.name).join(', ') || 'None recorded',
        height: req.user.height ? `${req.user.height} cm` : '—',
        weight: req.user.weight ? `${req.user.weight} kg` : '—',
        conditions: (req.user.medicalConditions || []).filter((c) => c.isActive).map((c) => c.name),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

module.exports = router;
