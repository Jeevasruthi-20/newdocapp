import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, getDisplayName, getPhotoURL } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/about', label: t('nav.about') },
    { to: '/blog', label: t('nav.healthTips') },
    { to: '/doctors', label: t('nav.findDoctor') },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">
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
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={isActive(link.to) ? 'active' : ''}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="theme-toggle-li">
                <button type="button" className="theme-toggle-btn" onClick={() => setTheme((p) => (p === 'light' ? 'dark' : 'light'))} aria-label="Toggle theme">
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </li>
              <li><LanguageSwitcher /></li>
            </ul>

            <div className="nav-auth">
              {currentUser ? (
                <div className="user-menu-container">
                  <button type="button" className="user-menu-trigger" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                    <div className="user-avatar">
                      {getPhotoURL() ? (
                        <img src={getPhotoURL()} alt={getDisplayName()} />
                      ) : (
                        <div className="avatar-placeholder">{getDisplayName()?.charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <span className="user-name">{getDisplayName()}</span>
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="user-menu active"
                      >
                        <Link to="/dashboard" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('nav.dashboard')}</Link>
                        <Link to="/appointments" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('nav.appointments')}</Link>
                        <Link to="/profile" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('nav.profile')}</Link>
                        <Link to="/prescriptions" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('prescription.title')}</Link>
                        <Link to="/billing" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('nav.billing')}</Link>
                        {currentUser?.role === 'admin' && (
                          <Link to="/admin" className="menu-link" onClick={() => setIsUserMenuOpen(false)}>{t('nav.admin')}</Link>
                        )}
                        <button type="button" onClick={handleLogout} className="menu-link logout-btn">{t('nav.logout')}</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn secondary-btn">{t('nav.login')}</Link>
                  <Link to="/signup" className="btn primary-btn">{t('nav.signup')}</Link>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
