import { makeAutoObservable } from 'mobx';
import { RootStore } from './RootStore';
import { AlertSeverity } from '../types';

type View = 'login' | 'register' | 'forgotPassword' | 'app';
type Theme = 'light' | 'dark';

export class UIStore {
    rootStore: RootStore;
    view: View = 'login';
    theme: Theme = 'light';
    isTeamManagerOpen = false;

    // Alert state
    isAlertOpen = false;
    alertMessage = '';
    alertSeverity: AlertSeverity = 'info';

    constructor(rootStore: RootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;

        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }

    setView = (view: View) => {
        this.view = view;
    };

    setTheme = (theme: Theme) => {
        this.theme = theme;
        localStorage.setItem('theme', theme);
    };

    toggleTheme = () => {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    };
    
    openTeamManager = () => {
        this.isTeamManagerOpen = true;
    };
    
    closeTeamManager = () => {
        this.isTeamManagerOpen = false;
    };

    showAlert = (message: string, severity: AlertSeverity = 'info') => {
        this.alertMessage = message;
        this.alertSeverity = severity;
        this.isAlertOpen = true;
    };

    hideAlert = () => {
        this.isAlertOpen = false;
    };
}