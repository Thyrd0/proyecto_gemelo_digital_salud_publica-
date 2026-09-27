import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslation from './locales/es.json';
import enTranslation from './locales/en.json';

const savedLang = localStorage.getItem('crispdm_language') || 'es';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslation },
      en: { translation: enTranslation }
    },
    lng: savedLang,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng: string) => {
  localStorage.setItem('crispdm_language', lng);
});

export default i18n;
