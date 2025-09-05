import { makeAutoObservable } from 'mobx';
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
        const user = this.rootStore.projectStore.allUsers.find(u => u.email === email);
        if (user && pass === 'password') {
            this.currentUser = user;
            const firstProject = this.rootStore.projectStore.projects[0];
            if (firstProject) {
                this.rootStore.projectStore.selectProject(firstProject.id);
            }
            this.rootStore.uiStore.setView('app');
        } else {
            this.rootStore.uiStore.showAlert('Invalid email or password.', 'error');
        }
    };

    logout = () => {
        this.currentUser = null;
        this.rootStore.uiStore.setView('login');
    };
}