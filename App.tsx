import React, { useState, useMemo, useEffect } from 'react';
import { Project, Term, Language, User, Role, Branch } from './types';
import { AVAILABLE_LANGUAGES } from './constants';
import ProjectSidebar from './components/ProjectSidebar';
import TermList from './components/TermList';
import TranslationPanel from './components/TranslationPanel';
import Header from './components/Header';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import LanguageSelector from './components/LanguageSelector';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import TeamManager from './components/TeamManager';
import { UserGroupIcon, TranslateIcon } from './components/icons';
import BranchManager from './components/BranchManager';
import apiClient from './apiClient';


type View = 'login' | 'register' | 'forgotPassword' | 'app';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<Theme>('light');
    const [isLoading, setIsLoading] = useState(true);

    // Data state
    const [projects, setProjects] = useState<Project[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);

    // UI state
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
    const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
    const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const loadAppData = async () => {
        setIsLoading(true);
        try {
            const [fetchedProjects, fetchedUsers] = await Promise.all([
                apiClient.fetchProjects(),
                apiClient.fetchUsers()
            ]);
            setProjects(fetchedProjects);
            setAllUsers(fetchedUsers);
            if (fetchedProjects.length > 0) {
                 handleSelectProject(fetchedProjects[0].id, fetchedProjects);
            }
        } catch (error) {
            console.error("Failed to load app data", error);
            // Handle error (e.g., show a toast notification)
        } finally {
            setIsLoading(false);
        }
    };

    // --- Derived State ---
    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const selectedBranch = useMemo(() => selectedProject?.branches.find(b => b.id === selectedBranchId), [selectedProject, selectedBranchId]);
    const selectedTerm = useMemo(() => selectedBranch?.terms.find(t => t.id === selectedTermId), [selectedBranch, selectedTermId]);
    const currentUserRole = useMemo(() => {
        if (!selectedProject || !currentUser) return null;
        return selectedProject.team[currentUser.id]?.role;
    }, [selectedProject, currentUser]);


    // --- Handlers ---
    const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

    const handleLogin = async (email: string, pass: string) => {
        const user = await apiClient.login(email, pass);
        setCurrentUser(user);
        await loadAppData();
        setView('app');
    };

    const handleLogout = async () => {
        await apiClient.logout();
        setCurrentUser(null);
        setProjects([]);
        setAllUsers([]);
        setSelectedProjectId(null);
        setView('login');
    };

    const handleSelectProject = (projectId: string, currentProjects: Project[] = projects) => {
        setSelectedProjectId(projectId);
        const project = currentProjects.find(p => p.id === projectId);
        const defaultBranchId = project?.defaultBranchId || project?.branches[0]?.id || null;
        setSelectedBranchId(defaultBranchId);
        const branch = project?.branches.find(b => b.id === defaultBranchId);
        setSelectedTermId(branch?.terms[0]?.id || null);
    };
    
    const handleAddProject = async (name: string) => {
        if (!currentUser) return;
        try {
            const newProject = await apiClient.addProject(name, currentUser);
            const updatedProjects = [...projects, newProject];
            setProjects(updatedProjects);
            handleSelectProject(newProject.id, updatedProjects);
        } catch (error) {
            console.error("Failed to add project", error);
        }
    };

    const handleSelectBranch = (branchId: string) => {
        setSelectedBranchId(branchId);
        const branch = selectedProject?.branches.find(b => b.id === branchId);
        setSelectedTermId(branch?.terms[0]?.id || null);
    };
    
    const handleAddTerm = async (termText: string) => {
        if (!selectedProjectId || !selectedBranchId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        try {
            const newTerm = await apiClient.addTerm(selectedProjectId, selectedBranchId, termText);
            setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    branches: p.branches.map(b => 
                        b.id === selectedBranchId ? { ...b, terms: [...b.terms, newTerm] } : b
                    )
                };
            }));
            setSelectedTermId(newTerm.id);
        } catch (error) {
            console.error("Failed to add term", error);
        }
    };

    const handleUpdateTranslation = async (langCode: string, value: string) => {
        if (!selectedProjectId || !selectedBranchId || !selectedTermId) return;
        try {
            const updatedTranslations = await apiClient.updateTranslation(selectedProjectId, selectedBranchId, selectedTermId, langCode, value);
            setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    branches: p.branches.map(b => {
                        if (b.id !== selectedBranchId) return b;
                        return {
                            ...b,
                            terms: b.terms.map(t =>
                                t.id === selectedTermId
                                    ? { ...t, translations: updatedTranslations }
                                    : t
                            ),
                        };
                    })
                };
            }));
        } catch (error) {
            console.error("Failed to update translation", error);
        }
    };

    const handleUpdateTermText = async (termId: string, newText: string) => {
        if (!selectedProjectId || !selectedBranchId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        try {
            await apiClient.updateTermText(selectedProjectId, selectedBranchId, termId, newText);
            setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    branches: p.branches.map(b => {
                        if (b.id !== selectedBranchId) return b;
                        return {
                            ...b,
                            terms: b.terms.map(t =>
                                t.id === termId ? { ...t, text: newText } : t
                            ),
                        };
                    })
                };
            }));
        } catch (error) {
            console.error("Failed to update term text", error);
        }
    };

    const handleUpdateProjectLanguages = async (newLanguages: Language[]) => {
        if (!selectedProjectId || currentUserRole !== 'admin' || !selectedProject) return;
        try {
            const newLangCodes = newLanguages.map(l => l.code);
            const newDefaultLang = newLangCodes.includes(selectedProject.defaultLanguageCode)
                ? selectedProject.defaultLanguageCode
                : newLangCodes[0] || '';

            const updatedProject = await apiClient.updateProjectLanguages(selectedProjectId, newLanguages, newDefaultLang);
            setProjects(prev => prev.map(p => (p.id === selectedProjectId ? updatedProject : p)));
        } catch (error) {
            console.error("Failed to update project languages", error);
        }
    };
    
    const handleSetDefaultLanguage = async (langCode: string) => {
         if (!selectedProjectId || currentUserRole !== 'admin') return;
        try {
            const updatedProject = await apiClient.setDefaultLanguage(selectedProjectId, langCode);
            setProjects(prev => prev.map(p => p.id === selectedProjectId ? updatedProject : p));
        } catch (error) {
            console.error("Failed to set default language", error);
        }
    };
    
    const handleDeleteTerm = async (termId: string) => {
        if (!selectedProjectId || !selectedBranchId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        try {
            await apiClient.deleteTerm(selectedProjectId, selectedBranchId, termId);
            setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    branches: p.branches.map(b =>
                        b.id === selectedBranchId ? { ...b, terms: b.terms.filter(t => t.id !== termId) } : b
                    )
                };
            }));

            if (selectedTermId === termId) {
                 const updatedBranch = projects.find(p => p.id === selectedProjectId)?.branches.find(b => b.id === selectedBranchId);
                setSelectedTermId(updatedBranch?.terms.filter(t => t.id !== termId)[0]?.id || null);
            }
        } catch (error) {
            console.error("Failed to delete term", error);
        }
    };

    // --- Branch Handlers ---
    const handleAddBranch = async (name: string, sourceBranchId: string) => {
        if (!selectedProject || currentUserRole !== 'admin') return;
        try {
            const newBranch = await apiClient.addBranch(selectedProject.id, name, sourceBranchId);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId ? { ...p, branches: [...p.branches, newBranch] } : p
            ));
            handleSelectBranch(newBranch.id);
        } catch (error) {
            console.error("Failed to add branch", error);
        }
    };
    
    const handleDeleteBranch = async (branchId: string) => {
        if (!selectedProject || currentUserRole !== 'admin' || branchId === selectedProject.defaultBranchId) return;
        try {
            await apiClient.deleteBranch(selectedProject.id, branchId);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId ? { ...p, branches: p.branches.filter(b => b.id !== branchId) } : p
            ));
            if (selectedBranchId === branchId) {
                handleSelectBranch(selectedProject.defaultBranchId);
            }
        } catch (error) {
            console.error("Failed to delete branch", error);
        }
    };

    const handleSetDefaultBranch = async (branchId: string) => {
        if (!selectedProject || currentUserRole !== 'admin') return;
        try {
            const updatedProject = await apiClient.setDefaultBranch(selectedProject.id, branchId);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId ? updatedProject : p
            ));
        } catch (error) {
            console.error("Failed to set default branch", error);
        }
    };

    const handleMergeBranch = async (sourceBranchId: string) => {
        if (!selectedProject || currentUserRole !== 'admin' || sourceBranchId === selectedProject.defaultBranchId) return;
        try {
            const targetBranchId = selectedProject.defaultBranchId;
            const updatedTargetBranch = await apiClient.mergeBranch(selectedProject.id, sourceBranchId, targetBranchId);
            
            setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    branches: p.branches.map(b =>
                        b.id === targetBranchId ? updatedTargetBranch : b
                    )
                };
            }));
        } catch (error) {
            console.error("Failed to merge branch", error);
        }
    };
    
    // --- Team Handlers ---
    const handleAddMember = async (email: string, role: Role) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        try {
            const updatedTeam = await apiClient.addMember(selectedProjectId, email, role);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId ? { ...p, team: updatedTeam } : p
            ));
        } catch (error) {
            console.error("Failed to add member", error);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        try {
            await apiClient.removeMember(selectedProjectId, userId);
            setProjects(prev => prev.map(p => {
                if (p.id === selectedProjectId) {
                    const newTeam = { ...p.team };
                    delete newTeam[userId];
                    return { ...p, team: newTeam };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to remove member", error);
        }
    };
    
    const handleUpdateMemberLanguages = async (userId: string, assignedLanguages: string[]) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        try {
            await apiClient.updateMemberLanguages(selectedProjectId, userId, assignedLanguages);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId
                    ? { ...p, team: { ...p.team, [userId]: { ...p.team[userId], languages: assignedLanguages } } }
                    : p
            ));
        } catch (error) {
            console.error("Failed to update member languages", error);
        }
    };
    
    const handleUpdateMemberRole = async (userId: string, role: Role) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        try {
            await apiClient.updateMemberRole(selectedProjectId, userId, role);
            setProjects(prev => prev.map(p =>
                p.id === selectedProjectId
                    ? { ...p, team: { ...p.team, [userId]: { ...p.team[userId], role } } }
                    : p
            ));
        } catch (error) {
            console.error("Failed to update member role", error);
        }
    };
    
    // --- Render Logic ---
    if (isLoading && view === 'app') {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-light-bg dark:bg-dark-bg">
                <div className="flex items-center space-x-3">
                    <TranslateIcon className="w-12 h-12 text-brand-primary animate-pulse" />
                    <h1 className="text-3xl font-bold text-light-text-secondary dark:text-dark-text-secondary">Loading...</h1>
                </div>
            </div>
        )
    }

    if (view === 'login') {
        return <LoginPage onLogin={handleLogin} onNavigateToRegister={() => setView('register')} onNavigateToForgotPassword={() => setView('forgotPassword')} />;
    }
    if (view === 'register') {
        return <RegisterPage onNavigateToLogin={() => setView('login')} />;
    }
    if (view === 'forgotPassword') {
        return <ForgotPasswordPage onNavigateToLogin={() => setView('login')} />;
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex flex-col h-screen font-sans bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary">
                <Header user={currentUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
                <div className="flex flex-1 overflow-hidden">
                    <ProjectSidebar
                        projects={projects}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={handleSelectProject}
                        onAddProject={handleAddProject}
                    />
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {selectedProject && selectedBranch ? (
                            <>
                               <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                                        {currentUserRole === 'admin' && (
                                            <BranchManager 
                                                project={selectedProject}
                                                selectedBranchId={selectedBranchId}
                                                onSelectBranch={handleSelectBranch}
                                                onAddBranch={handleAddBranch}
                                                onDeleteBranch={handleDeleteBranch}
                                                onSetDefaultBranch={handleSetDefaultBranch}
                                                onMergeBranch={handleMergeBranch}
                                            />
                                        )}
                                    </div>
                                    {currentUserRole === 'admin' && (
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setIsTeamManagerOpen(true)}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                            >
                                                <UserGroupIcon className="w-5 h-5 mr-2 text-light-text-secondary dark:text-dark-text-secondary" />
                                                Manage Team
                                            </button>
                                            <LanguageSelector
                                                projectLanguages={selectedProject.languages}
                                                defaultLanguageCode={selectedProject.defaultLanguageCode}
                                                onUpdateLanguages={handleUpdateProjectLanguages}
                                                onSetDefaultLanguage={handleSetDefaultLanguage}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 overflow-hidden">
                                    <TermList
                                        terms={selectedBranch.terms}
                                        project={selectedProject}
                                        currentUser={currentUser}
                                        currentUserRole={currentUserRole}
                                        selectedTermId={selectedTermId}
                                        onSelectTerm={setSelectedTermId}
                                        onAddTerm={handleAddTerm}
                                        onDeleteTerm={handleDeleteTerm}
                                    />
                                    <TranslationPanel
                                        term={selectedTerm}
                                        project={selectedProject}
                                        currentUser={currentUser}
                                        currentUserRole={currentUserRole}
                                        onUpdateTranslation={handleUpdateTranslation}
                                        onUpdateTermText={handleUpdateTermText}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <h2 className="text-2xl font-semibold text-light-text-secondary dark:text-dark-text-secondary">No Project Selected</h2>
                                    <p className="mt-2 text-gray-400 dark:text-gray-500">Please select a project from the sidebar or add a new one.</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {selectedProject && currentUserRole === 'admin' && (
                <TeamManager
                    isOpen={isTeamManagerOpen}
                    onClose={() => setIsTeamManagerOpen(false)}
                    project={selectedProject}
                    allUsers={allUsers}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
                    onUpdateMemberLanguages={handleUpdateMemberLanguages}
                    onUpdateMemberRole={handleUpdateMemberRole}
                />
            )}
        </DndProvider>
    );
};

export default App;