import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page-premium">
      
      {/* 1. Hero Section */}
      <section className="about-hero">
        <div className="hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        
        <div className="container about-hero-container">
          <div className="about-hero-content fade-in-up">
            <span className="hero-badge">ABOUT US</span>
            <h1 className="hero-heading">Healthcare, Reimagined for Everyone</h1>
            <p className="hero-description">
              We are on a mission to make premium healthcare accessible, affordable, and seamless. 
              Experience a modern platform designed to connect you with trusted professionals instantly.
            </p>
          </div>
          
          <div className="hero-stats-grid fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card">
              <h3>15K+</h3>
              <p>Patients Served</p>
            </div>
            <div className="stat-card">
              <h3>500+</h3>
              <p>Verified Doctors</p>
            </div>
            <div className="stat-card">
              <h3>30+</h3>
              <p>Specialties</p>
            </div>
            <div className="stat-card">
              <h3>4.9★</h3>
              <p>Avg Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Mission & Vision Section */}
      <section className="mission-vision-section">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card">
              <div className="mv-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h2>Our Mission</h2>
              <p>
                To break down barriers in the healthcare system by providing a transparent, 
                user-centric platform where finding the right doctor is as easy as booking a flight.
              </p>
            </div>
            
            <div className="mv-card">
              <div className="mv-icon-wrapper">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"></path></svg>
              </div>
              <h2>Our Vision</h2>
              <p>
                A future where everyone, regardless of location, has instant access to 
                top-tier medical professionals, comprehensive health records, and continuous care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Values Section */}
      <section className="core-values-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title-premium">Our Core Values</h2>
            <p className="section-subtitle">The principles that guide every decision we make.</p>
          </div>
          
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon icon-trust">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3>Trust & Transparency</h3>
              <p>Honest reviews, verified credentials, and clear pricing with zero hidden fees.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon icon-access">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
              </div>
              <h3>Accessibility</h3>
              <p>Healthcare that is available 24/7, right from your phone, tablet, or computer.</p>
            </div>

            <div className="value-card">
              <div className="value-icon icon-innovation">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3>Innovation</h3>
              <p>Leveraging cutting-edge technology to streamline appointments and health tracking.</p>
            </div>

            <div className="value-card">
              <div className="value-icon icon-compassion">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <h3>Compassion</h3>
              <p>Treating every patient with the empathy, respect, and dignity they truly deserve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section className="why-choose-us-section">
        <div className="container">
          <div className="wcu-content">
            <div className="wcu-text">
              <h2 className="section-title-premium">Why Choose MedConnect?</h2>
              <p className="wcu-description">
                We've built a platform that puts patients first. From finding a specialist 
                to managing your prescriptions, everything is handled in one secure place.
              </p>
              
              <ul className="wcu-features-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Top-rated specialists
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Reliable health records
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  In-person & video consultation
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Instant online booking
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Secure and private platform
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Smart reminders
                </li>
              </ul>
            </div>
            
            <div className="wcu-image">
              {/* Optional placeholder for an image if needed, or simply decorative */}
              <div className="decorative-phone-mockup">
                <div className="mockup-header">
                  <div className="mockup-notch"></div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-card"></div>
                  <div className="mockup-card"></div>
                  <div className="mockup-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Team Section */}
      <section className="team-section">
        <div className="container">
          <div className="team-card">
            <div className="team-card-content">
              <h2>Meet Our Team</h2>
              <p>
                Behind MedConnect is a passionate group of healthcare professionals, 
                engineers, and designers dedicated to revolutionizing the way you experience healthcare.
              </p>
              
              <div className="team-avatars">
                <div className="avatar-circle"><img src="https://ui-avatars.com/api/?name=Sarah+J&background=0D8ABC&color=fff" alt="Team Member" /></div>
                <div className="avatar-circle"><img src="https://ui-avatars.com/api/?name=Michael+T&background=22C55E&color=fff" alt="Team Member" /></div>
                <div className="avatar-circle"><img src="https://ui-avatars.com/api/?name=Emma+W&background=F59E0B&color=fff" alt="Team Member" /></div>
                <div className="avatar-circle"><img src="https://ui-avatars.com/api/?name=David+L&background=EC4899&color=fff" alt="Team Member" /></div>
              </div>
              
              <Link to="/contact" className="btn primary-btn team-btn">Learn more about us</Link>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default About;
