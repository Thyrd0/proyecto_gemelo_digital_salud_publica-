import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKey } from '../locales/translations';

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'urban_food_twin_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
      return navigator.language.startsWith('es') ? 'es' : 'es'; // default to 'es'
    } catch {
      return 'es';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
      document.documentElement.lang = language;
    } catch {
      // storage unavailable
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'es' ? 'en' : 'es'));
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.es;
    return dict[key] || translations.es[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
