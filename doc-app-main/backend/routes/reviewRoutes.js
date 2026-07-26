const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');

// POST /api/reviews - Create a new review
router.post('/', protect, async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    
    // Validate input
    if (!appointmentId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid appointmentId and rating (1-5) are required.' });
    }

    // Fetch the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Verify ownership
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own appointments.' });
    }

    // Verify status
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed appointments.' });
    }

    // Derive doctorId strictly from the appointment to prevent spoofing
    const doctorId = appointment.doctor;

    // Create the review
    const review = new Review({
      patientId: req.user._id,
      doctorId,
      appointmentId,
      rating,
      comment: comment ? comment.substring(0, 500) : undefined // Truncate comment to 500 chars max
    });

    try {
      await review.save(); // (1) Save the Review document first
    } catch (err) {
      if (err.code === 11000) {
        // Catch MongoDB duplicate key errors (code 11000) and return a clean HTTP 409 Conflict
        return res.status(409).json({ message: 'You have already reviewed this appointment.' });
      }
      throw err; // Re-throw other errors
    }

    // (2) Only if the save succeeds, update the Appointment.isReviewed flag to true
    appointment.isReviewed = true;
    await appointment.save({ validateBeforeSave: false }); // Skip other validations on appointment

    res.status(201).json({ message: 'Review submitted successfully.', review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Failed to submit review.' });
  }
});

// GET /api/reviews/doctor/:doctorId - Get paginated reviews and aggregate stats for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID.' });
    }

    const docId = new mongoose.Types.ObjectId(doctorId);

    // Use $facet to run both aggregation for stats and fetching paginated reviews in one go
    const result = await Review.aggregate([
      { $match: { doctorId: docId } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
              }
            }
          ],
          reviews: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patient'
              }
            },
            { $unwind: '$patient' },
            {
              $project: {
                _id: 1,
                rating: 1,
                comment: 1,
                createdAt: 1,
                'patient.name': 1,
                'patient.profileImage': 1
              }
            }
          ]
        }
      }
    ]);

    const stats = result[0].stats[0] || { averageRating: 0, totalReviews: 0 };
    const reviews = result[0].reviews || [];
    const totalPages = Math.ceil(stats.totalReviews / limit);

    // Round average to 1 decimal place
    stats.averageRating = Math.round(stats.averageRating * 10) / 10;

    res.json({
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      reviews,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
