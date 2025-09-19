import { makeAutoObservable, runInAction, computed } from 'mobx';
import { Project, Term, Language, User, UserRole, Branch, Commit, UncommittedChange, Comment, ApiKey, ApiKeyPermissions, Invitation } from '../types';
import { AVAILABLE_LANGUAGES } from '../constants';
import { RootStore } from './RootStore';
import { GoogleGenAI } from '@google/genai';
import { AddMemberResult } from '../ApiClient';

// Simple deep-ish comparison for changes
const areTermsEqual = (term1: Term, term2: Term) => {
    if (term1.text !== term2.text || term1.context !== term2.context) {
        return false;
    }
    const t1Keys = Object.keys(term1.translations);
    const t2Keys = Object.keys(term2.translations);
    if (t1Keys.length !== t2Keys.length) return false;

    for (const key of t1Keys) {
        if (term1.translations[key] !== term2.translations[key]) return false;
    }
    return true;
};

export class ProjectStore {
    rootStore: RootStore;
    projects: Project[] = [];
    allUsers: User[] = [];
    selectedProjectId: string | null = null;
    selectedTermId: string | null = null;
    translatingState: { termId: string; langCode: string } | null = null;
    comments: Comment[] = [];

    // Real-time state
    typingUsersOnSelectedTerm = new Map<string, string>(); // Map<userId, userName>
    private typingTimeouts = new Map<string, number>(); // Map<userId, timeoutId>

    constructor(rootStore: RootStore) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.rootStore = rootStore;
    }
    
    async initializeData() {
        const projects = await this.rootStore.apiClient.getProjects();
        const users = await this.rootStore.apiClient.getAllUsers();
        runInAction(() => {
            this.projects = projects;
            this.allUsers = users;
            this.selectedProjectId = null;
            this.selectedTermId = null;
        });
        // Initialize WebSocket if user is logged in and has projects
        if (this.rootStore.authStore.currentUser && projects.length > 0) {
            this.rootStore.uiStore.initializeWebSocket();
        }
    }
    
    clearData() {
        this.projects = [];
        this.allUsers = [];
        this.selectedProjectId = null;
        this.selectedTermId = null;
        this.comments = [];
        this.typingUsersOnSelectedTerm.clear();
        this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.typingTimeouts.clear();
    }

    get selectedProject() {
        return this.projects.find(p => p.id === this.selectedProjectId);
    }

    get currentBranch(): Branch | null {
        if (!this.selectedProject) return null;
        return this.selectedProject.branches.find(b => b.name === this.selectedProject.currentBranchName) || null;
    }

    get latestCommit(): Commit | null {
        if (!this.currentBranch || this.currentBranch.commits.length === 0) return null;
        return this.currentBranch.commits[0]; // Assuming newest is first
    }

    get currentBranchTerms(): Term[] {
        // This now refers to the "working copy" of terms
        return this.currentBranch?.workingTerms || [];
    }
    
    get selectedTerm() {
        return this.currentBranchTerms.find(t => t.id === this.selectedTermId);
    }

    get uncommittedChanges(): UncommittedChange[] {
        if (!this.currentBranch || !this.latestCommit) return [];

        const workingTermsMap = new Map(this.currentBranch.workingTerms.map(t => [t.id, t]));
        const committedTermsMap = new Map(this.latestCommit.terms.map(t => [t.id, t]));

        const changes: UncommittedChange[] = [];
        const allIds = new Set([...workingTermsMap.keys(), ...committedTermsMap.keys()]);

        for (const id of allIds) {
            const workingTerm = workingTermsMap.get(id);
            const committedTerm = committedTermsMap.get(id);

            if (workingTerm && !committedTerm) {
                changes.push({ type: 'added', term: workingTerm });
            } else if (!workingTerm && committedTerm) {
                changes.push({ type: 'removed', originalTerm: committedTerm });
            } else if (workingTerm && committedTerm && !areTermsEqual(committedTerm, workingTerm)) {
                changes.push({ type: 'modified', term: workingTerm, originalTerm: committedTerm });
            }
        }

        return changes.sort((a, b) => {
            const textA = a.type === 'added' ? a.term.text : a.originalTerm.text;
            const textB = b.type === 'added' ? b.term.text : b.originalTerm.text;
            return textA.localeCompare(textB);
        });
    }

    get uncommittedChangesCount(): number {
        return this.uncommittedChanges.length;
    }

    get currentUserRole() {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !user) return null;
        return this.selectedProject.team[user.id]?.role;
    }

    @computed get selectedTermComments(): Comment[] {
        if (!this.selectedTerm) return [];
        const commentsForTerm = this.comments.filter(c => c.termId === this.selectedTerm!.id);
        
        // Create a mutable copy with an empty replies array
        const commentMap = new Map(commentsForTerm.map(c => [c.id, { ...c, replies: [] as Comment[] }]));
        const rootComments: Comment[] = [];

        for (const comment of Array.from(commentMap.values())) {
            if (comment.parentId && commentMap.has(comment.parentId)) {
                commentMap.get(comment.parentId)!.replies.push(comment);
            } else {
                rootComments.push(comment);
            }
        }
        return rootComments;
    }

    getProjectCompletion(project: Project): number {
        const mainBranch = project.branches.find(b => b.name === 'main');
        if (!mainBranch) return 0;
        
        const latestCommit = mainBranch.commits[0];
        if (!latestCommit) return 0;

        const totalTerms = latestCommit.terms.length;
        const totalLangs = project.languages.length;
        if (totalTerms === 0 || totalLangs === 0) return 0;

        const totalTranslationsPossible = totalTerms * totalLangs;
        let translatedCount = 0;
        latestCommit.terms.forEach(term => {
            project.languages.forEach(lang => {
                if (term.translations[lang.code]?.trim()) {
                    translatedCount++;
                }
            });
        });
        return (translatedCount / totalTranslationsPossible) * 100;
    }

    getAssignedLanguagesForCurrentUser() {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !user) return [];
        const userRole = this.currentUserRole;

        // Admins see all languages, regardless of specific assignments.
        if (userRole === UserRole.Admin) {
            return this.selectedProject.languages.map(l => l.code);
        }
        // Editors and Translators only see their assigned languages.
        return this.selectedProject.team[user.id]?.languages || [];
    }

    // --- Real-time Actions ---
    notifyViewingBranch = () => {
        if (this.selectedProject && this.currentBranch) {
            this.rootStore.uiStore.sendWebSocketMessage({
                type: 'client_viewing_branch',
                payload: {
                    projectId: this.selectedProject.id,
                    branchName: this.currentBranch.name,
                }
            });
        }
    }

    startTyping(userId: string, userName: string) {
        // If there's a timeout scheduled to remove this user, cancel it.
        if (this.typingTimeouts.has(userId)) {
            clearTimeout(this.typingTimeouts.get(userId)!);
            this.typingTimeouts.delete(userId);
        }
        // Add or update the user in the typing map.
        runInAction(() => {
            this.typingUsersOnSelectedTerm.set(userId, userName);
        });
    }
    
    stopTyping(userId: string) {
        // Don't remove immediately. Set a timeout to remove after a delay.
        const timeoutId = window.setTimeout(() => {
            runInAction(() => {
                this.typingUsersOnSelectedTerm.delete(userId);
                this.typingTimeouts.delete(userId);
            });
        }, 3000); // 3 seconds delay

        // Store the timeout ID so it can be cancelled if the user starts typing again.
        this.typingTimeouts.set(userId, timeoutId);
    }

    async handleBranchUpdate(payload: { projectId: string, branchName: string }) {
        if (this.selectedProjectId === payload.projectId && this.currentBranch?.name === payload.branchName) {
            console.log("Refreshing current project due to external update...");
            await this.refreshCurrentProject();
            this.rootStore.uiStore.showAlert('This branch was updated by another user. Your view has been refreshed.', 'info');
        }
    }

    async refreshCurrentProject() {
        if (!this.selectedProjectId) return;
        
        try {
            const updatedProject = await this.rootStore.apiClient.getProjectById(this.selectedProjectId);
            if (updatedProject) {
                runInAction(() => {
                    const projectIndex = this.projects.findIndex(p => p.id === this.selectedProjectId);
                    if (projectIndex !== -1) {
                        this.projects[projectIndex] = updatedProject;
                    }
                    // Ensure selected term is still valid
                    if (this.selectedTermId && !this.currentBranchTerms.some(t => t.id === this.selectedTermId)) {
                        this.selectedTermId = this.currentBranchTerms[0]?.id || null;
                    }
                });
            }
        } catch (error) {
            console.error("Failed to refresh project data:", error);
            this.rootStore.uiStore.showAlert('Could not refresh project data.', 'error');
        }
    }

    selectProject(projectId: string) {
        this.selectedProjectId = projectId;
        const project = this.projects.find(p => p.id === projectId);
        const currentTerms = project?.branches.find(b => b.name === project.currentBranchName)?.workingTerms || [];
        this.selectedTermId = currentTerms[0]?.id || null;
        this.comments = [];
        this.typingUsersOnSelectedTerm.clear();
        this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.typingTimeouts.clear();
        this.notifyViewingBranch();
    };

    deselectProject() {
        this.selectedProjectId = null;
        this.selectedTermId = null;
        this.comments = [];
        this.typingUsersOnSelectedTerm.clear();
        this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.typingTimeouts.clear();
        this.rootStore.uiStore.sendWebSocketMessage({ type: 'client_stopped_viewing' });
    }
    
    selectTerm(termId: string) {
        this.selectedTermId = termId;
        this.typingUsersOnSelectedTerm.clear();
        this.typingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.typingTimeouts.clear();
    }

    deselectTerm() {
        this.selectedTermId = null;
    }

    async addProject(name: string) {
        const user = this.rootStore.authStore.currentUser;
        if (!user) return;
        try {
            const wasFirstProject = this.projects.length === 0;
            const newProject = await this.rootStore.apiClient.addProject(name, user.id);
            runInAction(() => {
                this.projects.push(newProject);
            });
            if (wasFirstProject && this.projects.length > 0) {
                this.rootStore.uiStore.initializeWebSocket();
            }
        } catch (error: any) {
            this.rootStore.uiStore.showAlert(error.message || 'Failed to create project.', 'error');
        }
    };
    
    async addTerm(termText: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        
        const trimmedText = termText.trim();
        if (!trimmedText) {
            this.rootStore.uiStore.showAlert('Term key cannot be empty.', 'warning');
            return;
        }
        
        // Check for duplicates in the current working copy (case-insensitive)
        const isDuplicate = this.currentBranch.workingTerms.some(
            (term) => term.text.toLowerCase() === trimmedText.toLowerCase()
        );

        if (isDuplicate) {
            this.rootStore.uiStore.showAlert(`Term key "${trimmedText}" already exists in this branch.`, 'error');
            return;
        }

        try {
            const newTerm = await this.rootStore.apiClient.addTerm(this.selectedProject.id, trimmedText);
            if (newTerm) {
                runInAction(() => {
                    this.currentBranch?.workingTerms.push(newTerm);
                    this.selectedTermId = newTerm.id;
                });
            }
        } catch (error: any) {
            this.rootStore.uiStore.showAlert(error.message || 'Failed to add term.', 'error');
        }
    };

    async updateTranslation(projectId: string, termId: string, langCode: string, value: string) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        const branch = project.branches.find(b => b.name === project.currentBranchName);
        const term = branch?.workingTerms.find(t => t.id === termId);

        if (term) {
            // Optimistic update
            const oldValue = term.translations[langCode];
            term.translations[langCode] = value;
            
            try {
                await this.rootStore.apiClient.updateTranslation(projectId, termId, langCode, value);
            } catch (error) {
                // Revert on failure
                runInAction(() => {
                    term.translations[langCode] = oldValue;
                });
                this.rootStore.uiStore.showAlert('Failed to save translation.', 'error');
            }
        }
    };

    async updateTermText(termId: string, newText: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        
        const term = this.currentBranch.workingTerms.find(t => t.id === termId);
        if (term) {
            const originalText = term.text;
            term.text = newText; // Optimistic update
            const success = await this.rootStore.apiClient.updateTermText(this.selectedProject.id, termId, newText);
            if (!success) {
                runInAction(() => { term.text = originalText }); // Revert on failure
                this.rootStore.uiStore.showAlert('Failed to update term key.', 'error');
            }
        }
    };

    async updateTermContext(termId: string, newContext: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;

        const term = this.currentBranch.workingTerms.find(t => t.id === termId);
        if (term) {
            const originalContext = term.context;
            term.context = newContext; // Optimistic update
            const success = await this.rootStore.apiClient.updateTermContext(this.selectedProject.id, termId, newContext);
            if (!success) {
                runInAction(() => { term.context = originalContext; }); // Revert on failure
                this.rootStore.uiStore.showAlert('Failed to update context.', 'error');
            }
        }
    }

    async updateProjectLanguages(newLanguages: Language[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        try {
            const updatedProject = await this.rootStore.apiClient.updateProjectLanguages(this.selectedProject.id, newLanguages);
            if (updatedProject) {
                runInAction(() => {
                    const projectIndex = this.projects.findIndex(p => p.id === updatedProject.id);
                    if (projectIndex !== -1) {
                        // Create a new array to ensure MobX detects the change robustly.
                        const newProjects = this.projects.slice();
                        newProjects[projectIndex] = updatedProject;
                        this.projects = newProjects;
                    }
                });
            } else {
                throw new Error("API did not return an updated project.");
            }
        } catch (error) {
            console.error('Failed to update project languages:', error);
            this.rootStore.uiStore.showAlert('Failed to update project languages.', 'error');
        }
    };
    
    async setDefaultLanguage(langCode: string) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const success = await this.rootStore.apiClient.setDefaultLanguage(this.selectedProject.id, langCode);
        if (success) {
            runInAction(() => {
                if(this.selectedProject) this.selectedProject.defaultLanguageCode = langCode;
            });
        }
    };
    
    async deleteTerm(termId: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        
        const success = await this.rootStore.apiClient.deleteTerm(this.selectedProject.id, termId);
        
        if (success) {
            runInAction(() => {
                if (!this.currentBranch) return;
                const termIndex = this.currentBranch.workingTerms.findIndex(t => t.id === termId);
                if (termIndex > -1) {
                    this.currentBranch.workingTerms.splice(termIndex, 1);
                }

                if (this.selectedTermId === termId) {
                    this.selectedTermId = this.currentBranch.workingTerms[0]?.id || null;
                }
            });
        }
    };

    async commitChanges(message: string) {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !this.currentBranch || !user) return;

        // Create the commit on the backend
        const newCommit = await this.rootStore.apiClient.createCommit(this.selectedProject.id, this.currentBranch.name, message, user.id);

        if (newCommit) {
            this.rootStore.uiStore.showAlert('Changes committed successfully.', 'success');
            
            // To ensure perfect state synchronization, refetch the entire project object
            // from the server, which now includes the new commit.
            const updatedProject = await this.rootStore.apiClient.getProjectById(this.selectedProject.id);
            
            if (updatedProject) {
                runInAction(() => {
                    const projectIndex = this.projects.findIndex(p => p.id === this.selectedProject!.id);
                    if (projectIndex !== -1) {
                        this.projects[projectIndex] = updatedProject;
                    }
                });
            }
        } else {
            this.rootStore.uiStore.showAlert('Failed to commit changes.', 'error');
        }
    }

    discardChange(change: UncommittedChange) {
        if (!this.currentBranch) return;

        runInAction(() => {
            switch (change.type) {
                case 'added': {
                    const termIndex = this.currentBranch!.workingTerms.findIndex(t => t.id === change.term.id);
                    if (termIndex > -1) {
                        this.currentBranch!.workingTerms.splice(termIndex, 1);
                    }
                    break;
                }
                case 'removed': {
                    // Add it back from the original state
                    this.currentBranch!.workingTerms.push(change.originalTerm);
                    break;
                }
                case 'modified': {
                    const termIndex = this.currentBranch!.workingTerms.findIndex(t => t.id === change.term.id);
                    if (termIndex > -1) {
                        // Replace with the original version
                        this.currentBranch!.workingTerms[termIndex] = change.originalTerm;
                    }
                    break;
                }
            }
            
            // If no changes are left, close the commit dialog
            if (this.uncommittedChanges.length === 0) {
                this.rootStore.uiStore.closeCommitDialog();
            }
        });
    }
    
    async addMember(email: string, role: UserRole, languages: string[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;

        const trimmedEmail = email.trim();
        if (!trimmedEmail) { this.rootStore.uiStore.showAlert('Email cannot be empty.', 'error'); return; }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) { this.rootStore.uiStore.showAlert('Please enter a valid email address.', 'error'); return; }

        try {
            const result: AddMemberResult = await this.rootStore.apiClient.addMember(this.selectedProject.id, trimmedEmail, role, languages);

            if (result.success) {
                runInAction(() => {
                    if (this.selectedProject) {
                        // Handle case where user was added directly
                        if (result.user) {
                            this.selectedProject.team[result.user.id] = { role, languages };
                            if (!this.allUsers.some(u => u.id === result.user!.id)) {
                                this.allUsers.push(result.user);
                            }
                        } else {
                            // Handle case where an invitation was sent by refetching the project
                            // to get the latest pendingInvitations list.
                            this.refreshCurrentProject();
                        }
                    }
                });
                this.rootStore.uiStore.showAlert(result.message, 'success');
            } else {
                this.rootStore.uiStore.showAlert(result.message, result.code === 'user_exists' || result.code === 'invitation_exists' ? 'warning' : 'error');
            }
        } catch (error: any) {
            this.rootStore.uiStore.showAlert(error.message || 'Failed to invite member.', 'error');
        }
    };

    async revokeInvitation(invitationId: number) {
        if (!this.selectedProject) return;

        const success = await this.rootStore.apiClient.revokeInvitation(this.selectedProject.id, invitationId);
        if (success) {
            runInAction(() => {
                if (this.selectedProject && this.selectedProject.pendingInvitations) {
                    this.selectedProject.pendingInvitations = this.selectedProject.pendingInvitations.filter(
                        inv => inv.id !== invitationId
                    );
                    this.rootStore.uiStore.showAlert('Invitation revoked.', 'info');
                }
            });
        } else {
            this.rootStore.uiStore.showAlert('Failed to revoke invitation.', 'error');
        }
    }

    async removeMember(userId: string) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        
        const success = await this.rootStore.apiClient.removeMember(this.selectedProject.id, userId);
        if (success) {
            runInAction(() => {
                const user = this.allUsers.find(u => u.id === userId);
                if (this.selectedProject) {
                    delete this.selectedProject.team[userId];
                }
                if (user) {
                    this.rootStore.uiStore.showAlert(`${user.name} was removed from the project.`, 'info');
                }
            });
        }
    };
    
    async updateMemberLanguages(userId: string, assignedLanguages: string[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const success = await this.rootStore.apiClient.updateMemberLanguages(this.selectedProject.id, userId, assignedLanguages);
        if (success) {
            runInAction(() => {
                const member = this.selectedProject?.team[userId];
                if (member) {
                    member.languages = assignedLanguages;
                }
            });
        }
    };
    
    async updateMemberRole(userId: string, role: UserRole) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        const success = await this.rootStore.apiClient.updateMemberRole(this.selectedProject.id, userId, role);
        if (success) {
            runInAction(() => {
                const member = this.selectedProject?.team[userId];
                if (member) {
                    member.role = role;
                }
            });
        }
    };

    async generateTranslation(termId: string, targetLangCode: string) {
        if (!this.selectedProject) return;

        const term = this.currentBranchTerms.find(t => t.id === termId);
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
            this.updateTranslation(this.selectedProject.id, termId, targetLangCode, translatedText);
            
        } catch (error) {
            console.error('Error generating translation:', error);
            this.rootStore.uiStore.showAlert('Failed to generate translation. Please check the console for details.', 'error');
        } finally {
            this.translatingState = null;
        }
    }
    
    // --- Import/Export Actions ---

    async exportTranslations(languageCodes: string[], format: 'json' | 'csv') {
        if (!this.selectedProject || !this.currentBranch) {
            this.rootStore.uiStore.showAlert('Could not find project data to export.', 'error');
            return;
        }

        const terms = this.currentBranch.workingTerms;
        const projectName = this.selectedProject.name.replace(/\s/g, '_');
        const branchName = this.currentBranch.name.replace(/\//g, '_');
        const timestamp = new Date().toISOString().slice(0, 10);

        const downloadFile = (filename: string, content: string, mimeType: string) => {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        if (format === 'json') {
            if (languageCodes.length !== 1) {
                this.rootStore.uiStore.showAlert('Please select exactly one language for JSON export.', 'warning');
                return;
            }
            const langCode = languageCodes[0];
            const jsonObj: Record<string, string> = {};
            terms.forEach(term => {
                jsonObj[term.text] = term.translations[langCode] || '';
            });
            const content = JSON.stringify(jsonObj, null, 2);
            const filename = `${projectName}_${branchName}_${langCode}_${timestamp}.json`;
            downloadFile(filename, content, 'application/json');
        }

        if (format === 'csv') {
            const header = ['key', ...languageCodes];
            const rows = terms.map(term => {
                const row = [term.text];
                languageCodes.forEach(langCode => {
                    // CSV values with commas or quotes need to be escaped
                    let value = term.translations[langCode] || '';
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    row.push(value);
                });
                return row.join(',');
            });
            const content = [header.join(','), ...rows].join('\n');
            const filename = `${projectName}_${branchName}_${timestamp}.csv`;
            downloadFile(filename, content, 'text/csv;charset=utf-8;');
        }

        this.rootStore.uiStore.showAlert('Export started.', 'success');
    }

    async importTranslations(file: File, options: { createNew: boolean; overwrite: boolean; langCode?: string }) {
        if (!this.selectedProject || !this.currentBranch) {
            this.rootStore.uiStore.showAlert('Cannot import: no project or branch selected.', 'error');
            return;
        }

        const fileContent = await file.text();
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const stats = { updated: 0, created: 0, ignored: 0 };
        
        // Create a deep copy to work with, to avoid modifying state before persistence
        const newWorkingTerms: Term[] = JSON.parse(JSON.stringify(this.currentBranch.workingTerms));

        try {
            if (fileExtension === 'json') {
                if (!options.langCode) {
                    throw new Error('Please select a language for this JSON file.');
                }
                const data = JSON.parse(fileContent) as Record<string, string>;
                for (const key in data) {
                    const term = newWorkingTerms.find(t => t.text === key);
                    if (term) {
                        if (options.overwrite) {
                            term.translations[options.langCode] = data[key];
                            stats.updated++;
                        } else {
                            stats.ignored++;
                        }
                    } else {
                        if (options.createNew) {
                            const newTerm: Term = { id: `term-imported-${Date.now()}-${key}`, text: key, translations: { [options.langCode]: data[key] } };
                            newWorkingTerms.push(newTerm);
                            stats.created++;
                        } else {
                            stats.ignored++;
                        }
                    }
                }
            } else if (fileExtension === 'csv') {
                const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
                const header = lines[0].split(',').map(h => h.trim());
                if (header[0].toLowerCase() !== 'key') throw new Error('Invalid CSV format: first column must be "key".');
                
                const langCodes = header.slice(1);
                // Simple CSV line parser that handles quoted fields.
                const parseCsvLine = (line: string): string[] => {
                    const result: string[] = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            if (inQuotes && line[i+1] === '"') {
                                current += '"';
                                i++;
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            result.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    result.push(current);
                    return result;
                };

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    const values = parseCsvLine(lines[i]);
                    const key = values[0];
                    if (!key) continue;
                    const term = newWorkingTerms.find(t => t.text === key);

                    if (term) {
                        if (options.overwrite) {
                            langCodes.forEach((langCode, index) => {
                                if (langCode && values[index + 1] !== undefined) {
                                    term.translations[langCode] = values[index + 1];
                                }
                            });
                            stats.updated++;
                        } else {
                            stats.ignored++;
                        }
                    } else {
                        if (options.createNew) {
                            const newTerm: Term = { id: `term-imported-${Date.now()}-${key}`, text: key, translations: {} };
                            langCodes.forEach((langCode, index) => {
                                if (langCode && values[index + 1] !== undefined) {
                                    newTerm.translations[langCode] = values[index + 1];
                                }
                            });
                            newWorkingTerms.push(newTerm);
                            stats.created++;
                        } else {
                            stats.ignored++;
                        }
                    }
                }
            } else {
                throw new Error('Unsupported file format. Please use .json or .csv');
            }

            // Persist the changes to the backend
            await this.rootStore.apiClient.bulkUpdateTerms(this.selectedProject.id, newWorkingTerms);

            // On success, update the local state
            runInAction(() => {
                if (this.currentBranch) {
                    this.currentBranch.workingTerms = newWorkingTerms;
                }
            });
            this.rootStore.uiStore.showAlert(`Import complete: ${stats.updated} updated, ${stats.created} created, ${stats.ignored} ignored.`, 'success');

        } catch (error: any) {
            console.error('Import failed:', error);
            this.rootStore.uiStore.showAlert(`Import failed: ${error.message}`, 'error');
        }
    }

    // --- Branching Actions ---
    async createBranch(newBranchName: string, sourceBranchName: string) {
        if (!this.selectedProject) return;
        const newBranch = await this.rootStore.apiClient.createBranch(this.selectedProject.id, newBranchName, sourceBranchName);
        if (newBranch) {
            // The API returns an incomplete branch object. Refetch the project to get the full state.
            const updatedProject = await this.rootStore.apiClient.getProjectById(this.selectedProject.id);
            if (updatedProject) {
                runInAction(() => {
                    const projectIndex = this.projects.findIndex(p => p.id === this.selectedProject!.id);
                    if (projectIndex !== -1) {
                        this.projects[projectIndex] = updatedProject;
                    }
                    this.rootStore.uiStore.showAlert(`Branch "${newBranchName}" created successfully.`, 'success');
                });
            } else {
                 this.rootStore.uiStore.showAlert(`Branch created, but failed to refresh project data.`, 'warning');
            }
        } else {
            this.rootStore.uiStore.showAlert(`Failed to create branch "${newBranchName}". It may already exist.`, 'error');
        }
    }

    async createBranchFromCommit(commitId: string, newBranchName: string) {
        if (!this.selectedProject) return;
        const newBranch = await this.rootStore.apiClient.createBranchFromCommit(this.selectedProject.id, commitId, newBranchName);
        if (newBranch) {
             // The API returns an incomplete branch object. Refetch the project to get the full state.
            const updatedProject = await this.rootStore.apiClient.getProjectById(this.selectedProject.id);
            if (updatedProject) {
                runInAction(() => {
                    const projectIndex = this.projects.findIndex(p => p.id === this.selectedProject!.id);
                    if (projectIndex !== -1) {
                        this.projects[projectIndex] = updatedProject;
                    }
                    this.rootStore.uiStore.showAlert(`Branch "${newBranchName}" created from commit ${commitId.slice(-7)}.`, 'success');
                });
            } else {
                 this.rootStore.uiStore.showAlert(`Branch created, but failed to refresh project data.`, 'warning');
            }
        } else {
            this.rootStore.uiStore.showAlert(`Failed to create branch. It may already exist.`, 'error');
        }
    }

    async deleteLatestCommit() {
        if (!this.selectedProject || !this.currentBranch || this.currentBranch.commits.length <= 1) {
            this.rootStore.uiStore.showAlert(`Cannot delete the initial commit.`, 'warning');
            return;
        }
        
        const success = await this.rootStore.apiClient.deleteLatestCommit(this.selectedProject.id, this.currentBranch.name);
        if (success) {
            runInAction(() => {
                if (this.currentBranch) {
                    this.currentBranch.commits.shift(); // Remove from local state
                    const newHead = this.currentBranch.commits[0];
                    this.currentBranch.workingTerms = JSON.parse(JSON.stringify(newHead.terms)); // Update local working copy
                     this.rootStore.uiStore.showAlert(`Successfully deleted the latest commit. Working directory restored to previous state.`, 'success');
                }
            });
        } else {
            this.rootStore.uiStore.showAlert(`Failed to delete the commit.`, 'error');
        }
    }

    async switchBranch(branchName: string) {
        if (!this.selectedProject || this.selectedProject.currentBranchName === branchName) return;
        
        if (this.uncommittedChangesCount > 0) {
            // In a real app, you might ask the user to stash, commit, or discard changes.
            // For simplicity here, we'll just alert them.
             this.rootStore.uiStore.showAlert(`You have ${this.uncommittedChangesCount} uncommitted changes. Please commit or discard them before switching branches.`, 'warning');
            return;
        }

        const success = await this.rootStore.apiClient.switchBranch(this.selectedProject.id, branchName);
        if (success) {
            runInAction(() => {
                if (this.selectedProject) {
                    this.selectedProject.currentBranchName = branchName;
                    this.selectedTermId = this.currentBranchTerms[0]?.id || null;
                    this.typingUsersOnSelectedTerm.clear();
                    this.notifyViewingBranch();
                }
            });
        }
    }

    async deleteBranch(branchName: string) {
        if (!this.selectedProject || branchName === 'main') {
            this.rootStore.uiStore.showAlert(`Cannot delete the default "main" branch.`, 'warning');
            return;
        }
        const success = await this.rootStore.apiClient.deleteBranch(this.selectedProject.id, branchName);
        if (success) {
            runInAction(() => {
                if (this.selectedProject) {
                    const branchIndex = this.selectedProject.branches.findIndex(b => b.name === branchName);
                    if (branchIndex > -1) {
                        this.selectedProject.branches.splice(branchIndex, 1);
                    }
                    if (this.selectedProject.currentBranchName === branchName) {
                        this.selectedProject.currentBranchName = 'main';
                        this.selectedTermId = this.currentBranchTerms[0]?.id || null;
                    }
                    this.rootStore.uiStore.showAlert(`Branch "${branchName}" has been deleted.`, 'info');
                }
            });
        }
    }

    async mergeBranches(sourceBranchName: string, targetBranchName: string) {
        if (!this.selectedProject) return;
        const success = await this.rootStore.apiClient.mergeBranches(this.selectedProject.id, sourceBranchName, targetBranchName);
        if (success) {
            // Need to refetch project data to see merged changes in the working copy of the target.
            const projects = await this.rootStore.apiClient.getProjects();
            runInAction(() => {
                this.projects = projects;
                this.rootStore.uiStore.showAlert(`Successfully merged "${sourceBranchName}" into "${targetBranchName}". You can now review and commit the changes.`, 'success');
            });
        } else {
            this.rootStore.uiStore.showAlert(`Failed to merge branches.`, 'error');
        }
    }

    // --- Comment Actions ---
    async fetchComments(projectId: string, termId: string) {
        try {
            const comments = await this.rootStore.apiClient.getComments(projectId, termId);
            runInAction(() => {
                this.comments = comments;
            });
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            this.rootStore.uiStore.showAlert('Could not load comments.', 'error');
        }
    }

    async addComment(content: string, parentId: string | null = null) {
        if (!this.selectedProject || !this.selectedTerm) return;
        try {
            await this.rootStore.apiClient.postComment(this.selectedProject.id, this.selectedTerm.id, content, parentId);
            // Refresh comments after posting
            await this.fetchComments(this.selectedProject.id, this.selectedTerm.id);
        } catch (error) {
            console.error("Failed to post comment:", error);
            this.rootStore.uiStore.showAlert('Could not post comment.', 'error');
        }
    }

    // --- API Key Actions ---
    async createApiKey(name: string, permissions: ApiKeyPermissions): Promise<ApiKey | null> {
        if (!this.selectedProject) return null;
        try {
            const newKey = await this.rootStore.apiClient.createApiKey(this.selectedProject.id, name, permissions);
            // Add the new key (without the secret) to the local state
            if (this.selectedProject) {
                const { secret, ...keyForState } = newKey;
                runInAction(() => {
                    this.selectedProject?.apiKeys?.unshift(keyForState);
                });
            }
            return newKey; // Return the full key with secret to the component
        } catch (error) {
            console.error("Failed to create API key:", error);
            this.rootStore.uiStore.showAlert('Could not create API key.', 'error');
            return null;
        }
    }

    async deleteApiKey(keyId: string) {
        if (!this.selectedProject) return;
        try {
            const success = await this.rootStore.apiClient.deleteApiKey(this.selectedProject.id, keyId);
            if (success && this.selectedProject.apiKeys) {
                runInAction(() => {
                    const keyIndex = this.selectedProject!.apiKeys!.findIndex(k => k.id === keyId);
                    if (keyIndex > -1) {
                        this.selectedProject!.apiKeys!.splice(keyIndex, 1);
                    }
                });
                 this.rootStore.uiStore.showAlert('API Key revoked successfully.', 'success');
            }
        } catch (error) {
             console.error("Failed to delete API key:", error);
            this.rootStore.uiStore.showAlert('Could not revoke API key.', 'error');
        }
    }
    
    // --- AI Batch Actions ---

    private async runAiBatchOperation(
        operation: (term: Term) => Promise<{ termId: string; newTranslation: string } | null>,
        targetLangCode: string
    ) {
        const termsToProcess = this.currentBranch?.workingTerms.slice() || [];
        const total = termsToProcess.length;
        if (total === 0) {
            this.rootStore.uiStore.showAlert('No terms to process.', 'info');
            return;
        }

        this.rootStore.uiStore.setAiActionState(true, 'Starting AI operation...', 0);
        const results = new Map<string, string>();

        try {
            for (let i = 0; i < total; i++) {
                const term = termsToProcess[i];
                // Introduce a small delay to avoid hitting rate limits too quickly
                if (i > 0) await new Promise(resolve => setTimeout(resolve, 50));
                
                const progress = Math.round(((i + 1) / total) * 100);
                this.rootStore.uiStore.setAiActionState(true, `Processing term ${i + 1} of ${total}: "${term.text}"`, progress);
                const result = await operation(term);
                if (result) {
                    results.set(result.termId, result.newTranslation);
                }
            }

            // Apply changes
            runInAction(() => {
                if (!this.currentBranch) return;
                const newWorkingTerms = this.currentBranch.workingTerms.map(term => {
                    if (results.has(term.id)) {
                        const newTranslations = { ...term.translations, [targetLangCode]: results.get(term.id)! };
                        return { ...term, translations: newTranslations };
                    }
                    return term;
                });
                this.currentBranch.workingTerms = newWorkingTerms;
            });

            this.rootStore.uiStore.setAiActionState(false, 'Operation complete!', 100);
            this.rootStore.uiStore.showAlert(`Successfully processed ${results.size} terms. Review and commit the new changes.`, 'success');
            this.rootStore.uiStore.closeAiActionsDialog();
        } catch (error) {
            console.error('AI Batch Operation Failed:', error);
            this.rootStore.uiStore.setAiActionState(false, 'An error occurred.', 0);
            this.rootStore.uiStore.showAlert('An error occurred during the AI operation. Check the console for details.', 'error');
        }
    }

    async translateToNewLanguage(targetLangCode: string) {
        if (!this.selectedProject || !this.currentBranch) return;

        const sourceLangCode = this.selectedProject.defaultLanguageCode;
        const sourceLang = AVAILABLE_LANGUAGES.find(l => l.code === sourceLangCode)?.name;
        const targetLang = AVAILABLE_LANGUAGES.find(l => l.code === targetLangCode)?.name;

        if (!sourceLang || !targetLang) {
            this.rootStore.uiStore.showAlert('Could not determine source or target language.', 'error');
            return;
        }

        const newLangObject = AVAILABLE_LANGUAGES.find(l => l.code === targetLangCode);
        if (!newLangObject) return;
        const newLanguages = [...this.selectedProject.languages, newLangObject];
        await this.updateProjectLanguages(newLanguages);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = async (term: Term) => {
            const sourceText = term.translations[sourceLangCode];
            if (!sourceText) return null;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following text from ${sourceLang} to ${targetLang}. Return only the translated string, without any extra formatting or quotation marks.\n\nText: "${sourceText}"`,
            });
            return { termId: term.id, newTranslation: response.text.trim() };
        };
        await this.runAiBatchOperation(operation, targetLangCode);
    }

    async reviewLanguage(targetLangCode: string) {
        if (!this.selectedProject || !this.currentBranch) return;
        const sourceLangCode = this.selectedProject.defaultLanguageCode;
        const sourceLang = AVAILABLE_LANGUAGES.find(l => l.code === sourceLangCode)?.name;
        const targetLang = AVAILABLE_LANGUAGES.find(l => l.code === targetLangCode)?.name;
        if (!sourceLang || !targetLang) return;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = async (term: Term) => {
            const sourceText = term.translations[sourceLangCode];
            const existingTranslation = term.translations[targetLangCode];
            if (!sourceText || !existingTranslation) return null;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `You are a professional proofreader. Review and correct the following ${targetLang} translation for the source text in ${sourceLang}. Return only the corrected translation. If the translation is already perfect, return it unchanged.\n\nSource Text (${sourceLang}): "${sourceText}"\n\nExisting Translation (${targetLang}): "${existingTranslation}"`,
            });
            return { termId: term.id, newTranslation: response.text.trim() };
        };
        await this.runAiBatchOperation(operation, targetLangCode);
    }

    async changeLanguageTone(targetLangCode: string, tone: string) {
        if (!this.selectedProject || !this.currentBranch) return;
        const targetLang = AVAILABLE_LANGUAGES.find(l => l.code === targetLangCode)?.name;
        if (!targetLang) return;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = async (term: Term) => {
            const existingTranslation = term.translations[targetLangCode];
            if (!existingTranslation) return null;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Rewrite the following ${targetLang} text to have a more "${tone}" tone. Return only the rewritten string.\n\nText: "${existingTranslation}"`,
            });
            return { termId: term.id, newTranslation: response.text.trim() };
        };
        await this.runAiBatchOperation(operation, targetLangCode);
    }
}