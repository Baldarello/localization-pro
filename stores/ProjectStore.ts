
import { makeAutoObservable } from 'mobx';
import { Project, Term, Language, User, UserRole } from '../types';
import { AVAILABLE_LANGUAGES } from '../constants';
import { RootStore } from './RootStore';
import { GoogleGenAI } from '@google/genai';

// --- MOCK DATA ---
const USERS: User[] = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A' },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B' },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C' },
    { id: 'user-4', name: 'Diana', email: 'diana@example.com', avatarInitials: 'D' },
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
            'user-1': { role: UserRole.Admin, languages: ['en', 'it', 'es'] },
            'user-2': { role: UserRole.Editor, languages: ['it'] },
            'user-3': { role: UserRole.Translator, languages: ['es'] },
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
            'user-1': { role: UserRole.Admin, languages: ['en', 'de'] }
        },
    },
];
// --- END MOCK DATA ---


export class ProjectStore {
    rootStore: RootStore;
    projects: Project[] = INITIAL_PROJECTS;
    allUsers: User[] = USERS;
    selectedProjectId: string | null = null;
    selectedTermId: string | null = null;
    translatingState: { termId: string; langCode: string } | null = null;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.rootStore = rootStore;
    }

    get selectedProject() {
        return this.projects.find(p => p.id === this.selectedProjectId);
    }
    
    get selectedTerm() {
        return this.selectedProject?.terms.find(t => t.id === this.selectedTermId);
    }

    get currentUserRole() {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !user) return null;
        return this.selectedProject.team[user.id]?.role;
    }

    getAssignedLanguagesForCurrentUser() {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !user) return [];
        const userRole = this.currentUserRole;
        if (userRole === UserRole.Admin || userRole === UserRole.Editor) {
            return this.selectedProject.languages.map(l => l.code);
        }
        return this.selectedProject.team[user.id]?.languages || [];
    }

    selectProject(projectId: string) {
        this.selectedProjectId = projectId;
        const project = this.projects.find(p => p.id === projectId);
        this.selectedTermId = project?.terms[0]?.id || null;
    };
    
    selectTerm(termId: string) {
        this.selectedTermId = termId;
    }

    addProject(name: string) {
        const user = this.rootStore.authStore.currentUser;
        if (!user) return;
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            languages: [AVAILABLE_LANGUAGES[0]],
            defaultLanguageCode: AVAILABLE_LANGUAGES[0].code,
            terms: [],
            team: { [user.id]: { role: UserRole.Admin, languages: [AVAILABLE_LANGUAGES[0].code] } }
        };
        this.projects.push(newProject);
        this.selectedProjectId = newProject.id;
        this.selectedTermId = null;
    };
    
    addTerm(termText: string) {
        if (!this.selectedProject || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        const newTerm: Term = {
            id: `term-${Date.now()}`,
            text: termText,
            translations: {},
        };
        this.selectedProject.terms.push(newTerm);
        this.selectedTermId = newTerm.id;
    };

    updateTranslation(langCode: string, value: string) {
        if (!this.selectedProject || !this.selectedTermId) return;
        const term = this.selectedProject.terms.find(t => t.id === this.selectedTermId);
        if (term) {
            term.translations[langCode] = value;
        }
    };

    updateTermText(termId: string, newText: string) {
        if (!this.selectedProject || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        const term = this.selectedProject.terms.find(t => t.id === termId);
        if (term) {
            term.text = newText;
        }
    };

    updateProjectLanguages(newLanguages: Language[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        
        const newLangCodes = newLanguages.map(l => l.code);
        const newDefaultLang = newLangCodes.includes(this.selectedProject.defaultLanguageCode)
            ? this.selectedProject.defaultLanguageCode
            : newLangCodes[0] || '';
        
        const newTeam = { ...this.selectedProject.team };
        Object.keys(newTeam).forEach(userId => {
            newTeam[userId].languages = newTeam[userId].languages.filter(code => newLangCodes.includes(code));
        });

        this.selectedProject.languages = newLanguages;
        this.selectedProject.defaultLanguageCode = newDefaultLang;
        this.selectedProject.team = newTeam;
    };
    
    setDefaultLanguage(langCode: string) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        this.selectedProject.defaultLanguageCode = langCode;
    };
    
    deleteTerm(termId: string) {
        if (!this.selectedProject || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        
        const termIndex = this.selectedProject.terms.findIndex(t => t.id === termId);
        if (termIndex === -1) return;
        
        this.selectedProject.terms.splice(termIndex, 1);

        if (this.selectedTermId === termId) {
            this.selectedTermId = this.selectedProject.terms[0]?.id || null;
        }
    };
    
    addMember(email: string, role: UserRole) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        
        const trimmedEmail = email.trim();
        if (!trimmedEmail) { this.rootStore.uiStore.showAlert('Email cannot be empty.', 'error'); return; }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) { this.rootStore.uiStore.showAlert('Please enter a valid email address.', 'error'); return; }

        const userToAdd = this.allUsers.find(u => u.email === trimmedEmail);
        if (!userToAdd) { this.rootStore.uiStore.showAlert('No user found with this email address.', 'error'); return; }
        if (this.selectedProject.team[userToAdd.id]) { this.rootStore.uiStore.showAlert('This user is already a member of the project.', 'warning'); return; }
        
        this.selectedProject.team[userToAdd.id] = { role, languages: [] };
        this.rootStore.uiStore.showAlert(`${userToAdd.name} was added to the project.`, 'success');
    };

    removeMember(userId: string) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const user = this.allUsers.find(u => u.id === userId);
        delete this.selectedProject.team[userId];
        if(user) {
            this.rootStore.uiStore.showAlert(`${user.name} was removed from the project.`, 'info');
        }
    };
    
    updateMemberLanguages(userId: string, assignedLanguages: string[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const member = this.selectedProject.team[userId];
        if (member) {
            member.languages = assignedLanguages;
        }
    };
    
    updateMemberRole(userId: string, role: UserRole) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const member = this.selectedProject.team[userId];
        if (member) {
            member.role = role;
        }
    };

    async generateTranslation(termId: string, targetLangCode: string) {
        if (!this.selectedProject) return;

        const term = this.selectedProject.terms.find(t => t.id === termId);
        if (!term) return;

        const sourceLangCode = this.selectedProject.defaultLanguageCode;
        const sourceText = term.translations[sourceLangCode];
        if (!sourceText) {
            this.rootStore.uiStore.showAlert('Source text in the default language is missing.', 'warning');
            return;
        }

        const sourceLang = AVAILABLE_LANGUAGES.find(l => l.code === sourceLangCode)?.name;
        const targetLang = AVAILABLE_LANGUAGES.find(l => l.code === targetLangCode)?.name;
        if (!sourceLang || !targetLang) {
            this.rootStore.uiStore.showAlert('Could not determine source or target language.', 'error');
            return;
        }

        this.translatingState = { termId, langCode: targetLangCode };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate this text from ${sourceLang} to ${targetLang}: "${sourceText}"`,
                config: {
                    systemInstruction: "You are a professional translation API. Your only task is to translate the given text accurately. Do not add any extra text, explanations, or quotation marks. Return only the translated string.",
                }
            });

            const translatedText = response.text.trim();
            this.updateTranslation(targetLangCode, translatedText);
            
        } catch (error) {
            console.error('Error generating translation:', error);
            this.rootStore.uiStore.showAlert('Failed to generate translation. Please check the console for details.', 'error');
        } finally {
            this.translatingState = null;
        }
    }
}
