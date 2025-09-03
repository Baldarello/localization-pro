import React, { useState, useRef, useEffect } from 'react';
import { User, Project, Role } from '../types';
import { UserGroupIcon, XIcon, TrashIcon, ChevronDownIcon } from './icons';

interface TeamManagerProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onRemoveMember: (userId: string) => void;
    onAddMember: (email: string, role: Role) => void;
    onUpdateMemberLanguages: (userId: string, assignedLanguages: string[]) => void;
    onUpdateMemberRole: (userId: string, role: Role) => void;
    allUsers: User[];
}

const TeamManager: React.FC<TeamManagerProps> = ({ isOpen, onClose, project, onRemoveMember, onAddMember, onUpdateMemberLanguages, onUpdateMemberRole, allUsers }) => {
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<Role>('translator');
    const [error, setError] = useState('');
    const [managingUserId, setManagingUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const teamMemberIds = Object.keys(project.team);
    const teamMembers = teamMemberIds.map(id => allUsers.find(u => u.id === id)).filter((u): u is User => !!u);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setManagingUserId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;
    
    const handleAdd = () => {
        setError('');
        const trimmedEmail = newMemberEmail.trim();
        if (!trimmedEmail) {
            setError('Email cannot be empty.'); return;
        }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
            setError('Please enter a valid email address.'); return;
        }
        if (teamMembers.some(member => member.email === trimmedEmail)) {
            setError('This user is already a member of the project.'); return;
        }
        const userExists = allUsers.some(user => user.email === trimmedEmail);
        if (!userExists) {
            setError('No user found with this email address.'); return;
        }
        onAddMember(trimmedEmail, newMemberRole);
        setNewMemberEmail('');
        setNewMemberRole('translator');
    };

    const handleLanguageToggle = (userId: string, langCode: string) => {
        const currentLangs = project.team[userId]?.languages || [];
        const newLangs = currentLangs.includes(langCode)
            ? currentLangs.filter(code => code !== langCode)
            : [...currentLangs, langCode];
        onUpdateMemberLanguages(userId, newLangs);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-3xl m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center">
                    <div className="flex items-center">
                        <UserGroupIcon className="w-6 h-6 text-brand-primary mr-3" />
                        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Manage Team for "{project.name}"</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-4">Project Members</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {teamMembers.map(member => (
                            <div key={member.id} className="grid grid-cols-3 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-md gap-4">
                                <div className="flex items-center col-span-1">
                                    <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold text-lg mr-4 flex-shrink-0">
                                        {member.avatarInitials}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">{member.name}</p>
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{member.email}</p>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <select
                                        value={project.team[member.id]?.role}
                                        onChange={(e) => onUpdateMemberRole(member.id, e.target.value as Role)}
                                        className="w-full px-3 py-1.5 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary capitalize"
                                    >
                                        <option value="translator">Translator</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2 col-span-1 justify-end">
                                    <div className="relative" ref={managingUserId === member.id ? dropdownRef : null}>
                                        <button onClick={() => setManagingUserId(managingUserId === member.id ? null : member.id)} className="flex items-center px-3 py-1.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                            Languages
                                            <ChevronDownIcon className="w-4 h-4 ml-1" />
                                        </button>
                                        {managingUserId === member.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-lg z-10">
                                                <div className="py-1 max-h-40 overflow-y-auto">
                                                    {project.languages.map(lang => (
                                                        <label key={lang.code} className="flex items-center justify-between px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                                            <span>{lang.name}</span>
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                                checked={(project.team[member.id]?.languages || []).includes(lang.code)}
                                                                onChange={() => handleLanguageToggle(member.id, lang.code)}
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => onRemoveMember(member.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                         {teamMembers.length === 0 && (
                            <p className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">No members yet. Invite someone!</p>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                     <h3 className="text-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-4">Invite New Member</h3>
                     {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                     <div className="flex space-x-2 items-center">
                        <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="user@example.com"
                            className="flex-1 px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                        />
                         <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value as Role)}
                            className="px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary capitalize"
                        >
                            <option value="translator">Translator</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 font-semibold text-white bg-brand-secondary rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary flex items-center"
                        >
                            Invite
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamManager;
