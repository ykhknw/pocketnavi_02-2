import { useState, useEffect } from 'react';

export type Language = 'ja' | 'en';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ja';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ja' ? 'en' : 'ja');
  };

  return { language, setLanguage, toggleLanguage };
}