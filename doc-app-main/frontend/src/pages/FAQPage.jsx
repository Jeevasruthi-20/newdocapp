import React from 'react';
import { useTranslation } from 'react-i18next';
import './FAQPage.css'; // optional styling

const FAQPage = () => {
  const { t } = useTranslation();
  const faqItems = [
    {
      q: t('faq.q1') || 'How do I book an appointment?',
      a: t('faq.a1') || 'Select a doctor, choose a date and time, and confirm.',
    },
    {
      q: t('faq.q2') || 'Can I cancel an appointment?',
      a: t('faq.a2') || 'Yes, go to My Appointments and click Cancel.',
    },
    {
      q: t('faq.q3') || 'What payment methods are accepted?',
      a: t('faq.a3') || 'We accept credit cards, debit cards, and major online wallets.',
    },
    {
      q: t('faq.q4') || 'Is my data secure?',
      a: t('faq.a4') || 'All data is encrypted in transit and at rest using industry standards.',
    },
  ];
  return (
    <div className="page premium-ui faq-page">
      <div className="container">
        <h1 className="title-gradient">{t('faq.title') || 'Frequently Asked Questions'}</h1>
        <p className="intro-text">{t('faq.intro') || 'Here are some common questions and answers.'}</p>
        <div className="faq-list">
          {faqItems.map((item, idx) => (
            <details key={idx} className="faq-item glass-container">
              <summary className="question">{item.q}</summary>
              <div className="answer">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
