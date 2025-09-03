import React, { useState, useEffect } from 'react';
import { Term, Project, User, Role } from '../types';
import { LockClosedIcon, StarIcon, PencilIcon } from './icons';

interface TranslationPanelProps {
    term: Term | undefined;
    project: Project;
    currentUser: User | null;
    currentUserRole: Role | null;
    onUpdateTranslation: (langCode: string, value: string) => void;
    onUpdateTermText: (termId: string, newText: string) => void;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ term, project, currentUser, currentUserRole, onUpdateTranslation, onUpdateTermText }) => {
    const [isEditingKey, setIsEditingKey] = useState(false);
    const [editedKeyText, setEditedKeyText] = useState('');

    useEffect(() => {
        if (term) {
            setEditedKeyText(term.text);
            setIsEditingKey(false);
        }
    }, [term]);

    if (!term) {
        return (
            <div className="flex-1 flex items-center justify-center bg-light-bg dark:bg-dark-bg">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-light-text-secondary dark:text-dark-text-secondary">Select a Term</h3>
                    <p className="mt-2 text-gray-400 dark:text-gray-500">Choose a term from the list to start translating.</p>
                </div>
            </div>
        );
    }
    
    const userPermissions = (currentUser && project.team[currentUser.id]?.languages) || [];
    const canEditKey = currentUserRole === 'admin' || currentUserRole === 'editor';
    
    const handleKeySave = () => {
        if (editedKeyText.trim() && editedKeyText !== term.text) {
            onUpdateTermText(term.id, editedKeyText.trim());
        }
        setIsEditingKey(false);
    };


    return (
        <div className="flex-1 flex flex-col overflow-y-auto bg-light-bg dark:bg-dark-bg p-6">
            <div className="mb-6 pb-4 border-b border-light-border dark:border-dark-border">
                <div className="flex items-center group">
                    {isEditingKey && canEditKey ? (
                         <input
                            type="text"
                            value={editedKeyText}
                            onChange={(e) => setEditedKeyText(e.target.value)}
                            onBlur={handleKeySave}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleKeySave(); if(e.key === 'Escape') setIsEditingKey(false); }}
                            className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary bg-transparent border-b-2 border-brand-primary outline-none"
                            autoFocus
                        />
                    ) : (
                        <h3 className={`text-2xl font-bold text-light-text-primary dark:text-dark-text-primary ${canEditKey ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md px-2' : ''}`} onClick={() => canEditKey && setIsEditingKey(true)}>
                           {term.text}
                        </h3>
                    )}
                    {canEditKey && !isEditingKey && (
                        <button onClick={() => setIsEditingKey(true)} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Translate this term for the selected languages.</p>
            </div>
            <div className="space-y-6">
                {project.languages.map(lang => {
                    const isDefault = lang.code === project.defaultLanguageCode;
                    const canEdit = userPermissions.includes(lang.code);

                    return (
                        <div key={lang.code}>
                            <label className="flex items-center text-md font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                                <span className={`flag-icon flag-icon-${lang.code === 'en' ? 'gb' : lang.code} mr-3`}></span>
                                {lang.name}
                                {isDefault && <StarIcon className="w-4 h-4 ml-2 text-brand-accent" />}
                                {!canEdit && <LockClosedIcon className="w-4 h-4 ml-2 text-light-text-secondary dark:text-dark-text-secondary" />}
                            </label>
                            <textarea
                                value={term.translations[lang.code] || ''}
                                onChange={(e) => onUpdateTranslation(lang.code, e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm transition-all placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70 ${
                                    !canEdit ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
                                }`}
                                placeholder={`Translation in ${lang.name}...`}
                                readOnly={!canEdit}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TranslationPanel;
