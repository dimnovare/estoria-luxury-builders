import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import et from '@/locales/et.json';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      et: { translation: et },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'et',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
