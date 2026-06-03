import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const LanguageSwitcher = ({ className }) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('ta') ? 'ta' : 'en';

  const setLang = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={cn('flex items-center rounded-full bg-medical-50 border border-medical-200 p-0.5', className)}>
      {['en', 'ta'].map((lng) => (
        <motion.button
          key={lng}
          type="button"
          onClick={() => setLang(lng)}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-full transition-colors',
            current === lng
              ? 'bg-medical-600 text-white shadow-sm'
              : 'text-medical-600 hover:text-medical-700'
          )}
          whileTap={{ scale: 0.95 }}
        >
          {lng === 'en' ? 'EN' : 'தமிழ்'}
        </motion.button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
