import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { AVAILABLE_LANGUAGES } from '../constants';
import { CheckIcon, ChevronDownIcon, GlobeIcon, StarIcon } from './icons';

interface LanguageSelectorProps {
    projectLanguages: Language[];
    defaultLanguageCode: string;
    onUpdateLanguages: (languages: Language[]) => void;
    onSetDefaultLanguage: (langCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ projectLanguages, defaultLanguageCode, onUpdateLanguages, onSetDefaultLanguage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isSelected = (lang: Language) => projectLanguages.some(l => l.code === lang.code);

    const handleToggleLanguage = (lang: Language) => {
        let newLanguages;
        if (isSelected(lang)) {
            // Prevent removing the default language if it's the last one
            if (projectLanguages.length === 1 && lang.code === defaultLanguageCode) return;
            newLanguages = projectLanguages.filter(l => l.code !== lang.code);
        } else {
            newLanguages = [...projectLanguages, lang];
        }
        onUpdateLanguages(newLanguages);
    };
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
                <GlobeIcon className="w-5 h-5 mr-2 text-light-text-secondary dark:text-dark-text-secondary" />
                <span>Manage Languages</span>
                <ChevronDownIcon className={`w-5 h-5 ml-2 -mr-1 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 w-72 mt-2 origin-top-right bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border divide-y divide-light-border dark:divide-dark-border rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="p-2">
                        <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary px-2 py-1">Project Languages</p>
                    </div>
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {AVAILABLE_LANGUAGES.map(lang => (
                            <div
                                key={lang.code}
                                onClick={() => handleToggleLanguage(lang)}
                                className="flex items-center justify-between px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                            >
                                <div className="flex items-center">
                                    <span className={`flag-icon flag-icon-${lang.code === 'en' ? 'gb' : lang.code} mr-3`}></span>
                                    <span>{lang.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                     {isSelected(lang) && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSetDefaultLanguage(lang.code); }}
                                            className="p-1 rounded-full group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50"
                                        >
                                            <StarIcon className={`w-4 h-4 ${lang.code === defaultLanguageCode ? 'text-brand-accent' : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-500'}`} />
                                        </button>
                                     )}
                                    {isSelected(lang) && <CheckIcon className="w-5 h-5 text-brand-secondary" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;