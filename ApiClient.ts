import { Project, Term, Language, User, UserRole, Branch, Commit, Notification, Comment, ApiKey, ApiKeyPermissions } from './types';

// The base URL is now dynamically set by the Vite build process
export const API_BASE_URL = process.env.API_BASE_URL || 'https://localizationpro-api.tnl.one/api/v1';

export interface AddMemberResult {
    user: User | null;
    success: boolean;
    message: string;
    code?: 'user_exists' | 'project_not_found' | 'invitation_exists';
}

export interface AuthConfig {
    googleAuthEnabled: boolean;
    usageLimits?: {
        enforced: boolean;
        projects: number;
        terms: number;
        members: number;
    }
}


class ApiClient {
    // The currentUserId is no longer needed for auth, as the session cookie handles it.
    // It's kept here as the backend still uses it for mock authentication. This could be removed
    // if the backend fully switches to session-only auth for all endpoints.
    private currentUserId: string | null = null;
    
    public getBaseUrl(): string {
        return API_BASE_URL;
    }

    public setAuth(userId: string | null) {
        this.currentUserId = userId;
    }

    private async apiFetch(endpoint: string, options: RequestInit = {}) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        // The X-User-ID header is kept for the mock authentication system.
        // For session-based auth (like Google OAuth), the browser automatically sends the cookie.
        if (this.currentUserId) {
            headers['X-User-ID'] = this.currentUserId;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include', // Send cookies with all requests
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                const error: any = new Error(errorBody.message || 'An API error occurred');
                error.status = response.status;
                throw error;
            }
            if (response.status === 204) { // No Content
                return null;
            }
            return response.json();
        } catch (error: any) {
            // Special handling for the expected 401 on /auth/me on initial app load.
            // This is a normal state, not an error.
            if (endpoint === '/auth/me' && error.status === 401) {
                console.warn(`API call to /auth/me returned status 401: ${error.message}. This is expected if the user is not logged in.`);
            } else {
                 console.error(`API call to ${endpoint} failed:`, error);
            }
            throw error;
        }
    }

    async login(email: string, pass: string): Promise<User | null> {
        try {
            const user = await this.apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, pass }),
            });
            if (user) {
                this.setAuth(user.id);
            }
            return user;
        } catch (error) {
            return null;
        }
    }

    async getAuthConfig(): Promise<AuthConfig> {
        try {
            return await this.apiFetch('/auth/config');
        } catch (error) {
            // Default to disabled if the endpoint fails
            return { googleAuthEnabled: false };
        }
    }

    async logout(): Promise<void> {
        try {
            await this.apiFetch('/auth/logout', { method: 'POST' });
            this.setAuth(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async getCurrentUser(): Promise<User | null> {
        return await this.apiFetch('/auth/me');
    }
    
    async register(name: string, email: string, pass: string): Promise<{user: User | null, message: string}> {
        try {
            const user = await this.apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, pass }),
            });
            return { user, message: 'Registration successful!' };
        } catch (error: any) {
            return { user: null, message: error.message || 'Registration failed.' };
        }
    }

    async forgotPassword(email: string): Promise<{success: boolean, message: string}> {
        try {
            const result = await this.apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            return { success: true, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async updateCurrentUserName(userId: string, newName: string): Promise<User | null> {
        return await this.apiFetch(`/users/${userId}/profile`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName }),
        });
    }

    async updateUserSettings(userId: string, settings: { commitNotifications: boolean }): Promise<User | null> {
        return await this.apiFetch(`/users/${userId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
         try {
            const result = await this.apiFetch(`/users/${userId}/password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            return { success: true, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async getProjects(): Promise<Project[]> {
        return await this.apiFetch('/projects');
    }

    async getProjectById(projectId: string): Promise<Project | null> {
        try {
            return await this.apiFetch(`/projects/${projectId}`);
        } catch (error) {
            console.error(`API call to /projects/${projectId} failed:`, error);
            return null;
        }
    }
    
    async getAllUsers(): Promise<User[]> {
        return await this.apiFetch('/users');
    }

    async addProject(name: string, userId: string): Promise<Project> {
        return await this.apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify({ name, userId }),
        });
    }
    
    async addTerm(projectId: string, termText: string): Promise<Term | null> {
        return await this.apiFetch(`/projects/${projectId}/terms`, {
            method: 'POST',
            body: JSON.stringify({ termText }),
        });
    }
    
    async updateTranslation(projectId: string, termId: string, langCode: string, value: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/terms/${termId}/translations/${langCode}`, {
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
            await this.apiFetch(`/projects/${projectId}/terms/${termId}`, {
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
            await this.apiFetch(`/projects/${projectId}/terms/${termId}/context`, {
                method: 'PUT',
                body: JSON.stringify({ context }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async updateProjectLanguages(projectId: string, newLanguages: Language[]): Promise<Project | null> {
        return await this.apiFetch(`/projects/${projectId}/languages`, {
            method: 'PUT',
            body: JSON.stringify(newLanguages),
        });
    }

    async setDefaultLanguage(projectId: string, langCode: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/defaultLanguage`, {
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
            await this.apiFetch(`/projects/${projectId}/terms/${termId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async bulkUpdateTerms(projectId: string, terms: Term[]): Promise<void> {
        await this.apiFetch(`/projects/${projectId}/terms/bulk`, {
            method: 'PUT',
            body: JSON.stringify(terms),
        });
    }
    
    async addMember(projectId: string, email: string, role: UserRole, languages: string[]): Promise<AddMemberResult> {
        // Errors will now be thrown by apiFetch and handled in the store
        return await this.apiFetch(`/projects/${projectId}/team`, {
            method: 'POST',
            body: JSON.stringify({ email, role, languages }),
        });
    }

    async revokeInvitation(projectId: string, invitationId: number): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/invitations/${invitationId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async removeMember(projectId: string, userId: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/team/${userId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async updateMemberLanguages(projectId: string, userId: string, assignedLanguages: string[]): Promise<boolean> {
         try {
            await this.apiFetch(`/projects/${projectId}/team/${userId}/languages`, {
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
            await this.apiFetch(`/projects/${projectId}/team/${userId}/role`, {
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
        return await this.apiFetch(`/projects/${projectId}/branches/${branchName}/commits`, {
            method: 'POST',
            body: JSON.stringify({ message, authorId }),
        });
    }

    async deleteLatestCommit(projectId: string, branchName: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/branches/${branchName}/commits/latest`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // --- BRANCHING API ---
    async createBranch(projectId: string, newBranchName: string, sourceBranchName: string): Promise<Branch | null> {
        return await this.apiFetch(`/projects/${projectId}/branches`, {
            method: 'POST',
            body: JSON.stringify({ newBranchName, sourceBranchName }),
        });
    }

    async createBranchFromCommit(projectId: string, commitId: string, newBranchName: string): Promise<Branch | null> {
         return await this.apiFetch(`/projects/${projectId}/branches/from-commit`, {
            method: 'POST',
            body: JSON.stringify({ commitId, newBranchName }),
        });
    }

    async switchBranch(projectId: string, branchName: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/currentBranch`, {
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
            await this.apiFetch(`/projects/${projectId}/branches/${branchName}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async mergeBranches(projectId: string, sourceBranchName: string, targetBranchName: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/branches/merge`, {
                method: 'POST',
                body: JSON.stringify({ sourceBranchName, targetBranchName }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // --- Comments & Notifications ---
    async getComments(projectId: string, termId: string): Promise<Comment[]> {
        return await this.apiFetch(`/projects/${projectId}/terms/${termId}/comments`);
    }

    async postComment(projectId: string, termId: string, content: string, parentId: string | null): Promise<Comment> {
        return await this.apiFetch(`/projects/${projectId}/terms/${termId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content, parentId }),
        });
    }

    async getNotifications(): Promise<Notification[]> {
        return await this.apiFetch('/users/me/notifications');
    }

    async markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
        try {
            await this.apiFetch('/users/me/notifications/read', {
                method: 'POST',
                body: JSON.stringify({ notificationIds }),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // --- API Keys ---
    async getApiKeys(projectId: string): Promise<ApiKey[]> {
        return await this.apiFetch(`/projects/${projectId}/api-keys`);
    }

    async createApiKey(projectId: string, name: string, permissions: ApiKeyPermissions): Promise<ApiKey> {
        return await this.apiFetch(`/projects/${projectId}/api-keys`, {
            method: 'POST',
            body: JSON.stringify({ name, permissions }),
        });
    }

    async deleteApiKey(projectId: string, keyId: string): Promise<boolean> {
        try {
            await this.apiFetch(`/projects/${projectId}/api-keys/${keyId}`, {
                method: 'DELETE',
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default new ApiClient();