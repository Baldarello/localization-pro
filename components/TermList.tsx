import React, { useState, useMemo } from 'react';
import { Term, Project, User, Role } from '../types';
import { PlusIcon, TrashIcon, SearchIcon } from './icons';

interface TermListProps {
    terms: Term[];
    project: Project;
    currentUser: User | null;
    currentUserRole: Role | null;
    selectedTermId: string | null;
    onSelectTerm: (id: string) => void;
    onAddTerm: (term: string) => void;
    onDeleteTerm: (termId: string) => void;
}

const TermList: React.FC<TermListProps> = ({ terms, project, currentUser, currentUserRole, selectedTermId, onSelectTerm, onAddTerm, onDeleteTerm }) => {
    const [newTerm, setNewTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false);

    const handleAddTerm = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTerm.trim()) {
            onAddTerm(newTerm.trim());
            setNewTerm('');
        }
    };

    const getCompletionPercentage = (term: Term) => {
        const translatedCount = project.languages.filter(lang => term.translations[lang.code]?.trim()).length;
        return project.languages.length > 0 ? (translatedCount / project.languages.length) * 100 : 0;
    };

    const filteredTerms = useMemo(() => {
        const userAssignedLangs = (currentUser && project.team[currentUser.id]?.languages) || [];

        return terms.filter(term => {
            const matchesSearch = term.text.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (showUntranslatedOnly) {
                if (userAssignedLangs.length === 0) return true; // Show all if user has no assigned languages to filter by
                const isMissingTranslation = userAssignedLangs.some(langCode => !term.translations[langCode]?.trim());
                return isMissingTranslation;
            }

            return true;
        });
    }, [terms, searchQuery, showUntranslatedOnly, project.team, currentUser]);

    const canManageTerms = currentUserRole === 'admin' || currentUserRole === 'editor';

    return (
        <div className="w-1/3 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex flex-col">
            <div className="p-4 border-b border-light-border dark:border-dark-border space-y-4">
                 <div className="space-y-2">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search terms..."
                            className="w-full pl-10 pr-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                        />
                    </div>
                    <label className="flex items-center justify-end space-x-2 cursor-pointer text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        <span className="font-medium">Show untranslated (for you)</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={showUntranslatedOnly}
                                onChange={() => setShowUntranslatedOnly(!showUntranslatedOnly)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${showUntranslatedOnly ? 'bg-brand-secondary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showUntranslatedOnly ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>
                {canManageTerms && (
                    <form onSubmit={handleAddTerm} className="flex space-x-2">
                        <input
                            type="text"
                            value={newTerm}
                            onChange={(e) => setNewTerm(e.target.value)}
                            placeholder="Add new term key"
                            className="flex-1 px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 font-semibold text-white bg-brand-primary rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex items-center"
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredTerms.map(term => {
                    const completion = getCompletionPercentage(term);
                    return (
                        <div
                            key={term.id}
                            onClick={() => onSelectTerm(term.id)}
                            className={`p-4 border-b border-light-border dark:border-dark-border cursor-pointer group relative ${
                                selectedTermId === term.id ? 'bg-indigo-50 dark:bg-gray-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <p className={`text-sm font-medium ${selectedTermId === term.id ? 'text-brand-primary' : 'text-light-text-primary dark:text-dark-text-primary'}`}>
                                    {term.text}
                                </p>
                                {canManageTerms && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onDeleteTerm(term.id); }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className="bg-brand-secondary h-1.5 rounded-full"
                                        style={{ width: `${completion}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{Math.round(completion)}% complete</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TermList;
