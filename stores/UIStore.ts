import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { AlertSeverity, Notification } from '../types';
import { ThemeName } from '../theme';

type View = 'login' | 'register' | 'forgotPassword' | 'app' | 'profile';
type Theme = 'light' | 'dark';

export class UIStore {
    rootStore: RootStore;
    view: View = 'login';
    theme: Theme = 'light';
    themeName: ThemeName = 'default';
    isTeamManagerOpen = false;
    isBranchManagerOpen = false;
    isCreateProjectDialogOpen = false;
    isApiSpecModalOpen = false;
    isCommitDialogOpen = false;
    isImportExportDialogOpen = false;

    notifications: Notification[] = [];

    // Alert state
    isAlertOpen = false;
    alertMessage = '';
    alertSeverity: AlertSeverity = 'info';

    constructor(rootStore: RootStore) {
        makeAutoObservable(this);
        this.rootStore = rootStore;

        const savedThemeMode = localStorage.getItem('themeMode') as Theme | null;
        const savedThemeName = localStorage.getItem('themeName') as ThemeName | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        this.setTheme(savedThemeMode || (prefersDark ? 'dark' : 'light'));
        this.setThemeName(savedThemeName || 'default');
    }

    get unreadNotificationCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    setView = (view: View) => {
        this.view = view;
    };

    setTheme = (theme: Theme) => {
        this.theme = theme;
        localStorage.setItem('themeMode', theme);
    };

    toggleTheme = () => {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    };
    
    setThemeName = (name: ThemeName) => {
        this.themeName = name;
        localStorage.setItem('themeName', name);
    };

    openTeamManager = () => {
        this.isTeamManagerOpen = true;
    };
    
    closeTeamManager = () => {
        this.isTeamManagerOpen = false;
    };

    openBranchManager = () => {
        this.isBranchManagerOpen = true;
    };

    closeBranchManager = () => {
        this.isBranchManagerOpen = false;
    };

    openCreateProjectDialog = () => {
        this.isCreateProjectDialogOpen = true;
    };

    closeCreateProjectDialog = () => {
        this.isCreateProjectDialogOpen = false;
    };

    openApiSpecModal = () => {
        this.isApiSpecModalOpen = true;
    };

    closeApiSpecModal = () => {
        this.isApiSpecModalOpen = false;
    };

    openCommitDialog = () => {
        this.isCommitDialogOpen = true;
    };

    closeCommitDialog = () => {
        this.isCommitDialogOpen = false;
    };
    
    openImportExportDialog = () => {
        this.isImportExportDialogOpen = true;
    };

    closeImportExportDialog = () => {
        this.isImportExportDialogOpen = false;
    };

    showAlert = (message: string, severity: AlertSeverity = 'info') => {
        this.alertMessage = message;
        this.alertSeverity = severity;
        this.isAlertOpen = true;
    };

    hideAlert = () => {
        this.isAlertOpen = false;
    };

    // --- Notification Actions ---
    fetchNotifications = async () => {
        try {
            const notifications = await this.rootStore.apiClient.getNotifications();
            runInAction(() => {
                this.notifications = notifications;
            });
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    markNotificationsAsRead = async (notificationIds: string[]) => {
        try {
            await this.rootStore.apiClient.markNotificationsAsRead(notificationIds);
            runInAction(() => {
                this.notifications.forEach(n => {
                    if (notificationIds.includes(n.id)) {
                        n.read = true;
                    }
                });
            });
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            this.showAlert('Could not update notifications.', 'error');
        }
    };
}