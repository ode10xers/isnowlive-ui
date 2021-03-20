import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLanguage } from 'utils/storage';

import en from './locales/en.json';
import hi from './locales/hi.json';

// the translations
const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const userLang = getLanguage();

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: userLang || 'en',
    resources,
    fallbackLng: 'en',
    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export { i18n };
