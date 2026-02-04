export const getFlagUrl = (code: string) => {
    if (!code) return '';

    // Normalize code
    const c = code.toLowerCase().trim();

    // Special cases for non-country flags or regions not in FlagCDN
    const specialFlags: Record<string, string> = {
        'eo': 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Flag_of_Esperanto.svg', // Esperanto
        'eu': 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/es-pv.svg',          // Basque
        'ca': 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/es-ct.svg',          // Catalan
        'gl': 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/es-ga.svg',          // Galician
    };

    if (specialFlags[c]) {
        return specialFlags[c];
    }

    // Mapping common language codes to country flags
    const map: Record<string, string> = {
        'af': 'za',     // Afrikaans -> South Africa
        'sq': 'al',     // Albanian -> Albania
        'am': 'et',     // Amharisch -> Ethiopia
        'ar': 'sa',     // Arabic -> Saudi Arabia
        'hy': 'am',     // Armenian -> Armenia
        'az': 'az',     // Azerbaijani -> Azerbaijan
        'be': 'by',     // Belarusian -> Belarus
        'bn': 'bd',     // Bengali -> Bangladesh
        'bs': 'ba',     // Bosnian -> Bosnia
        'bg': 'bg',     // Bulgarian -> Bulgaria
        'my': 'mm',     // Burmese -> Myanmar
        'ceb': 'ph',    // Cebuano -> Philippines
        'zh': 'cn',     // Chinese -> China
        'zh-hk': 'hk',  // Cantonese -> Hong Kong
        'hr': 'hr',     // Croatian -> Croatia
        'cs': 'cz',     // Czech -> Czechia
        'da': 'dk',     // Danish -> Denmark
        'nl': 'nl',     // Dutch -> Netherlands
        'en': 'gb',     // English -> UK
        'en-us': 'us',
        'en-gb': 'gb',
        'et': 'ee',     // Estonian -> Estonia
        'fi': 'fi',     // Finnish -> Finland
        'fr': 'fr',     // French -> France
        'ka': 'ge',     // Georgian -> Georgia
        'de': 'de',     // German -> Germany
        'el': 'gr',     // Greek -> Greece
        'gu': 'in',     // Gujarati -> India
        'ha': 'ng',     // Hausa -> Nigeria
        'he': 'il',     // Hebrew -> Israel
        'hi': 'in',     // Hindi -> India
        'hu': 'hu',     // Hungarian -> Hungary
        'is': 'is',     // Icelandic -> Iceland
        'id': 'id',     // Indonesian -> Indonesia
        'ga': 'ie',     // Irish -> Ireland
        'it': 'it',     // Italian -> Italy
        'ja': 'jp',     // Japanese -> Japan
        'jv': 'id',     // Javanese -> Indonesia
        'kn': 'in',     // Kannada -> India
        'kk': 'kz',     // Kazakh -> Kazakhstan
        'km': 'kh',     // Khmer -> Cambodia
        'ky': 'kg',     // Kyrgyz -> Kyrgyzstan
        'ko': 'kr',     // Korean -> South Korea
        'ku': 'tr',     // Kurdish -> Turkey (Default)
        'ckb': 'iq',    // Sorani -> Iraq (Kurdistan Region)
        'la': 'va',     // Latin -> Vatican City
        'lv': 'lv',     // Latvian -> Latvia
        'lt': 'lt',     // Lithuanian -> Lithuania
        'lb': 'lu',     // Luxemburgisch -> Luxenbourg
        'mk': 'mk',     // Macedonian -> North Macedonia
        'ms': 'my',     // Malay -> Malaysia
        'ml': 'in',     // Malayalam -> India
        'mt': 'mt',     // Maltese -> Malta
        'mr': 'in',     // Marathi -> India
        'mn': 'mn',     // Mongolian -> Mongolia
        'ne': 'np',     // Nepalese -> Nepal
        'no': 'no',     // Norwegian -> Norway
        'fa': 'ir',     // Farsi/Persian -> Iran
        'fa-af': 'af',  // Dari -> Afghanistan
        'prs': 'af',    // Dari -> Afghanistan
        'ps': 'af',     // Pashto -> Afghanistan
        'pl': 'pl',     // Polish -> Poland
        'pt': 'pt',     // Portuguese -> Portugal
        'pt-br': 'br',  // Brazilian -> Brazil
        'pa': 'in',     // Punjabi -> India
        'qu': 'pe',     // Quechua -> Peru
        'ro': 'ro',     // Romanian -> Romania
        'ru': 'ru',     // Russian -> Russia
        'si': 'lk',     // Sinhala -> Sri Lanka
        'sr': 'rs',     // Serbian -> Serbia
        'sk': 'sk',     // Slovak -> Slovakia
        'sl': 'si',     // Slovenian -> Slovenia
        'so': 'so',     // Somali -> Somalia
        'es': 'es',     // Spanish -> Spain
        'sw': 'tz',     // Swahili -> Tanzania
        'sv': 'se',     // Swedish -> Sweden
        'tg': 'tj',     // Tajik -> Tajikistan
        'tl': 'ph',     // Tagalog -> Philippines
        'ta': 'in',     // Tamil -> India
        'te': 'in',     // Telugu -> India
        'th': 'th',     // Thai -> Thailand
        'ti': 'er',     // Tigrinya -> Eritrea
        'tr': 'tr',     // Turkish -> Turkey
        'tk': 'tm',     // Turkmen -> Turkmenistan
        'uk': 'ua',     // Ukrainian -> Ukraine
        'ur': 'pk',     // Urdu -> Pakistan
        'uz': 'uz',     // Uzbek -> Uzbekistan
        'vi': 'vn',     // Vietnamese -> Vietnam
        'cy': 'gb-wls', // Welsh -> Wales
        'xh': 'za',     // Xhosa -> South Africa
        'yi': 'il',     // Yiddisch -> Israel
        'yo': 'ng',     // Yoruba -> Nigeria
        'zu': 'za',     // Zulu -> South Africa
    };

    const flagCode = map[c] || c;
    // Using w80 for larger, clearer bitmap
    return `https://flagcdn.com/w80/${flagCode}.png`;
};
