import React, { useState } from 'react';
import { Project } from '../types';
import { PlusIcon, FolderIcon } from './icons';

interface ProjectSidebarProps {
    projects: Project[];
    selectedProjectId: string | null;
    onSelectProject: (id: string) => void;
    onAddProject: (name: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projects, selectedProjectId, onSelectProject, onAddProject }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddProject = () => {
        if (newProjectName.trim()) {
            onAddProject(newProjectName.trim());
            setNewProjectName('');
            setIsAdding(false);
        }
    };
    
    return (
        <aside className="w-64 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex flex-col shadow-lg">
            <div className="p-4 border-b border-light-border dark:border-dark-border">
                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">Projects</h2>
            </div>
            <nav className="flex-1 overflow-y-auto">
                <ul>
                    {projects.map(project => (
                        <li key={project.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); onSelectProject(project.id); }}
                                className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                                    selectedProjectId === project.id
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-brand-primary border-l-4 border-brand-primary'
                                        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <FolderIcon className="w-5 h-5"/>
                                <span>{project.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-light-border dark:border-dark-border">
                {isAdding ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="New project name"
                            className="w-full px-3 py-2 text-sm text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={handleAddProject}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 px-4 py-2 text-sm font-semibold text-light-text-primary dark:text-dark-text-primary bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-brand-secondary rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-all duration-200"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        New Project
                    </button>
                )}
            </div>
        </aside>
    );
};

export default ProjectSidebar;