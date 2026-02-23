import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import deCommon from './locales/de/common.json';
import enCommon from './locales/en/common.json';

const resources = {
    de: { common: deCommon },
    en: { common: enCommon },
};

const savedLocale = localStorage.getItem('locale') || 'de';

i18n.use(initReactI18next).init({
    resources,
    lng: savedLocale,
    fallbackLng: 'de',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
        escapeValue: false, // React handles XSS
    },
});

export default i18n;
