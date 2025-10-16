import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      
    },
  },
  ur: {
    translation: {
   
    },
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "", // Default language
    fallbackLng: " ",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;