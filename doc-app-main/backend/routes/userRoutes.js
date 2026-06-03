const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  return obj;
};

router.put('/profile', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const {
      name, displayName, phone, phoneNumber, dob, gender, bloodGroup,
      address, heightCm, weightKg, height, weight,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      allergies, medicalConditions,
    } = req.body;

    const updates = {};
    if (name || displayName) updates.name = name || displayName;
    if (phone || phoneNumber) updates.phone = phone || phoneNumber;
    if (dob) updates.dob = new Date(dob);
    if (gender) updates.gender = gender;
    if (bloodGroup) updates.bloodGroup = bloodGroup;
    if (heightCm || height) updates.height = Number(heightCm || height);
    if (weightKg || weight) updates.weight = Number(weightKg || weight);

    if (address) {
      updates.address = typeof address === 'string'
        ? { street: address }
        : address;
    }

    if (emergencyContactName || emergencyContactPhone || emergencyContactRelation) {
      updates.emergencyContact = {
        name: emergencyContactName || req.user.emergencyContact?.name,
        phone: emergencyContactPhone || req.user.emergencyContact?.phone,
        relationship: emergencyContactRelation || req.user.emergencyContact?.relationship,
      };
    }

    if (allergies !== undefined) {
      updates.allergies = Array.isArray(allergies)
        ? allergies
        : String(allergies).split(',').filter(Boolean).map((a) => ({ name: a.trim() }));
    }

    if (medicalConditions !== undefined) {
      updates.medicalConditions = Array.isArray(medicalConditions)
        ? medicalConditions
        : String(medicalConditions).split(',').filter(Boolean).map((c) => ({ name: c.trim(), isActive: true }));
    }

    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated successfully', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

router.get('/profile-completion', protect, (req, res) => {
  const fields = ['name', 'email', 'phone', 'dob', 'gender', 'bloodGroup', 'profileImage', 'address', 'height', 'weight', 'allergies', 'emergencyContact'];
  const filled = fields.filter((f) => {
    const v = req.user[f];
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.values(v).some((x) => x);
    return true;
  }).length;
  res.json({ completion: Math.round((filled / fields.length) * 100) });
});

module.exports = router;
