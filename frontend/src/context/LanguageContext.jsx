import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'hi', label: 'हिन्दी', nativeLabel: 'हिन्दी' },
  { code: 'or', label: 'ଓଡ଼ିଆ', nativeLabel: 'ଓଡ଼ିଆ' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('arogya_lang') || 'en';
  });

  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('arogya_lang', langCode);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  /**
   * Safe nested key translation resolver
   * Usage: t('nav.command_hub', 'Command Hub')
   */
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');

    // Try current language
    let current = translations[language];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined) return current;

    // Fallback to English
    let fallbackObj = translations.en;
    for (const key of keys) {
      if (fallbackObj && fallbackObj[key] !== undefined) {
        fallbackObj = fallbackObj[key];
      } else {
        fallbackObj = undefined;
        break;
      }
    }

    if (fallbackObj !== undefined) return fallbackObj;

    return fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: AVAILABLE_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
