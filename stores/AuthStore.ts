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
            runInAction(() => {
                this.currentUser = user;
            });
            await this.rootStore.projectStore.initializeData();
            this.rootStore.uiStore.setView('app');
            this.rootStore.uiStore.initializeWebSocket(); // Connect WebSocket on login
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

        try {
            const user = await this.rootStore.apiClient.getCurrentUser();
            if (user) {
                runInAction(() => {
                    this.currentUser = user;
                });
                await this.rootStore.projectStore.initializeData();
                this.rootStore.uiStore.setView('app');
                this.rootStore.uiStore.initializeWebSocket(); // Connect WebSocket on session restore
            }
        } catch (error) {
            console.log('User not authenticated');
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

    logout = async () => {
        this.rootStore.uiStore.closeWebSocket(); // Disconnect WebSocket
        this.rootStore.uiStore.stopNotificationPolling(); // Stop polling
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