import React from 'react';
import { useTranslation } from 'react-i18next';
import './ContactHelp.css'; // optional styling

const ContactHelp = () => {
  const { t } = useTranslation();
  return (
    <div className="page premium-ui contact-help-page">
      <div className="container">
        <h1 className="title-gradient">{t('contact.title') || 'Contact & Help Center'}</h1>
        <p>{t('contact.intro') || 'We are here to help you with any questions or issues.'}</p>
        {/* Placeholder contact form */}
        <form className="contact-form glass-container">
          <div className="form-group">
            <label>{t('contact.name') || 'Name'}</label>
            <input type="text" className="premium-input" placeholder={t('contact.namePlaceholder') || 'Your name'} required />
          </div>
          <div className="form-group">
            <label>{t('contact.email') || 'Email'}</label>
            <input type="email" className="premium-input" placeholder={t('contact.emailPlaceholder') || 'you@example.com'} required />
          </div>
          <div className="form-group">
            <label>{t('contact.message') || 'Message'}</label>
            <textarea rows="4" className="premium-input" placeholder={t('contact.messagePlaceholder') || 'How can we assist you?'} required />
          </div>
          <button type="submit" className="btn primary-btn">{t('contact.submit') || 'Send Message'}</button>
        </form>
      </div>
    </div>
  );
};

export default ContactHelp;
