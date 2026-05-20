import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, getDisplayName, getPhotoURL, isEmailVerified } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <span className="logo-icon-main">MC</span>
              <span className="logo-badge">24/7</span>
            </div>
            <div className="logo-copy">
              <span className="logo-text">MedConnect</span>
              <span className="logo-subtitle">Premium care, anytime</span>
            </div>
          </Link>
          
          <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              <li><Link to="/" className={isActive('/') ? 'active' : ''} onClick={closeMobileMenu}>Home</Link></li>
              <li><Link to="/about" className={isActive('/about') ? 'active' : ''} onClick={closeMobileMenu}>About</Link></li>
              <li><Link to="/blog" className={isActive('/blog') ? 'active' : ''} onClick={closeMobileMenu}>Health Tips</Link></li>
              <li><Link to="/doctors" className={isActive('/doctors') ? 'active' : ''} onClick={closeMobileMenu}>Find a Doctor</Link></li>
              <li><Link to="/appointments" className={isActive('/appointments') ? 'active' : ''} onClick={closeMobileMenu}>Appointments</Link></li>
              <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={closeMobileMenu}>Profile</Link></li>
              {currentUser?.role === 'admin' && (
                <li><Link to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={closeMobileMenu}>Admin</Link></li>
              )}
              <li className="theme-toggle-li">
                <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </li>
            
             
            </ul>
            
            <div className="nav-auth">
              {currentUser ? (
                <div className="user-menu-container">
                  <button 
                    className="user-menu-trigger"
                    onClick={toggleUserMenu}
                    aria-label="User menu"
                  >
                    <div className="user-avatar">
                      {getPhotoURL() ? (
                        <img src={getPhotoURL()} alt={getDisplayName()} />
                      ) : (
                        <div className="avatar-placeholder">
                          {getDisplayName()?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="user-name">{getDisplayName()}</span>
                    <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </button>
                  
                  <div className={`user-menu ${isUserMenuOpen ? 'active' : ''}`}>
                    <div className="user-info">
                      <div className="user-avatar">
                        {getPhotoURL() ? (
                          <img src={getPhotoURL()} alt={getDisplayName()} />
                        ) : (
                          <div className="avatar-placeholder">
                            {getDisplayName()?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{getDisplayName()}</div>
                        <div className="user-email">{currentUser.email}</div>
                        {!isEmailVerified() && (
                          <div className="verification-status unverified">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="12"/>
                              <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Email not verified
                          </div>
                        )}
                        {isEmailVerified() && (
                          <div className="verification-status verified">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"/>
                            </svg>
                            Email verified
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="user-menu-links">
                      <Link to="/profile" className="menu-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        My Profile
                      </Link>
                      <Link to="/appointments" className="menu-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        My Appointments
                      </Link>
                      <Link to="/billing" className="menu-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                          <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        Billing
                      </Link>
                      {currentUser?.role === 'admin' && (
                        <Link to="/admin" className="menu-link admin-link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="3" x2="9" y2="21"/>
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout} className="menu-link logout-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn secondary-btn" onClick={closeMobileMenu}>Login</Link>
                  <Link to="/signup" className="btn primary-btn" onClick={closeMobileMenu}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
          
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
