require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedDoctors = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const doctorsData = [
    {
      name: 'Doctor One',
      email: 'doctor1@gmail.com',
      password: 'doctor123',
      specialty: 'General Physician',
      fee: 500
    },
    {
      name: 'Doctor Two',
      email: 'doctor2@gmail.com',
      password: 'doctor123',
      specialty: 'Gynecologist',
      fee: 800
    },
    {
      name: 'Doctor Three',
      email: 'doctor3@gmail.com',
      password: 'doctor123',
      specialty: 'Dermatologist',
      fee: 700
    }
  ];

  for (const docData of doctorsData) {
    let doctor = await User.findOne({ email: docData.email });
    if (!doctor) {
      await User.create({
        name: docData.name,
        email: docData.email,
        phone: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        dob: new Date('1980-01-01'),
        gender: 'other',
        password: await bcrypt.hash(docData.password, 10),
        role: 'doctor',
        doctorProfile: {
          specialization: docData.specialty,
          consultationFee: docData.fee,
        },
      });
      console.log(`✅ Created ${docData.email}`);
    } else {
      console.log(`ℹ️ ${docData.email} already exists`);
    }
  }

  console.log('Done!');
  process.exit(0);
};

seedDoctors().catch((e) => {
  console.error(e);
  process.exit(1);
});
