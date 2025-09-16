import { Project, Term, Language, User, UserRole, Branch, Commit } from './types';

// The base URL for the backend API
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Simulate network latency
// const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper function for making API requests
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorBody.message || 'An API error occurred');
        }
        if (response.status === 204) { // No Content
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
};


export interface AddMemberResult {
    user: User | null;
    success: boolean;
    message: string;
    code?: 'user_exists' | 'user_not_found' | 'project_not_found';
}

class ApiClient {
    async login(email: string, pass: string): Promise<User | null> {
        // The backend will return a user object on success or a 401/403 error on failure
        try {
            return await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, pass }),
            });
        } catch (error) {
            return null; // Login failed
        }
    }
    
    async updateCurrentUserName(userId: string, newName: string): Promise<User | null> {
        return await apiFetch(`/users/${userId}/profile`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName }),
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
         try {
            const result = await apiFetch(`/users/${userId}/password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            return { success: true, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async getProjects(): Promise<Project[]> {
        return await apiFetch('/projects');
    }
    
    async getAllUsers(): Promise<User[]> {
        return await apiFetch('/users');
    }

    async addProject(name: string, userId: string): Promise<Project> {
        return await apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify({ name, userId }),
        });
    }
    
    async addTerm(projectId: string, termText: string): Promise<Term | null> {
        // The current branch is managed on the backend based on the project's state
        return await apiFetch(`/projects/${projectId}/terms`, {
            method: 'POST',
            body: JSON.stringify({ termText }),
        });
    }
    
    async updateTranslation(projectId: string, termId: string, langCode: string, value: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/terms/${termId}/translations/${langCode}`, {
                method: 'PUT',
                body: JSON.stringify({ value }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateTermText(projectId: string, termId: string, newText: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/terms/${termId}`, {
                method: 'PUT',
                body: JSON.stringify({ text: newText }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateTermContext(projectId: string, termId: string, context: string): Promise<boolean> {
         try {
            await apiFetch(`/projects/${projectId}/terms/${termId}/context`, {
                method: 'PUT',
                body: JSON.stringify({ context }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateProjectLanguages(projectId: string, newLanguages: Language[]): Promise<Project | null> {
        return await apiFetch(`/projects/${projectId}/languages`, {
            method: 'PUT',
            body: JSON.stringify(newLanguages),
        });
    }

    async setDefaultLanguage(projectId: string, langCode: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/defaultLanguage`, {
                method: 'PUT',
                body: JSON.stringify({ langCode }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async deleteTerm(projectId: string, termId: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/terms/${termId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async addMember(projectId: string, email: string, role: UserRole, languages: string[]): Promise<AddMemberResult> {
        try {
            return await apiFetch(`/projects/${projectId}/team`, {
                method: 'POST',
                body: JSON.stringify({ email, role, languages }),
            });
        } catch (error: any) {
             return { user: null, success: false, message: error.message };
        }
    }

    async removeMember(projectId: string, userId: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/team/${userId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async updateMemberLanguages(projectId: string, userId: string, assignedLanguages: string[]): Promise<boolean> {
         try {
            await apiFetch(`/projects/${projectId}/team/${userId}/languages`, {
                method: 'PUT',
                body: JSON.stringify(assignedLanguages),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateMemberRole(projectId: string, userId: string, role: UserRole): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/team/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // --- COMMIT API ---
    async createCommit(projectId: string, branchName: string, message: string, authorId: string): Promise<Commit | null> {
        return await apiFetch(`/projects/${projectId}/branches/${branchName}/commits`, {
            method: 'POST',
            body: JSON.stringify({ message, authorId }),
        });
    }

    // --- BRANCHING API ---
    async createBranch(projectId: string, newBranchName: string, sourceBranchName: string): Promise<Branch | null> {
        return await apiFetch(`/projects/${projectId}/branches`, {
            method: 'POST',
            body: JSON.stringify({ newBranchName, sourceBranchName }),
        });
    }

    async createBranchFromCommit(projectId: string, commitId: string, newBranchName: string): Promise<Branch | null> {
         return await apiFetch(`/projects/${projectId}/branches/from-commit`, {
            method: 'POST',
            body: JSON.stringify({ commitId, newBranchName }),
        });
    }

    async deleteLatestCommit(projectId: string, branchName: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/branches/${branchName}/commits/latest`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async switchBranch(projectId: string, branchName: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/currentBranch`, {
                method: 'PUT',
                body: JSON.stringify({ branchName }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async deleteBranch(projectId: string, branchName: string): Promise<boolean> {
         try {
            await apiFetch(`/projects/${projectId}/branches/${branchName}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async mergeBranches(projectId: string, sourceBranchName: string, targetBranchName: string): Promise<boolean> {
        try {
            await apiFetch(`/projects/${projectId}/branches/merge`, {
                method: 'POST',
                body: JSON.stringify({ sourceBranchName, targetBranchName }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new ApiClient();
