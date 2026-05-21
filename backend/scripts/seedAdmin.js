const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'karthikfuels@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    const adminUser = new User({
      name: 'Admin Karthik',
      email: adminEmail,
      password: hashedPassword,
      phone: '1234567890',
      dob: new Date('1990-01-01'),
      gender: 'male',
      role: 'admin',
      isEmailVerified: true
    });

    await adminUser.save();
    console.log('🎉 Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
