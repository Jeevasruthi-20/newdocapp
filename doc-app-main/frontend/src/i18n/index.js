import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';

const savedLang = localStorage.getItem('medconnect_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('medconnect_lang', lng);
  document.documentElement.lang = lng;
  document.documentElement.classList.toggle('font-tamil', lng === 'ta');
});

document.documentElement.lang = savedLang;
if (savedLang === 'ta') document.documentElement.classList.add('font-tamil');

export default i18n;
