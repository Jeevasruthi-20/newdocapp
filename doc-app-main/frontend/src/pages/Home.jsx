import React from "react";
import Hero from "../components/Hero";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <Hero />

      {/* Introduction Section */}
      <section className="section intro-section">
        <div className="container">
          <div className="intro-content">
            <h2 className="section-title fade-in-up">Welcome to MedConnect</h2>
            <p className="intro-text fade-in-up">
              Your trusted platform to find verified doctors and book appointments effortlessly.
              We prioritize your health and convenience with a modern, user-friendly experience.
            </p>
            <div className="intro-features" aria-label="Key Features">
              {[
                { icon: "🔒", label: "Secure & Private" },
                { icon: "⚡", label: "Instant Booking" },
                { icon: "👨‍⚕️", label: "Verified Doctors" },
              ].map((feature, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works">
        <div className="container">
          <h2 className="section-title fade-in-up">How It Works</h2>
          <div className="steps-container" aria-label="Steps to get started">
            {[
              {
                number: 1,
                title: "Sign Up & Create Profile",
                description:
                  "Register easily and set up your personal health profile in minutes.",
              },
              {
                number: 2,
                title: "Find a Verified Doctor",
                description:
                  "Browse trusted medical professionals based on your needs.",
              },
              {
                number: 3,
                title: "Book & Attend Appointment",
                description:
                  "Choose a time and attend online or in-person.",
              },
            ].map((step) => (
              <div key={step.number} className="step fade-in-up" aria-label={`Step ${step.number}`}>
                <div className="step-number" aria-hidden="true">{step.number}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <h2 className="section-title fade-in-up">Why Choose Us?</h2>
          <div className="features-grid" aria-label="Platform Features">
            {[
              {
                icon: "💻",
                title: "Easy Online Booking",
                description:
                  "Schedule your appointments seamlessly from anywhere.",
              },
              {
                icon: "✅",
                title: "Verified Doctors",
                description:
                  "Trustworthy professionals with verified credentials.",
              },
              {
                icon: "🕒",
                title: "24/7 Support",
                description:
                  "Our team is available around the clock for assistance.",
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                description:
                  "Access from any device, anytime, anywhere.",
              },
              {
                icon: "🔔",
                title: "Smart Reminders",
                description:
                  "Never miss an appointment with intelligent alerts.",
              },
              {
                icon: "📊",
                title: "Health Records",
                description:
                  "Securely store and manage your medical history.",
              },
            ].map((feature, index) => (
              <div key={index} className="feature-card card fade-in-up" aria-hidden="true">
                <div className="feature-icon-large">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials" aria-label="User Testimonials">
        <div className="container">
          <h2 className="section-title fade-in-up">What Our Users Say</h2>
          <div className="testimonials-grid">
            {[
              {
                quote: "MedConnect made booking my appointment so simple and quick. The doctors are professional and trustworthy!",
                avatar: "👩‍🦰",
                name: "Sarah K.",
                role: "Patient",
              },
              {
                quote: "I love the 24/7 support. Whenever I have a question, someone is always there to help me navigate the platform.",
                avatar: "👨‍🦱",
                name: "James L.",
                role: "Patient",
              },
              {
                quote: "The mobile app is fantastic! I can book appointments while commuting to work. It's so convenient!",
                avatar: "👩‍🦳",
                name: "Maria R.",
                role: "Patient",
              },
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card card fade-in-up" aria-hidden="true">
                <div className="testimonial-content">
                  <p>"{testimonial.quote}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar" aria-hidden="true">{testimonial.avatar}</div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;