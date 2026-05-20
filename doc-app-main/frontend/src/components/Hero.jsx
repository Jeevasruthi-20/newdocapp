import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => (
  <section className="hero">
    <div className="hero-background">
      <div className="hero-overlay"></div>
    </div>
    <div className="container">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title fade-in-up">
            Your Health, Our Priority
          </h1>
          <p className="hero-subtitle fade-in-up">
            Connect with trusted healthcare professionals and book appointments with ease. 
            Experience modern healthcare at your fingertips.
          </p>
          <div className="hero-stats fade-in-up">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Verified Doctors</span>
            </div>
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Happy Patients</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support</span>
            </div>
          </div>
          <div className="hero-actions fade-in-up">
            <Link to="/signup" className="btn primary-btn">
              Get Started Today
            </Link>
            <Link to="/doctors" className="btn secondary-btn">
              Find a Doctor
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-container">
            <div className="hero-image-placeholder">
              <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="180" fill="url(#gradient)" opacity="0.1"/>
                <path d="M150 200 L180 230 L250 160" stroke="var(--accent-primary)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)"/>
                    <stop offset="100%" stopColor="var(--accent-secondary)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="floating-card card-1">
              <div className="card-icon">👨‍⚕️</div>
              <div className="card-text">
                <strong>Dr. Smith</strong>
                <span>Cardiologist</span>
              </div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">📅</div>
              <div className="card-text">
                <strong>Available</strong>
                <span>Next Week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
