import { makeAutoObservable, runInAction } from 'mobx';
import { User } from '../types';
import { RootStore } from './RootStore';

export class AuthStore {
    rootStore: RootStore;
    currentUser: User | null = null;

    constructor(rootStore: RootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;
    }

    login = async (email: string, pass: string) => {
        const user = await this.rootStore.apiClient.login(email, pass);
        if (user) {
            this.currentUser = user;
            await this.rootStore.projectStore.initializeData();
            // No longer auto-select a project, show dashboard instead
            this.rootStore.uiStore.setView('app');
        } else {
            this.rootStore.uiStore.showAlert('Invalid email or password.', 'error');
        }
    };

    logout = () => {
        this.currentUser = null;
        this.rootStore.projectStore.clearData();
        this.rootStore.uiStore.setView('login');
    };

    updateCurrentUserName = async (newName: string) => {
        if (!this.currentUser) return;
        const updatedUser = await this.rootStore.apiClient.updateCurrentUserName(this.currentUser.id, newName);
        if (updatedUser) {
            runInAction(() => {
                this.currentUser = updatedUser;
            });
            this.rootStore.uiStore.showAlert('Name updated successfully!', 'success');
        } else {
            this.rootStore.uiStore.showAlert('Failed to update name.', 'error');
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