const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
  // Phone number this OTP is associated with
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // The OTP code (hashed for security)
  otp: {
    type: String,
    required: true,
    select: false // Don't return OTP in queries
  },
  
  // When the OTP was created
  createdAt: {
    type: Date,
    default: Date.now,
    expires: process.env.OTP_EXPIRE_MINUTES * 60 || 600 // Default 10 minutes
  },
  
  // Number of attempts made to verify this OTP
  attempts: {
    type: Number,
    default: 0,
    max: process.env.MAX_OTP_ATTEMPTS || 3
  },
  
  // Whether this OTP has been verified
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Reference to the user (if available)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Purpose of the OTP (e.g., 'signup', 'login', 'password_reset')
  purpose: {
    type: String,
    required: true,
    enum: ['signup', 'login', 'password_reset', 'phone_verification', 'other']
  }
}, {
  timestamps: true
});

// Generate a random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

// Hash the OTP before saving
const hashOTP = (otp) => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
};

// Generate and set hashed OTP
// This is a static method that can be called from the controller
otpSchema.statics.generateAndSaveOTP = async function(phone, purpose, userId = null) {
  // Delete any existing OTPs for this phone and purpose
  await this.deleteMany({ phone, purpose });
  
  // Generate new OTP
  const otp = generateOTP(process.env.OTP_LENGTH || 6);
  const hashedOTP = hashOTP(otp);
  
  // Create and save the OTP document
  const otpDoc = new this({
    phone,
    otp: hashedOTP,
    purpose,
    user: userId
  });
  
  await otpDoc.save();
  
  // Return the plain OTP (only here, not stored in plain text)
  return otp;
};

// Verify an OTP
// This is a static method that can be called from the controller
otpSchema.statics.verifyOTP = async function(phone, otp, purpose) {
  // Find the most recent OTP for this phone and purpose
  const otpDoc = await this.findOne({ 
    phone, 
    purpose,
    isVerified: false,
    createdAt: { $gt: new Date(Date.now() - (process.env.OTP_EXPIRE_MINUTES * 60 * 1000 || 10 * 60 * 1000)) }
  }).sort({ createdAt: -1 });
  
  if (!otpDoc) {
    throw new Error('OTP not found or expired');
  }
  
  // Check if max attempts reached
  if (otpDoc.attempts >= (process.env.MAX_OTP_ATTEMPTS || 3)) {
    throw new Error('Maximum OTP attempts reached');
  }
  
  // Verify the OTP
  const hashedOTP = hashOTP(otp);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(otpDoc.otp),
    Buffer.from(hashedOTP)
  );
  
  // Increment attempts
  otpDoc.attempts += 1;
  await otpDoc.save();
  
  if (!isMatch) {
    throw new Error('Invalid OTP');
  }
  
  // Mark as verified
  otpDoc.isVerified = true;
  await otpDoc.save();
  
  return true;
};

// Method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  const expiryTime = new Date(
    this.createdAt.getTime() + (process.env.OTP_EXPIRE_MINUTES * 60 * 1000 || 10 * 60 * 1000)
  );
  return new Date() > expiryTime;
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
