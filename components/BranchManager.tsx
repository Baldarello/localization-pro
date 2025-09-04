import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { GitBranchIcon, ChevronDownIcon, CheckIcon, StarIcon, PlusIcon, SwitchHorizontalIcon, TrashIcon, XIcon } from './icons';

interface BranchManagerProps {
    project: Project;
    selectedBranchId: string;
    onSelectBranch: (branchId: string) => void;
    onAddBranch: (name: string, sourceBranchId: string) => void;
    onDeleteBranch: (branchId: string) => void;
    onSetDefaultBranch: (branchId: string) => void;
    onMergeBranch: (sourceBranchId: string) => void;
}

type ModalState = {
    isOpen: boolean;
    mode: 'create' | 'merge' | 'delete' | null;
    branchId?: string;
    branchName?: string;
}

const BranchManager: React.FC<BranchManagerProps> = ({ project, selectedBranchId, onSelectBranch, onAddBranch, onDeleteBranch, onSetDefaultBranch, onMergeBranch }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, mode: null });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const selectedBranch = project.branches.find(b => b.id === selectedBranchId);
    const defaultBranch = project.branches.find(b => b.id === project.defaultBranchId);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);
    
    const handleAction = (mode: ModalState['mode'], branchId?: string, branchName?: string) => {
        setModalState({ isOpen: true, mode, branchId, branchName });
        setIsDropdownOpen(false);
    };

    const BranchActionModal = () => {
        const [newBranchName, setNewBranchName] = useState('');
        const [sourceBranchId, setSourceBranchId] = useState(selectedBranchId);
        
        if (!modalState.isOpen) return null;

        const handleCreate = () => {
            if (newBranchName.trim()) {
                onAddBranch(newBranchName.trim(), sourceBranchId);
                setModalState({ isOpen: false, mode: null });
            }
        };

        const handleDelete = () => {
            if(modalState.branchId) {
                onDeleteBranch(modalState.branchId);
                setModalState({ isOpen: false, mode: null });
            }
        };
        
        const handleMerge = () => {
             if(modalState.branchId) {
                onMergeBranch(modalState.branchId);
                setModalState({ isOpen: false, mode: null });
            }
        }

        const renderContent = () => {
            switch(modalState.mode) {
                case 'create':
                    return (
                        <>
                           <h3 className="text-lg font-medium leading-6 text-light-text-primary dark:text-dark-text-primary mb-4">Create New Branch</h3>
                           <div className="space-y-4">
                                <div>
                                    <label htmlFor="branch-name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Branch Name</label>
                                    <input type="text" id="branch-name" value={newBranchName} onChange={e => setNewBranchName(e.target.value)} placeholder="e.g. feature/new-design" autoFocus className="mt-1 w-full px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="source-branch" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Source Branch</label>
                                    <select id="source-branch" value={sourceBranchId} onChange={e => setSourceBranchId(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        {project.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                           </div>
                           <div className="mt-6 flex justify-end space-x-2">
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setModalState({ isOpen: false, mode: null })}>Cancel</button>
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-indigo-700" onClick={handleCreate}>Create Branch</button>
                           </div>
                        </>
                    );
                case 'delete':
                    return (
                        <>
                           <h3 className="text-lg font-medium leading-6 text-red-600 dark:text-red-400 mb-2">Delete Branch</h3>
                           <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Are you sure you want to delete the branch "<b>{modalState.branchName}</b>"? This action cannot be undone.</p>
                           <div className="mt-6 flex justify-end space-x-2">
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setModalState({ isOpen: false, mode: null })}>Cancel</button>
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700" onClick={handleDelete}>Delete</button>
                           </div>
                        </>
                    );
                 case 'merge':
                    return (
                        <>
                           <h3 className="text-lg font-medium leading-6 text-light-text-primary dark:text-dark-text-primary mb-2">Merge Branch</h3>
                           <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Are you sure you want to merge "<b>{modalState.branchName}</b>" into "<b>{defaultBranch?.name}</b>"?</p>
                           <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">This will overwrite all terms in the default branch. This action cannot be undone.</p>
                           <div className="mt-6 flex justify-end space-x-2">
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => setModalState({ isOpen: false, mode: null })}>Cancel</button>
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-emerald-600" onClick={handleMerge}>Merge and Overwrite</button>
                           </div>
                        </>
                    );
                default: return null;
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
                    {renderContent()}
                </div>
            </div>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center px-3 py-1 text-sm font-medium text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
                <GitBranchIcon className="w-4 h-4 mr-2 text-light-text-secondary dark:text-dark-text-secondary" />
                <span>{selectedBranch?.name}</span>
                <ChevronDownIcon className={`w-5 h-5 ml-1 -mr-1 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div className="absolute left-0 w-72 mt-2 origin-top-left bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border divide-y divide-light-border dark:divide-dark-border rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {project.branches.map(branch => (
                            <div key={branch.id} onClick={() => { onSelectBranch(branch.id); setIsDropdownOpen(false); }}
                                className="flex items-center justify-between px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group"
                            >
                                <div className="flex items-center">
                                    {branch.id === selectedBranchId ? <CheckIcon className="w-4 h-4 mr-2 text-brand-primary"/> : <div className="w-4 mr-2"/>}
                                    <span>{branch.name}</span>
                                    {branch.id === project.defaultBranchId && <StarIcon className="w-3 h-3 ml-2 text-brand-accent"/>}
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                                     {branch.id !== project.defaultBranchId && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); handleAction('merge', branch.id, branch.name); }} className="p-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50" title="Merge into default"><SwitchHorizontalIcon className="w-4 h-4 text-emerald-500"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); onSetDefaultBranch(branch.id); }} className="p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50" title="Set as default"><StarIcon className="w-4 h-4 text-gray-400 hover:text-brand-accent"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleAction('delete', branch.id, branch.name); }} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Delete branch"><TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500"/></button>
                                        </>
                                     )}
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="p-2">
                        <button onClick={() => handleAction('create')} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-secondary rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-all duration-200">
                            <PlusIcon className="w-4 h-4 mr-2"/>
                            New Branch
                        </button>
                    </div>
                </div>
            )}
            <BranchActionModal/>
        </div>
    );
};

export default BranchManager;