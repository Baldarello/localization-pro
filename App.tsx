import React, { useState, useMemo, useEffect } from 'react';
import { Project, Term, Language, User, Role } from './types';
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
import { UserGroupIcon } from './components/icons';

// --- MOCK DATA ---
const USERS: User[] = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A' },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B' },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C' },
];

const INITIAL_PROJECTS: Project[] = [
    {
        id: 'proj-1',
        name: 'Sample Web App',
        defaultLanguageCode: 'en',
        languages: [AVAILABLE_LANGUAGES[0], AVAILABLE_LANGUAGES[1], AVAILABLE_LANGUAGES[2]],
        terms: [
            { id: 'term-1', text: 'welcome_message', translations: { 'en': 'Welcome to our application!', 'it': 'Benvenuto nella nostra applicazione!', 'es': '¡Bienvenido a nuestra aplicación!' } },
            { id: 'term-2', text: 'button_submit', translations: { 'en': 'Submit', 'it': 'Invia', 'es': 'Enviar' } },
        ],
        team: {
            'user-1': { role: 'admin', languages: ['en', 'it', 'es'] },
            'user-2': { role: 'editor', languages: ['it'] },
            'user-3': { role: 'translator', languages: ['es'] },
        },
    },
    {
        id: 'proj-2',
        name: 'Mobile Game',
        defaultLanguageCode: 'en',
        languages: [AVAILABLE_LANGUAGES[0], AVAILABLE_LANGUAGES[3]],
        terms: [
            { id: 'term-3', text: 'start_game', translations: { 'en': 'Start Game', 'de': 'Spiel starten' } },
        ],
        team: {
            'user-1': { role: 'admin', languages: ['en', 'de'] }
        },
    },
];
// --- END MOCK DATA ---

type View = 'login' | 'register' | 'forgotPassword' | 'app';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [view, setView] = useState<View>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
    const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const selectedTerm = useMemo(() => selectedProject?.terms.find(t => t.id === selectedTermId), [selectedProject, selectedTermId]);
    const currentUserRole = useMemo(() => {
        if (!selectedProject || !currentUser) return null;
        return selectedProject.team[currentUser.id]?.role;
    }, [selectedProject, currentUser]);


    const handleLogin = async (email: string, pass: string) => {
        // Mock login: use 'password' for any user
        const user = USERS.find(u => u.email === email);
        if (user && pass === 'password') {
            setCurrentUser(user);
            const firstProject = projects[0];
            setSelectedProjectId(firstProject?.id || null);
            setSelectedTermId(firstProject?.terms[0]?.id || null);
            setView('app');
        } else {
            throw new Error('Invalid email or password.');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('login');
    };

    const handleSelectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
        const project = projects.find(p => p.id === projectId);
        setSelectedTermId(project?.terms[0]?.id || null);
    };
    
    const handleAddProject = (name: string) => {
        if (!currentUser) return;
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            languages: [AVAILABLE_LANGUAGES[0]],
            defaultLanguageCode: AVAILABLE_LANGUAGES[0].code,
            terms: [],
            team: { [currentUser.id]: { role: 'admin', languages: [AVAILABLE_LANGUAGES[0].code] } }
        };
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        setSelectedTermId(null);
    };
    
    const handleAddTerm = (termText: string) => {
        if (!selectedProjectId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        const newTerm: Term = {
            id: `term-${Date.now()}`,
            text: termText,
            translations: {},
        };
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? { ...p, terms: [...p.terms, newTerm] }
                : p
        ));
        setSelectedTermId(newTerm.id);
    };

    const handleUpdateTranslation = (langCode: string, value: string) => {
        if (!selectedProjectId || !selectedTermId) return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? {
                    ...p,
                    terms: p.terms.map(t =>
                        t.id === selectedTermId
                            ? { ...t, translations: { ...t.translations, [langCode]: value } }
                            : t
                    ),
                }
                : p
        ));
    };

    const handleUpdateTermText = (termId: string, newText: string) => {
        if (!selectedProjectId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? {
                    ...p,
                    terms: p.terms.map(t =>
                        t.id === termId ? { ...t, text: newText } : t
                    ),
                }
                : p
        ));
    };

    const handleUpdateProjectLanguages = (newLanguages: Language[]) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        setProjects(prev => prev.map(p => {
            if (p.id === selectedProjectId) {
                const newLangCodes = newLanguages.map(l => l.code);
                // If default language was removed, set a new one
                const newDefaultLang = newLangCodes.includes(p.defaultLanguageCode)
                    ? p.defaultLanguageCode
                    : newLangCodes[0] || '';
                
                // Clean up team permissions for removed languages
                const newTeam = { ...p.team };
                Object.keys(newTeam).forEach(userId => {
                    newTeam[userId].languages = newTeam[userId].languages.filter(code => newLangCodes.includes(code));
                });

                return { ...p, languages: newLanguages, defaultLanguageCode: newDefaultLang, team: newTeam };
            }
            return p;
        }));
    };
    
    const handleSetDefaultLanguage = (langCode: string) => {
         if (!selectedProjectId || currentUserRole !== 'admin') return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId ? { ...p, defaultLanguageCode: langCode } : p
        ));
    };
    
    const handleDeleteTerm = (termId: string) => {
        if (!selectedProjectId || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId ? { ...p, terms: p.terms.filter(t => t.id !== termId) } : p
        ));
        if (selectedTermId === termId) {
            const currentProject = projects.find(p => p.id === selectedProjectId);
            setSelectedTermId(currentProject?.terms.filter(t => t.id !== termId)[0]?.id || null);
        }
    };
    
    const handleAddMember = (email: string, role: Role) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        const userToAdd = USERS.find(u => u.email === email);
        if (!userToAdd) return;

        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? { ...p, team: { ...p.team, [userToAdd.id]: { role, languages: [] } } }
                : p
        ));
    };

    const handleRemoveMember = (userId: string) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        setProjects(prev => prev.map(p => {
            if (p.id === selectedProjectId) {
                const newTeam = { ...p.team };
                delete newTeam[userId];
                return { ...p, team: newTeam };
            }
            return p;
        }));
    };
    
    const handleUpdateMemberLanguages = (userId: string, assignedLanguages: string[]) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? { ...p, team: { ...p.team, [userId]: { ...p.team[userId], languages: assignedLanguages } } }
                : p
        ));
    };
    
    const handleUpdateMemberRole = (userId: string, role: Role) => {
        if (!selectedProjectId || currentUserRole !== 'admin') return;
        setProjects(prev => prev.map(p =>
            p.id === selectedProjectId
                ? { ...p, team: { ...p.team, [userId]: { ...p.team[userId], role } } }
                : p
        ));
    };

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
                        {selectedProject ? (
                            <>
                               <div className="flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
                                    <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
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
                                        terms={selectedProject.terms}
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
                    allUsers={USERS}
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
