// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Authentication
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    select: false // Don't return password in queries
  },
  profileImage: {
    type: String,
    default: null
  },
  
  // Personal Information
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    trim: true
  },
  dob: { 
    type: Date, 
    required: true 
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
    default: null
  },
  
  // Address
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  
  // Medical Information
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  allergies: [{
    name: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    notes: String
  }],
  medicalConditions: [{
    name: String,
    diagnosedDate: Date,
    isActive: { type: Boolean, default: true },
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: String,
    notes: String
  }],
  
  // Emergency Contact
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  
  // Account Status
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,
  
  // Role
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  
  // Doctor-specific fields (only for users with role 'doctor')
  doctorProfile: {
    specialization: { type: String, trim: true },
    qualifications: [{
      degree: String,
      university: String,
      year: Number
    }],
    experience: Number, // in years
    consultationFee: {
      type: Number,
      default: 500 // Default fee in INR
    },
    availableSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // e.g., '09:00'
      endTime: String,   // e.g., '17:00'
      isAvailable: { type: Boolean, default: true }
    }],
    bio: String,
    hospitalAffiliation: {
      name: String,
      address: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's age
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model("User", userSchema);
