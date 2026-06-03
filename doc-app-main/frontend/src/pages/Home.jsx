import React from "react";
import { useTranslation } from "react-i18next";
import Hero from "../components/Hero";
import "./Home.css";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <Hero />

      {/* Introduction Section */}
      <section className="section intro-section">
        <div className="container">
          <div className="intro-content">
            <h2 className="section-title fade-in-up">{t('home.welcome')}</h2>
            <p className="intro-text fade-in-up">
              {t('home.welcomeSub')}
            </p>
            <div className="intro-features" aria-label="Key Features">
              {[
                { icon: "🔒", label: t('home.secure') },
                { icon: "⚡", label: t('home.instant') },
                { icon: "👨‍⚕️", label: t('home.verified') },
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
          <h2 className="section-title fade-in-up">{t('home.howItWorks')}</h2>
          <div className="steps-container" aria-label="Steps to get started">
            {[
              {
                number: 1,
                title: t('home.step1'),
                description: t('home.step1Desc'),
              },
              {
                number: 2,
                title: t('home.step2'),
                description: t('home.step2Desc'),
              },
              {
                number: 3,
                title: t('home.step3'),
                description: t('home.step3Desc'),
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
          <h2 className="section-title fade-in-up">{t('home.whyChooseUs')}</h2>
          <div className="features-grid" aria-label="Platform Features">
            {[
              {
                icon: "💻",
                title: t('home.easyBooking'),
                description: t('home.easyBookingDesc'),
              },
              {
                icon: "✅",
                title: t('home.verified'),
                description: t('home.verifiedDoctorsDesc'),
              },
              {
                icon: "🕒",
                title: t('home.support247'),
                description: t('home.support247Desc'),
              },
              {
                icon: "📱",
                title: t('home.mobileFriendly'),
                description: t('home.mobileFriendlyDesc'),
              },
              {
                icon: "🔔",
                title: t('home.smartReminders'),
                description: t('home.smartRemindersDesc'),
              },
              {
                icon: "📊",
                title: t('home.healthRecords'),
                description: t('home.healthRecordsDesc'),
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
          <h2 className="section-title fade-in-up">{t('home.whatUsersSay')}</h2>
          <div className="testimonials-grid">
            {[
              {
                quote: t('home.user1Quote'),
                avatar: "👩‍🦰",
                name: "Sarah K.",
                role: t('home.patient'),
              },
              {
                quote: t('home.user2Quote'),
                avatar: "👨‍🦱",
                name: "James L.",
                role: t('home.patient'),
              },
              {
                quote: t('home.user3Quote'),
                avatar: "👩‍🦳",
                name: "Maria R.",
                role: t('home.patient'),
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