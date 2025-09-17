
import { Language } from './types';

export const AVAILABLE_LANGUAGES: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italian' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
];

export const getFlagCode = (langCode: string): string => {
    switch (langCode) {
        case 'en': return 'gb';
        case 'ja': return 'jp';
        case 'zh': return 'cn';
        case 'ar': return 'sa'; // Using Saudi Arabia for Arabic as a common representation
        default: return langCode;
    }
};
