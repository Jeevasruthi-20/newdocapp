const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DoctorSchedule = require('../models/DoctorSchedule');

// GET /api/doctors - public, list all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await User.aggregate([
      { $match: { role: 'doctor', isActive: { $ne: false } } },
      {
        $lookup: {
          from: 'reviews', // Collection name in MongoDB for Review model
          localField: '_id',
          foreignField: 'doctorId',
          as: 'reviewsData'
        }
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: '$reviewsData.rating' }, 0] },
          totalReviews: { $size: '$reviewsData' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          doctorProfile: 1,
          profileImage: 1,
          averageRating: 1,
          totalReviews: 1
        }
      }
    ]);

    // Format for frontend
    doctors.forEach(doc => {
      doc.id = doc._id.toString();
      doc.averageRating = Math.round(doc.averageRating * 10) / 10;
    });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctors/:id/blocked-dates - get blocked dates for a specific doctor
router.get('/:id/blocked-dates', async (req, res) => {
  try {
    const schedule = await DoctorSchedule.findOne({ doctor: req.params.id });
    if (!schedule) return res.json({ blockedDates: [] });
    res.json({ blockedDates: schedule.blockedDates.map(b => b.date) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
