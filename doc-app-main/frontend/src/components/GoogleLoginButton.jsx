import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';
import './GoogleLoginButton.css';

const GoogleLoginButton = ({ buttonText = 'Continue with Google' }) => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const handleGoogleLogin = () => {
    // Redirects browser to backend which initiates passport-google-oauth20 flow
    window.location.href = `${API_BASE}/auth/google`;
  };

  // Check for user data in URL after OAuth redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        setCurrentUser(userData);
        // Clear the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Redirect to dashboard or home
        navigate('/dashboard');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate, setCurrentUser]);

  return (
    <button 
      onClick={handleGoogleLogin}
      className="google-login-button"
      type="button"
    >
      <FcGoogle className="google-icon" />
      <span>{buttonText}</span>
    </button>
  );
};

export default GoogleLoginButton;
