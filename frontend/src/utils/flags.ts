export const getFlagUrl = (code: string) => {
 if (!code) return '';

 const original = code.toLowerCase().trim();
 let c = original;

 // Special cases for language codes that don't match country codes
 const map: Record<string, string> = {
 'af': 'za', // Afrikaans -> South Africa
 'sq': 'al', // Albanian -> Albania
 'am': 'et', // Amharisch -> Ethiopia
 'ar': 'sa', // Arabic -> Saudi Arabia
 'hy': 'am', // Armenian -> Armenia
 'az': 'az', // Azerbaijani -> Azerbaijan
 'be': 'by', // Belarusian -> Belarus
 'bn': 'bd', // Bengali -> Bangladesh
 'bs': 'ba', // Bosnian -> Bosnia
 'bg': 'bg', // Bulgarian -> Bulgaria
 'my': 'mm', // Burmese -> Myanmar
 'zh': 'cn', // Chinese -> China
 'hr': 'hr', // Croatian -> Croatia
 'cs': 'cz', // Czech -> Czechia
 'da': 'dk', // Danish -> Denmark
 'nl': 'nl', // Dutch -> Netherlands
 'en': 'gb', // English -> UK (Default)
 'et': 'ee', // Estonian -> Estonia
 'fi': 'fi', // Finnish -> Finland
 'fr': 'fr', // French -> France
 'ka': 'ge', // Georgian -> Georgia
 'de': 'de', // German -> Germany
 'el': 'gr', // Greek -> Greece
 'he': 'il', // Hebrew -> Israel
 'hi': 'in', // Hindi -> India
 'hu': 'hu', // Hungarian -> Hungary
 'is': 'is', // Icelandic -> Iceland
 'id': 'id', // Indonesian -> Indonesia
 'ga': 'ie', // Irish -> Ireland
 'it': 'it', // Italian -> Italy
 'ja': 'jp', // Japanese -> Japan
 'ko': 'kr', // Korean -> South Korea
 'lv': 'lv', // Latvian -> Latvia
 'lt': 'lt', // Lithuanian -> Lithuania
 'ms': 'my', // Malay -> Malaysia
 'mt': 'mt', // Maltese -> Malta
 'mn': 'mn', // Mongolian -> Mongolia
 'ne': 'np', // Nepalese -> Nepal
 'no': 'no', // Norwegian -> Norway
 'fa': 'ir', // Farsi -> Iran
 'pl': 'pl', // Polish -> Poland
 'pt': 'pt', // Portuguese -> Portugal
 'ro': 'ro', // Romanian -> Romania
 'ru': 'ru', // Russian -> Russia
 'sr': 'rs', // Serbian -> Serbia
 'sk': 'sk', // Slovak -> Slovakia
 'sl': 'si', // Slovenian -> Slovenia
 'es': 'es', // Spanish -> Spain
 'sv': 'se', // Swedish -> Sweden
 'th': 'th', // Thai -> Thailand
 'tr': 'tr', // Turkish -> Turkey
 'uk': 'ua', // Ukrainian -> Ukraine
 'ur': 'pk', // Urdu -> Pakistan
 'uz': 'uz', // Uzbek -> Uzbekistan
 'vi': 'vn', // Vietnamese -> Vietnam
 'prs': 'af', // Dari -> Afghanistan
 'ps': 'af', // Pashto -> Afghanistan
 'ca': 'es-ct', // Catalan -> Catalonia (Region)
 'eu': 'es-pv', // Basque -> Basque Country (Region)
 'gl': 'es-ga', // Galician -> Galicia (Region)
 'cy': 'gb-wls', // Welsh -> Wales
 'so': 'so', // Somali -> Somalia
 'sw': 'ke', // Swahili -> Kenya
 'ti': 'er', // Tigrinya -> Eritrea
 };

 // 1. Try full code mapping (e.g. 'ca-es' -> 'es-ct' or 'de' -> 'de')
 if (map[c]) return `https://flagcdn.com/w80/${map[c]}.png`;

 // 2. Try falling back to the country part for locales (e.g. 'en-us' -> 'us')
 if (c.includes('-')) {
 const parts = c.split('-');
 const country = parts[parts.length - 1];
 // If country part is in map (e.g. 'en-gb' -> 'gb'), use mapped value
 if (map[country]) return `https://flagcdn.com/w80/${map[country]}.png`;
 // Use the country code directly
 return `https://flagcdn.com/w80/${country}.png`;
 }

 // 3. Last fallback
 return `https://flagcdn.com/w80/${c}.png`;
};

export const getLanguageName = (code: string): string => {
 if (!code) return code;
 const c = code.toLowerCase().trim();
 const names: Record<string, string> = {
 'af': 'Afrikaans', 'sq': 'Albanisch', 'am': 'Amharisch', 'ar': 'Arabisch',
 'hy': 'Armenisch', 'az': 'Aserbaidschanisch', 'be': 'Weißrussisch', 'bn': 'Bengalisch',
 'bs': 'Bosnisch', 'bg': 'Bulgarisch', 'my': 'Birmanisch', 'zh': 'Chinesisch',
 'hr': 'Kroatisch', 'cs': 'Tschechisch', 'da': 'Dänisch', 'nl': 'Niederländisch',
 'en': 'Englisch', 'et': 'Estnisch', 'fi': 'Finnisch', 'fr': 'Französisch',
 'ka': 'Georgisch', 'de': 'Deutsch', 'el': 'Griechisch', 'he': 'Hebräisch',
 'hi': 'Hindi', 'hu': 'Ungarisch', 'is': 'Isländisch', 'id': 'Indonesisch',
 'ga': 'Irisch', 'it': 'Italienisch', 'ja': 'Japanisch', 'ko': 'Koreanisch',
 'lv': 'Lettisch', 'lt': 'Litauisch', 'ms': 'Malaiisch', 'mt': 'Maltesisch',
 'mn': 'Mongolisch', 'ne': 'Nepalesisch', 'no': 'Norwegisch', 'fa': 'Persisch (Farsi)',
 'pl': 'Polnisch', 'pt': 'Portugiesisch', 'ro': 'Rumänisch', 'ru': 'Russisch',
 'sr': 'Serbisch', 'sk': 'Slowakisch', 'sl': 'Slowenisch', 'es': 'Spanisch',
 'sv': 'Schwedisch', 'th': 'Thailändisch', 'tr': 'Türkisch', 'uk': 'Ukrainisch',
 'ur': 'Urdu', 'uz': 'Usbekisch', 'vi': 'Vietnamesisch', 'prs': 'Dari',
 'ps': 'Paschtu', 'ca': 'Katalanisch', 'eu': 'Baskisch', 'gl': 'Galizisch',
 'cy': 'Walisisch', 'so': 'Somali', 'sw': 'Swahili', 'ti': 'Tigrinya',
 };
 return names[c] || code.toUpperCase();
};
