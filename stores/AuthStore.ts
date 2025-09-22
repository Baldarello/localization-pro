import { makeAutoObservable, runInAction } from 'mobx';
import { User } from '../types';
import { RootStore } from './RootStore';

export class AuthStore {
    rootStore: RootStore;
    currentUser: User | null = null;
    isAuthCheckComplete = false;
    isGoogleAuthEnabled = false;

    // Usage Limits State
    isUsageLimitsEnforced = false;
    projectLimit = Infinity;
    termLimit = Infinity;
    memberLimit = Infinity;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;

        // On app initialization, check for a stored token to persist the session.
        const token = localStorage.getItem('authToken');
        if (token) {
            this.rootStore.apiClient.setAuth(token);
        }
    }

    fetchAuthConfig = async () => {
        try {
            const config = await this.rootStore.apiClient.getAuthConfig();
            runInAction(() => {
                this.isGoogleAuthEnabled = config.googleAuthEnabled;
                if (config.usageLimits?.enforced) {
                    this.isUsageLimitsEnforced = true;
                    this.projectLimit = config.usageLimits.projects;
                    this.termLimit = config.usageLimits.terms;
                    this.memberLimit = config.usageLimits.members;
                } else {
                    this.isUsageLimitsEnforced = false;
                    this.projectLimit = Infinity;
                    this.termLimit = Infinity;
                    this.memberLimit = Infinity;
                }
            });
        } catch (error) {
            console.error("Could not fetch auth config:", error);
        }
    }

    login = async (email: string, pass: string) => {
        const user = await this.rootStore.apiClient.login(email, pass);
        if (user) {
            // Persist the token (user ID) in localStorage for session recovery on page reload.
            localStorage.setItem('authToken', user.id);
            runInAction(() => {
                this.currentUser = user;
            });
            await this.rootStore.projectStore.initializeData();
            this.rootStore.uiStore.setView('app');
            this.rootStore.uiStore.startNotificationPolling(); // Start polling on login
        } else {
            this.rootStore.uiStore.showAlert('Invalid email or password.', 'error');
        }
    };

    loginWithGoogle = () => {
        // The backend URL for initiating Google OAuth
        window.location.href = `${this.rootStore.apiClient.getBaseUrl()}/auth/google`;
    };

    checkAuthStatus = async () => {
        if (this.isAuthCheckComplete) return;

        // The apiClient has the auth token set from the constructor if it was in localStorage.
        const token = localStorage.getItem('authToken');
        if (!token) {
            // If there's no token, we are definitely not logged in.
            runInAction(() => { this.isAuthCheckComplete = true; });
            return;
        }

        try {
            const user = await this.rootStore.apiClient.getCurrentUser();
            if (user) {
                // Token is valid, user is authenticated.
                runInAction(() => {
                    this.currentUser = user;
                });
                await this.rootStore.projectStore.initializeData();
                this.rootStore.uiStore.setView('app');
            } else {
                // The token was invalid (e.g., deleted user), clear it.
                localStorage.removeItem('authToken');
                this.rootStore.apiClient.setAuth(null);
            }
        } catch (error) {
            console.log('User not authenticated, clearing invalid token.');
            // An error (like 401) also means the token is invalid.
            localStorage.removeItem('authToken');
            this.rootStore.apiClient.setAuth(null);
        } finally {
            runInAction(() => {
                this.isAuthCheckComplete = true;
            });
        }
    };

    register = async (name: string, email: string, pass: string) => {
        const { user, message } = await this.rootStore.apiClient.register(name, email, pass);
        if (user) {
            this.rootStore.uiStore.showAlert('Registration successful! Please log in.', 'success');
            this.rootStore.uiStore.setView('login');
        } else {
            this.rootStore.uiStore.showAlert(message, 'error');
        }
    };

    forgotPassword = async (email: string) => {
        const { message } = await this.rootStore.apiClient.forgotPassword(email);
        // The API always returns a success-style message to prevent user enumeration.
        this.rootStore.uiStore.showAlert(message, 'success');
    };

    resetPassword = async (token: string, newPassword: string) => {
        const result = await this.rootStore.apiClient.resetPassword(token, newPassword);
        if (result.success) {
            this.rootStore.uiStore.showAlert(result.message, 'success');
            this.rootStore.uiStore.setView('login');
        } else {
            this.rootStore.uiStore.showAlert(result.message, 'error');
        }
        return result.success;
    };

    logout = async () => {
        this.rootStore.uiStore.closeWebSocket(); // Disconnect WebSocket
        this.rootStore.uiStore.stopNotificationPolling(); // Stop polling
        
        // Clear the persisted token from both localStorage and the API client.
        localStorage.removeItem('authToken');
        this.rootStore.apiClient.setAuth(null);

        await this.rootStore.apiClient.logout();
        runInAction(() => {
            this.currentUser = null;
            this.rootStore.projectStore.clearData();
            this.rootStore.uiStore.setView('login');
        });
    };

    updateCurrentUserName = async (newName: string) => {
        if (!this.currentUser) return;
        const updatedUser = await this.rootStore.apiClient.updateCurrentUserName(this.currentUser.id, newName);
        if (updatedUser) {
            runInAction(() => {
                if (this.currentUser) {
                    this.currentUser.name = updatedUser.name;
                    this.currentUser.avatarInitials = updatedUser.avatarInitials;
                }
            });
            this.rootStore.uiStore.showAlert('Name updated successfully!', 'success');
        } else {
            this.rootStore.uiStore.showAlert('Failed to update name.', 'error');
        }
    };

    updateUserSettings = async (settings: { commitNotifications: boolean }) => {
        if (!this.currentUser) return;
        const updatedUser = await this.rootStore.apiClient.updateUserSettings(this.currentUser.id, settings);
        if (updatedUser) {
            runInAction(() => {
                this.currentUser = updatedUser;
            });
            this.rootStore.uiStore.showAlert('Settings updated!', 'success');
        } else {
            this.rootStore.uiStore.showAlert('Failed to update settings.', 'error');
        }
    };

    changePassword = async (currentPassword: string, newPassword: string) => {
        if (!this.currentUser) return;
        const result = await this.rootStore.apiClient.changePassword(this.currentUser.id, currentPassword, newPassword);
        if (result.success) {
            this.rootStore.uiStore.showAlert(result.message, 'success');
        } else {
            this.rootStore.uiStore.showAlert(result.message, 'error');
        }
        return result.success;
    };
}
