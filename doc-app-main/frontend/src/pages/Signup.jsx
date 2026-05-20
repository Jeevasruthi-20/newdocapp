import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider, appleProvider } from "../firebaseConfig";
import "./Signup.css";

const steps = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Medical Info" },
  { id: 3, title: "Emergency Info" },
  { id: 4, title: "Account Setup" }
];

const Signup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "male",
    phone: "",
    bloodGroup: "",
    allergies: "",
    conditions: "",
    medications: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) return "Full Name is required";
      if (!formData.dob) return "Date of Birth is required";
      if (!formData.phone.trim() || !validatePhoneNumber(formData.phone)) return "A valid Phone Number is required";
    }
    if (currentStep === 3) {
      if (!formData.emergencyContactName.trim()) return "Emergency Contact Name is required";
      if (!formData.emergencyContactPhone.trim()) return "Emergency Contact Phone is required";
    }
    if (currentStep === 4) {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return "A valid Email Address is required";
      if (formData.password.length < 6) return "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      const extendedProfile = {
        dob: formData.dob,
        phoneNumber: formData.phone.replace(/\s/g, ''),
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies || "None",
        conditions: formData.conditions,
        medications: formData.medications,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relation: formData.emergencyContactRelation
        }
      };
      localStorage.setItem('extendedProfile', JSON.stringify(extendedProfile));

      await sendEmailVerification(userCredential.user);

      // Backend submission
      const backendRes = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          gender: formData.gender,
          password: formData.password,
          bloodGroup: formData.bloodGroup,
          allergies: formData.allergies,
          conditions: formData.conditions,
          medications: formData.medications,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          emergencyContactRelation: formData.emergencyContactRelation
        }),
      });

      if (!backendRes.ok) {
        const errorData = await backendRes.json();
        throw new Error(errorData.message || "Backend registration failed");
      }

      toast.success("Account created successfully! Please check your email.", { id: loadingToast });
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error(error);
      let errorMessage = "Signup failed";
      if (error.code === 'auth/email-already-in-use') errorMessage = "Email already in use";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="wizard-step fade-in">
            <h2 className="step-title">Let's get started</h2>
            <p className="step-subtitle">Tell us a bit about yourself</p>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div className="form-row two-col">
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="wizard-step fade-in">
            <h2 className="step-title">Medical Information</h2>
            <p className="step-subtitle">Help us provide better care for you</p>
            
            <div className="form-row two-col">
              <div className="form-group">
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Allergies</label>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g., Peanuts, Penicillin" />
              </div>
            </div>
            <div className="form-group">
              <label>Existing Conditions</label>
              <input type="text" name="conditions" value={formData.conditions} onChange={handleChange} placeholder="e.g., Diabetes, Asthma" />
            </div>
            <div className="form-group">
              <label>Current Medications</label>
              <input type="text" name="medications" value={formData.medications} onChange={handleChange} placeholder="e.g., Aspirin 75mg" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="wizard-step fade-in">
            <h2 className="step-title">Emergency Contact</h2>
            <p className="step-subtitle">Who should we contact in an emergency?</p>
            
            <div className="form-group">
              <label>Contact Name *</label>
              <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} placeholder="Jane Doe" />
            </div>
            <div className="form-row two-col">
              <div className="form-group">
                <label>Relationship</label>
                <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} placeholder="e.g., Spouse, Parent" />
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} placeholder="+1 234 567 8900" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="wizard-step fade-in">
            <h2 className="step-title">Account Setup</h2>
            <p className="step-subtitle">Secure your new MedConnect account</p>
            
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container wizard-container">
        
        <div className="signup-header">
          <Link to="/" className="back-home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
          <div className="already-account">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>

        <div className="signup-card wizard-card">
          
          {/* Stepper Breadcrumbs */}
          <div className="stepper-wrapper">
            {steps.map((step, index) => (
              <div key={step.id} className={`stepper-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                <div className="step-counter">
                  {currentStep > step.id ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="step-name">{step.title}</div>
              </div>
            ))}
            {/* Progress Bar Background */}
            <div className="stepper-progress-bg">
              <div 
                className="stepper-progress-fill" 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="wizard-body">
            {renderStepContent()}
          </div>

          <div className="wizard-footer">
            {currentStep > 1 && (
              <button type="button" className="btn outline-btn back-btn" onClick={prevStep} disabled={loading}>
                Back
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button type="button" className="btn primary-btn next-btn" onClick={nextStep}>
                Next Step
              </button>
            ) : (
              <button type="button" className="btn primary-btn submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="loading-spinner"></span> : 'Create Account'}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Signup;
