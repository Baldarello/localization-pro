import { Language } from './types';

export const AVAILABLE_LANGUAGES: Language[] = [
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'ko', name: 'Korean' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'es', name: 'Spanish' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
];

// This map handles special cases where the ISO 639-1 language code
// does not match the ISO 3166-1 alpha-2 country code for the flag.
const LANG_CODE_TO_FLAG_CODE_MAP: { [key: string]: string } = {
    // Single language -> country mappings
    af: 'za', // Afrikaans -> South Africa
    ar: 'sa', // Arabic -> Saudi Arabia (a common representation)
    be: 'by', // Belarusian -> Belarus
    bn: 'bd', // Bengali -> Bangladesh
    bs: 'ba', // Bosnian -> Bosnia and Herzegovina
    cs: 'cz', // Czech -> Czech Republic
    cy: 'gb', // Welsh -> Great Britain (specifically Wales, but gb is used)
    da: 'dk', // Danish -> Denmark
    el: 'gr', // Greek -> Greece
    en: 'gb', // English -> Great Britain
    et: 'ee', // Estonian -> Estonia
    fa: 'ir', // Persian -> Iran
    ga: 'ie', // Irish -> Ireland
    he: 'il', // Hebrew -> Israel
    hy: 'am', // Armenian -> Armenia
    ja: 'jp', // Japanese -> Japan
    ka: 'ge', // Georgian -> Georgia
    kk: 'kz', // Kazakh -> Kazakhstan
    km: 'kh', // Khmer -> Cambodia
    ko: 'kr', // Korean -> South Korea
    ky: 'kg', // Kyrgyz -> Kyrgyzstan
    lo: 'la', // Lao -> Laos
    mi: 'nz', // Maori -> New Zealand
    ms: 'my', // Malay -> Malaysia
    ne: 'np', // Nepali -> Nepal
    si: 'lk', // Sinhala -> Sri Lanka
    sl: 'si', // Slovenian -> Slovenia
    sq: 'al', // Albanian -> Albania
    sr: 'rs', // Serbian -> Serbia
    sv: 'se', // Swedish -> Sweden
    sw: 'ke', // Swahili -> Kenya
    uk: 'ua', // Ukrainian -> Ukraine
    ur: 'pk', // Urdu -> Pakistan
    vi: 'vn', // Vietnamese -> Vietnam
    zh: 'cn', // Chinese -> China

    // Grouped languages (e.g., multiple languages primarily from one country)
    hi: 'in', // Hindi
    gu: 'in', // Gujarati
    kn: 'in', // Kannada
    ml: 'in', // Malayalam
    mr: 'in', // Marathi
    pa: 'in', // Punjabi
    ta: 'in', // Tamil
    te: 'in', // Telugu

    eu: 'es', // Basque
    ca: 'es', // Catalan
    gl: 'es', // Galician
};

export const getFlagCode = (langCode: string): string => {
    return LANG_CODE_TO_FLAG_CODE_MAP[langCode] || langCode;
};

export const ApiKeyPermissions = Object.freeze({
    ReadOnly: 'readonly',
    Edit: 'edit',
    Admin: 'admin',
});