import axios from 'axios';
import { Project, Term, Language, User, Role, Branch } from './types';
import { AVAILABLE_LANGUAGES } from './constants';

const API_BASE_URL = 'https://api.localization-manager.pro';

// Mocking the backend response delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MOCK DATABASE ---
// We'll manage a mock database here to simulate backend persistence.
let mockUsers: User[] = [
    { id: 'user-1', name: 'Alice (Admin)', email: 'alice@example.com', avatarInitials: 'A' },
    { id: 'user-2', name: 'Bob (Editor)', email: 'bob@example.com', avatarInitials: 'B' },
    { id: 'user-3', name: 'Charlie (Translator)', email: 'charlie@example.com', avatarInitials: 'C' },
];

let mockProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Sample Web App',
        defaultLanguageCode: 'en',
        languages: [AVAILABLE_LANGUAGES[0], AVAILABLE_LANGUAGES[1], AVAILABLE_LANGUAGES[2]],
        branches: [
            {
                id: 'branch-1-prod', name: 'production', terms: [
                    { id: 'term-1', text: 'welcome_message', translations: { 'en': 'Welcome to our application!', 'it': 'Benvenuto nella nostra applicazione!', 'es': '¡Bienvenido a nuestra aplicación!' } },
                    { id: 'term-2', text: 'button_submit', translations: { 'en': 'Submit', 'it': 'Invia', 'es': 'Enviar' } },
                ]
            },
            {
                id: 'branch-1-dev', name: 'development', terms: [
                    { id: 'term-1', text: 'welcome_message', translations: { 'en': 'Welcome!', 'it': 'Benvenuto!', 'es': '¡Bienvenido!' } },
                    { id: 'term-2', text: 'button_submit', translations: { 'en': 'Submit', 'it': 'Invia', 'es': 'Enviar' } },
                    { id: 'term-new-dev', text: 'new_feature_cta', translations: { 'en': 'Try our new feature!', 'it': '', 'es': '' } },
                ]
            }
        ],
        defaultBranchId: 'branch-1-prod',
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
        branches: [
            {
                id: 'branch-2-main', name: 'main', terms: [
                    { id: 'term-3', text: 'start_game', translations: { 'en': 'Start Game', 'de': 'Spiel starten' } },
                ],
            }
        ],
        defaultBranchId: 'branch-2-main',
        team: {
            'user-1': { role: 'admin', languages: ['en', 'de'] }
        },
    },
];
// --- END MOCK DATABASE ---


const apiClient = {
    login: async (email: string, pass: string): Promise<User> => {
        console.log(`POST ${API_BASE_URL}/auth/login`, { email });
        await sleep(500);
        const user = mockUsers.find(u => u.email === email);
        if (user && pass === 'password') {
            return { ...user }; // Return a copy
        }
        throw new Error('Invalid email or password.');
    },

    logout: async (): Promise<void> => {
        console.log(`POST ${API_BASE_URL}/auth/logout`);
        await sleep(200);
        return;
    },
    
    fetchUsers: async (): Promise<User[]> => {
        console.log(`GET ${API_BASE_URL}/users`);
        await sleep(500);
        return JSON.parse(JSON.stringify(mockUsers));
    },

    fetchProjects: async (): Promise<Project[]> => {
        console.log(`GET ${API_BASE_URL}/projects`);
        await sleep(500);
        return JSON.parse(JSON.stringify(mockProjects)); // Deep copy
    },
    
    addProject: async (name: string, currentUser: User): Promise<Project> => {
        console.log(`POST ${API_BASE_URL}/projects`, { name });
        await sleep(300);
        const defaultBranch: Branch = { id: `branch-${Date.now()}`, name: 'main', terms: [] };
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            languages: [AVAILABLE_LANGUAGES[0]],
            defaultLanguageCode: AVAILABLE_LANGUAGES[0].code,
            team: { [currentUser.id]: { role: 'admin', languages: [AVAILABLE_LANGUAGES[0].code] } },
            branches: [defaultBranch],
            defaultBranchId: defaultBranch.id,
        };
        mockProjects.push(newProject);
        return JSON.parse(JSON.stringify(newProject));
    },

    updateProjectLanguages: async (projectId: string, languages: Language[], defaultLanguageCode: string): Promise<Project> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/languages`, { languages, defaultLanguageCode });
        await sleep(300);
        const projectIndex = mockProjects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) throw new Error("Project not found");
        
        const newLangCodes = languages.map(l => l.code);
        const project = mockProjects[projectIndex];
        const newTeam = { ...project.team };
        Object.keys(newTeam).forEach(userId => {
            newTeam[userId].languages = newTeam[userId].languages.filter(code => newLangCodes.includes(code));
        });
        
        mockProjects[projectIndex] = { ...project, languages, defaultLanguageCode, team: newTeam };
        return JSON.parse(JSON.stringify(mockProjects[projectIndex]));
    },

    setDefaultLanguage: async (projectId: string, langCode: string): Promise<Project> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/default-language`, { langCode });
        await sleep(300);
        const projectIndex = mockProjects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) throw new Error("Project not found");
        mockProjects[projectIndex].defaultLanguageCode = langCode;
        return JSON.parse(JSON.stringify(mockProjects[projectIndex]));
    },

    addTerm: async (projectId: string, branchId: string, termText: string): Promise<Term> => {
        console.log(`POST ${API_BASE_URL}/projects/${projectId}/branches/${branchId}/terms`, { text: termText });
        await sleep(200);
        const project = mockProjects.find(p => p.id === projectId);
        const branch = project?.branches.find(b => b.id === branchId);
        if (!branch) throw new Error("Branch not found");
        
        const newTerm: Term = {
            id: `term-${Date.now()}`,
            text: termText,
            translations: {},
        };
        branch.terms.push(newTerm);
        return JSON.parse(JSON.stringify(newTerm));
    },

    updateTermText: async (projectId: string, branchId: string, termId: string, newText: string): Promise<Term> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/branches/${branchId}/terms/${termId}`, { text: newText });
        await sleep(100);
        const branch = mockProjects.find(p => p.id === projectId)?.branches.find(b => b.id === branchId);
        const term = branch?.terms.find(t => t.id === termId);
        if (!term) throw new Error("Term not found");
        term.text = newText;
        return JSON.parse(JSON.stringify(term));
    },
    
    deleteTerm: async (projectId: string, branchId: string, termId: string): Promise<void> => {
         console.log(`DELETE ${API_BASE_URL}/projects/${projectId}/branches/${branchId}/terms/${termId}`);
         await sleep(200);
         const branch = mockProjects.find(p => p.id === projectId)?.branches.find(b => b.id === branchId);
         if (!branch) throw new Error("Branch not found");
         branch.terms = branch.terms.filter(t => t.id !== termId);
    },
    
    updateTranslation: async (projectId: string, branchId: string, termId: string, langCode: string, value: string): Promise<{ [langCode: string]: string }> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/branches/${branchId}/terms/${termId}/translations/${langCode}`, { value });
        await sleep(100);
        const term = mockProjects.find(p => p.id === projectId)?.branches.find(b => b.id === branchId)?.terms.find(t => t.id === termId);
        if (!term) throw new Error("Term not found");
        term.translations[langCode] = value;
        return JSON.parse(JSON.stringify(term.translations));
    },

    addBranch: async (projectId: string, name: string, sourceBranchId: string): Promise<Branch> => {
        console.log(`POST ${API_BASE_URL}/projects/${projectId}/branches`, { name, sourceBranchId });
        await sleep(400);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) throw new Error("Project not found");
        const sourceBranch = project.branches.find(b => b.id === sourceBranchId);
        if (!sourceBranch) throw new Error("Source branch not found");
        
        const newBranch: Branch = {
            id: `branch-${Date.now()}`,
            name,
            terms: JSON.parse(JSON.stringify(sourceBranch.terms)) // Deep copy
        };
        project.branches.push(newBranch);
        return JSON.parse(JSON.stringify(newBranch));
    },

    deleteBranch: async (projectId: string, branchId: string): Promise<void> => {
        console.log(`DELETE ${API_BASE_URL}/projects/${projectId}/branches/${branchId}`);
        await sleep(400);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) throw new Error("Project not found");
        project.branches = project.branches.filter(b => b.id !== branchId);
    },
    
    setDefaultBranch: async (projectId: string, branchId: string): Promise<Project> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/default-branch`, { branchId });
        await sleep(300);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) throw new Error("Project not found");
        project.defaultBranchId = branchId;
        return JSON.parse(JSON.stringify(project));
    },
    
    mergeBranch: async (projectId: string, sourceBranchId: string, targetBranchId: string): Promise<Branch> => {
        console.log(`POST ${API_BASE_URL}/projects/${projectId}/branches/merge`, { sourceBranchId, targetBranchId });
        await sleep(500);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) throw new Error("Project not found");
        const sourceBranch = project.branches.find(b => b.id === sourceBranchId);
        const targetBranch = project.branches.find(b => b.id === targetBranchId);
        if (!sourceBranch || !targetBranch) throw new Error("Branch not found");
        
        targetBranch.terms = JSON.parse(JSON.stringify(sourceBranch.terms));
        return JSON.parse(JSON.stringify(targetBranch));
    },

    addMember: async (projectId: string, email: string, role: Role): Promise<{ [userId: string]: { role: Role; languages: string[] } }> => {
        console.log(`POST ${API_BASE_URL}/projects/${projectId}/team`, { email, role });
        await sleep(300);
        const project = mockProjects.find(p => p.id === projectId);
        const userToAdd = mockUsers.find(u => u.email === email);
        if (!project || !userToAdd) throw new Error("Project or User not found");
        
        project.team[userToAdd.id] = { role, languages: [] };
        return JSON.parse(JSON.stringify(project.team));
    },

    removeMember: async (projectId: string, userId: string): Promise<void> => {
        console.log(`DELETE ${API_BASE_URL}/projects/${projectId}/team/${userId}`);
        await sleep(300);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project) throw new Error("Project not found");
        delete project.team[userId];
    },
    
    updateMemberRole: async (projectId: string, userId: string, role: Role): Promise<{ role: Role; languages: string[] }> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/team/${userId}/role`, { role });
        await sleep(200);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project || !project.team[userId]) throw new Error("Project or User not found in team");
        project.team[userId].role = role;
        return JSON.parse(JSON.stringify(project.team[userId]));
    },
    
    updateMemberLanguages: async (projectId: string, userId: string, languages: string[]): Promise<{ role: Role; languages: string[] }> => {
        console.log(`PUT ${API_BASE_URL}/projects/${projectId}/team/${userId}/languages`, { languages });
        await sleep(200);
        const project = mockProjects.find(p => p.id === projectId);
        if (!project || !project.team[userId]) throw new Error("Project or User not found in team");
        project.team[userId].languages = languages;
        return JSON.parse(JSON.stringify(project.team[userId]));
    },
};

export default apiClient;
