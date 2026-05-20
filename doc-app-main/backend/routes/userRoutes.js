// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../middleware/upload');

// Update Profile (Name & Photo)
router.put('/profile', upload.single('profileImage'), async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { 
      name, displayName, phone, phoneNumber, dob, gender, bloodGroup, 
      address, heightCm, weightKg, emergencyContactName, 
      emergencyContactPhone, emergencyContactRelation, allergies 
    } = req.body;

    const updates = {};
    if (name || displayName) updates.name = name || displayName;
    if (phone || phoneNumber) updates.phone = phone || phoneNumber;
    if (dob) updates.dob = dob;
    if (gender) updates.gender = gender;
    if (bloodGroup) updates.bloodGroup = bloodGroup;
    if (heightCm) updates.height = heightCm;
    if (weightKg) updates.weight = weightKg;
    
    // Nested objects
    if (address) {
      updates.address = { street: address }; // Simplified for now
    }
    
    if (emergencyContactName || emergencyContactPhone || emergencyContactRelation) {
      updates.emergencyContact = {
        name: emergencyContactName,
        phone: emergencyContactPhone,
        relationship: emergencyContactRelation
      };
    }

    if (allergies) {
      // Handle comma-separated string or array
      updates.allergies = Array.isArray(allergies) 
        ? allergies 
        : allergies.split(',').map(a => ({ name: a.trim() }));
    }
    
    if (req.file) {
      updates.profileImage = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    
    // Update session user
    req.user.name = user.name;
    if (user.profileImage) req.user.profileImage = user.profileImage;

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
