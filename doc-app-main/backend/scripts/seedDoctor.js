/**
 * Seed a demo doctor user for appointments & prescriptions.
 * Run: node scripts/seedDoctor.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'doctor@medconnect.com';
  let doctor = await User.findOne({ email });
  if (!doctor) {
    doctor = await User.create({
      name: 'Dr. Priya Sharma',
      email,
      phone: '9876543210',
      dob: new Date('1985-06-15'),
      gender: 'female',
      password: await bcrypt.hash('doctor123', 10),
      role: 'doctor',
      doctorProfile: {
        specialization: 'Cardiology',
        consultationFee: 800,
        hospitalAffiliation: { name: 'MedConnect Heart Center', address: 'Chennai, India' },
      },
    });
    console.log('✅ Doctor created:', email, '/ password: doctor123');
  } else {
    console.log('Doctor already exists:', email);
  }
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
