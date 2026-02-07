export const getFlagUrl = (code: string) => {
    if (!code) return '';

    // Normalize code (e.g., "de-DE" -> "de", "US" -> "us")
    let c = code.toLowerCase().trim();

    // If it's a full locale (e.g., de-de), take the region part if it exists
    if (c.includes('-')) {
        const parts = c.split('-');
        // For locales like en-US, pt-BR, the second part is the country
        c = parts[parts.length - 1];
    }

    // Special cases for language codes that don't match country codes
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
        'zh': 'cn',     // Chinese -> China
        'hr': 'hr',     // Croatian -> Croatia
        'cs': 'cz',     // Czech -> Czechia
        'da': 'dk',     // Danish -> Denmark
        'nl': 'nl',     // Dutch -> Netherlands
        'en': 'gb',     // English -> UK (Default)
        'et': 'ee',     // Estonian -> Estonia
        'fi': 'fi',     // Finnish -> Finland
        'fr': 'fr',     // French -> France
        'ka': 'ge',     // Georgian -> Georgia
        'de': 'de',     // German -> Germany
        'el': 'gr',     // Greek -> Greece
        'he': 'il',     // Hebrew -> Israel
        'hi': 'in',     // Hindi -> India
        'hu': 'hu',     // Hungarian -> Hungary
        'is': 'is',     // Icelandic -> Iceland
        'id': 'id',     // Indonesian -> Indonesia
        'ga': 'ie',     // Irish -> Ireland
        'it': 'it',     // Italian -> Italy
        'ja': 'jp',     // Japanese -> Japan
        'ko': 'kr',     // Korean -> South Korea
        'lv': 'lv',     // Latvian -> Latvia
        'lt': 'lt',     // Lithuanian -> Lithuania
        'ms': 'my',     // Malay -> Malaysia
        'mt': 'mt',     // Maltese -> Malta
        'mn': 'mn',     // Mongolian -> Mongolia
        'ne': 'np',     // Nepalese -> Nepal
        'no': 'no',     // Norwegian -> Norway
        'fa': 'ir',     // Farsi -> Iran
        'pl': 'pl',     // Polish -> Poland
        'pt': 'pt',     // Portuguese -> Portugal
        'ro': 'ro',     // Romanian -> Romania
        'ru': 'ru',     // Russian -> Russia
        'sr': 'rs',     // Serbian -> Serbia
        'sk': 'sk',     // Slovak -> Slovakia
        'sl': 'si',     // Slovenian -> Slovenia
        'es': 'es',     // Spanish -> Spain
        'sv': 'se',     // Swedish -> Sweden
        'th': 'th',     // Thai -> Thailand
        'tr': 'tr',     // Turkish -> Turkey
        'uk': 'ua',     // Ukrainian -> Ukraine
        'ur': 'pk',     // Urdu -> Pakistan
        'uz': 'uz',     // Uzbek -> Uzbekistan
        'vi': 'vn',     // Vietnamese -> Vietnam
        'prs': 'af',    // Dari -> Afghanistan
        'ps': 'af',     // Pashto -> Afghanistan
        'ca': 'es-ct',  // Catalan -> Catalonia (Region)
        'eu': 'es-pv',  // Basque -> Basque Country (Region)
        'gl': 'es-ga',  // Galician -> Galicia (Region)
        'cy': 'gb-wls', // Welsh -> Wales
    };

    const flagCode = map[c] || c;

    // Return FlagCDN URL (w80 for clarity)
    return `https://flagcdn.com/w80/${flagCode}.png`;
};
