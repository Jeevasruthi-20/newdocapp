import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  // Phone number validation
  const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  // Format phone number for display
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return `+${cleaned}`;
    if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
  };

  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError("");
  };

  // OTP countdown timer
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Step 1: Backend Login (Email/Password)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setSuccess("Logged in successfully!");
      setCurrentUser(data.user);
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await signInWithPopup(auth, googleProvider);
      setSuccess("Logged in with Google successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      let errorMessage = "Google login failed";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Login popup was closed. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups for this site.";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  // Send OTP
  const sendOtp = async () => {
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }
    
    if (!validatePhoneNumber(phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone.replace(/\s/g, ''), appVerifier);
      setConfirmationResult(result);
      setSuccess("OTP sent successfully!");
      setOtpTimer(60);
      setCanResendOtp(false);
    } catch (error) {
      let errorMessage = "Failed to send OTP";
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (!canResendOtp) return;
    await sendOtp();
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp) {
      setError("Please enter OTP");
      return;
    }
    
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await confirmationResult.confirm(otp);
      setSuccess("Phone login successful!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      let errorMessage = "Invalid OTP";
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid OTP code";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "OTP has expired. Please request a new one";
        setConfirmationResult(null);
        setOtp("");
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (error) {
      let errorMessage = "Failed to send reset email";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="back-home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="login-card">
          <div className="login-logo">
            <div className="logo-icon">🏥</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your MedConnect account</p>
          </div>

          {/* Error and Success Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="login-tabs">
            <button 
              className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Email Login
            </button>
            <button 
              className={`tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
              onClick={() => setActiveTab('phone')}
            >
              Phone Login
            </button>
          </div>

          {activeTab === 'email' ? (
            <div className="login-form">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn primary-btn login-btn"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading"></span> : 'Sign In'}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              {/* Social Login Buttons */}
              <div className="social-login">
                <button 
                  className="btn social-btn google-btn"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>

              <div className="login-footer">
                <p>Don't have an account? <Link to="/signup" className="link">Sign up</Link></p>
                <button 
                  type="button" 
                  className="forgot-link" 
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            </div>
          ) : (
            <div className="phone-login">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={handlePhoneChange}
                />
                <small className="form-hint">Enter your phone number with country code</small>
              </div>
              
              <button 
                className="btn primary-btn"
                onClick={sendOtp}
                disabled={isLoading || !phone || !validatePhoneNumber(phone)}
              >
                {isLoading ? <span className="loading"></span> : 'Send OTP'}
              </button>

              {confirmationResult && (
                <div className="otp-section">
                  <div className="form-group">
                    <label className="form-label">Enter OTP</label>
                    <input
                      type="text"
                      className="form-input otp-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength="6"
                    />
                    <div className="otp-timer">
                      {otpTimer > 0 ? (
                        <span>Resend OTP in {otpTimer}s</span>
                      ) : (
                        <button 
                          className="resend-btn"
                          onClick={resendOtp}
                          disabled={!canResendOtp}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="btn primary-btn"
                    onClick={verifyOtp}
                    disabled={isLoading || !otp || otp.length !== 6}
                  >
                    {isLoading ? <span className="loading"></span> : 'Verify OTP'}
                  </button>
                </div>
              )}
              
              <div id="recaptcha-container"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
