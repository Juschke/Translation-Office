export const langLabels: Record<string, string> = {
    'de': 'Deutsch',
    'en': 'Englisch',
    'fr': 'Französisch',
    'es': 'Spanisch',
    'it': 'Italienisch',
    'ru': 'Russisch',
    'tr': 'Türkisch',
    'pl': 'Polnisch',
    'uk': 'Ukrainisch',
    'ar': 'Arabisch',
    'zh': 'Chinesisch',
    'pt': 'Portugiesisch',
    'nl': 'Niederländisch',
    'cs': 'Tschechisch',
    'da': 'Dänisch',
    'el': 'Griechisch',
    'et': 'Estnisch',
    'ja': 'Japanisch',
    'ko': 'Koreanisch',
    'sv': 'Schwedisch',
    'ro': 'Rumänisch',
    'bg': 'Bulgarisch',
    'hu': 'Ungarisch',
    'fi': 'Finnisch',
    'no': 'Norwegisch',
    'hr': 'Kroatisch',
    'sr': 'Serbisch',
    'sk': 'Slowakisch',
    'sl': 'Slowenisch',
    'lt': 'Litauisch',
    'lv': 'Lettisch'
};

export const getLanguageLabel = (code: string) => {
    if (!code) return '';
    const cleanCode = code.split('-')[0].toLowerCase();
    return langLabels[cleanCode] || code.toUpperCase();
};
