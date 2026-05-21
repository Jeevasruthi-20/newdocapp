const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const promoteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'karthikfuels@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`🚀 User ${email} promoted to ADMIN successfully!`);
    } else {
      console.log(`❌ User ${email} not found in database.`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error promoting user:', err);
    process.exit(1);
  }
};

promoteUser();
