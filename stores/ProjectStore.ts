


import { makeAutoObservable, runInAction } from 'mobx';
import { Project, Term, Language, User, UserRole, Branch, Commit } from '../types';
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
    }
    
    clearData() {
        this.projects = [];
        this.allUsers = [];
        this.selectedProjectId = null;
        this.selectedTermId = null;
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

    get uncommittedChangesCount(): number {
        if (!this.currentBranch || !this.latestCommit) return 0;
        
        const workingTermsMap = new Map(this.currentBranch.workingTerms.map(t => [t.id, t]));
        const committedTermsMap = new Map(this.latestCommit.terms.map(t => [t.id, t]));

        let changes = 0;
        
        // Check for modifications and deletions
        for (const [id, committedTerm] of committedTermsMap.entries()) {
            if (!workingTermsMap.has(id)) {
                changes++; // Deleted
            } else {
                const workingTerm = workingTermsMap.get(id)!;
                if (!areTermsEqual(committedTerm, workingTerm)) {
                    changes++; // Modified
                }
            }
        }

        // Check for additions
        for (const id of workingTermsMap.keys()) {
            if (!committedTermsMap.has(id)) {
                changes++; // Added
            }
        }
        
        return changes;
    }

    get currentUserRole() {
        const user = this.rootStore.authStore.currentUser;
        if (!this.selectedProject || !user) return null;
        return this.selectedProject.team[user.id]?.role;
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

    selectProject(projectId: string) {
        this.selectedProjectId = projectId;
        const project = this.projects.find(p => p.id === projectId);
        const currentTerms = project?.branches.find(b => b.name === project.currentBranchName)?.workingTerms || [];
        this.selectedTermId = currentTerms[0]?.id || null;
    };

    deselectProject() {
        this.selectedProjectId = null;
        this.selectedTermId = null;
    }
    
    selectTerm(termId: string) {
        this.selectedTermId = termId;
    }

    async addProject(name: string) {
        const user = this.rootStore.authStore.currentUser;
        if (!user) return;
        const newProject = await this.rootStore.apiClient.addProject(name, user.id);
        runInAction(() => {
            this.projects.push(newProject);
        });
    };
    
    async addTerm(termText: string) {
        if (!this.selectedProject || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        const newTerm = await this.rootStore.apiClient.addTerm(this.selectedProject.id, termText);
        if (newTerm) {
            runInAction(() => {
                this.currentBranch?.workingTerms.push(newTerm);
                this.selectedTermId = newTerm.id;
            });
        }
    };

    async updateTranslation(projectId: string, termId: string, langCode: string, value: string) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        const branch = project.branches.find(b => b.name === project.currentBranchName);
        const term = branch?.workingTerms.find(t => t.id === termId);

        if (term) {
            term.translations[langCode] = value;
            await this.rootStore.apiClient.updateTranslation(projectId, termId, langCode, value);
        }
    };

    async updateTermText(termId: string, newText: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;
        
        const term = this.currentBranch.workingTerms.find(t => t.id === termId);
        if (term) {
            const originalText = term.text;
            term.text = newText;
            const success = await this.rootStore.apiClient.updateTermText(this.selectedProject.id, termId, newText);
            if (!success) {
                runInAction(() => { term.text = originalText });
                this.rootStore.uiStore.showAlert('Failed to update term key.', 'error');
            }
        }
    };

    async updateTermContext(termId: string, newContext: string) {
        if (!this.selectedProject || !this.currentBranch || (this.currentUserRole !== UserRole.Admin && this.currentUserRole !== UserRole.Editor)) return;

        const term = this.currentBranch.workingTerms.find(t => t.id === termId);
        if (term) {
            const originalContext = term.context;
            term.context = newContext;
            const success = await this.rootStore.apiClient.updateTermContext(this.selectedProject.id, termId, newContext);
            if (!success) {
                runInAction(() => { term.context = originalContext; });
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
    
    async addMember(email: string, role: UserRole, languages: string[]) {
        if (!this.selectedProject || this.currentUserRole !== UserRole.Admin) return;
        
        const trimmedEmail = email.trim();
        if (!trimmedEmail) { this.rootStore.uiStore.showAlert('Email cannot be empty.', 'error'); return; }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) { this.rootStore.uiStore.showAlert('Please enter a valid email address.', 'error'); return; }
        
        const result: AddMemberResult = await this.rootStore.apiClient.addMember(this.selectedProject.id, trimmedEmail, role, languages);

        if (result.success) {
            runInAction(() => {
                if (this.selectedProject && result.user) {
                    this.selectedProject.team[result.user.id] = { role, languages };
                }
            });
            this.rootStore.uiStore.showAlert(result.message, 'success');
        } else {
            this.rootStore.uiStore.showAlert(result.message, result.code === 'user_exists' ? 'warning' : 'error');
        }
    };

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
        if (!this.selectedProject || !this.currentBranch || !this.latestCommit) {
            this.rootStore.uiStore.showAlert('Could not find project data to export.', 'error');
            return;
        }

        const terms = this.latestCommit.terms;
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
        const workingTerms = this.currentBranch.workingTerms;

        try {
            if (fileExtension === 'json') {
                if (!options.langCode) {
                    throw new Error('Please select a language for this JSON file.');
                }
                const data = JSON.parse(fileContent) as Record<string, string>;
                for (const key in data) {
                    const term = workingTerms.find(t => t.text === key);
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
                            workingTerms.push(newTerm);
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
                    const term = workingTerms.find(t => t.text === key);

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
                            workingTerms.push(newTerm);
                            stats.created++;
                        } else {
                            stats.ignored++;
                        }
                    }
                }
            } else {
                throw new Error('Unsupported file format. Please use .json or .csv');
            }
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
            runInAction(() => {
                this.selectedProject?.branches.push(newBranch);
                this.rootStore.uiStore.showAlert(`Branch "${newBranchName}" created successfully.`, 'success');
            });
        } else {
            this.rootStore.uiStore.showAlert(`Failed to create branch "${newBranchName}". It may already exist.`, 'error');
        }
    }

    async createBranchFromCommit(commitId: string, newBranchName: string) {
        if (!this.selectedProject) return;
        const newBranch = await this.rootStore.apiClient.createBranchFromCommit(this.selectedProject.id, commitId, newBranchName);
        if (newBranch) {
            runInAction(() => {
                this.selectedProject?.branches.push(newBranch);
                this.rootStore.uiStore.showAlert(`Branch "${newBranchName}" created from commit ${commitId.slice(-7)}.`, 'success');
            });
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
}