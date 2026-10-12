import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setLanguage as setLanguageAction,
  toggleLanguage as toggleLanguageAction,
  SupportedLanguage,
} from '@/store/slices/uiSlice';

export function useLanguage() {
  const dispatch = useAppDispatch();
  const { language, isGreek } = useAppSelector((state) => state.ui);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('preferredLang');
      if (saved === 'en' || saved === 'el') {
        if (saved !== language) {
          dispatch(setLanguageAction(saved));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languagechange', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languagechange', handleStorageChange);
    };
  }, [dispatch, language]);

  const setLanguage = (lang: SupportedLanguage) => {
    dispatch(setLanguageAction(lang));
  };

  const toggleLanguage = () => {
    dispatch(toggleLanguageAction());
  };

  return {
    language,
    isGreek,
    setLanguage,
    toggleLanguage,
  };
}

export default useLanguage;
