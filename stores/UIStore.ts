import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { AlertSeverity, Notification } from '../types';
import { ThemeName } from '../theme';
import { API_BASE_URL } from '../ApiClient';

type View = 'home' | 'login' | 'register' | 'forgotPassword' | 'app' | 'profile' | 'resetPassword' | 'docs';
type Theme = 'light' | 'dark';

export class UIStore {
    rootStore: RootStore;
    view: View = 'home';
    theme: Theme = 'light';
    themeName: ThemeName = 'default';
    isTeamManagerOpen = false;
    isBranchManagerOpen = false;
    isCreateProjectDialogOpen = false;
    isApiSpecModalOpen = false;
    isCommitDialogOpen = false;
    isImportExportDialogOpen = false;
    isApiKeysManagerOpen = false;
    isAiActionsDialogOpen = false;
    
    // Loading state
    loadingCount = 0;
    isFetchingNotifications = false;
    
    // AI Action state
    aiActionState = {
        running: false,
        message: '',
        progress: 0,
    };

    private notificationInterval: number | null = null;
    private websocket: WebSocket | null = null;
    private reconnectionTimeout: number | null = null;
    private shouldReconnect = false;

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
    
    get isLoading() {
        return this.loadingCount > 0;
    }

    startLoading = () => {
        this.loadingCount++;
    };

    stopLoading = () => {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
    };

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

    openApiKeysManager = () => {
        this.isApiKeysManagerOpen = true;
    };

    closeApiKeysManager = () => {
        this.isApiKeysManagerOpen = false;
    };

    openAiActionsDialog = () => {
        this.isAiActionsDialogOpen = true;
    };

    closeAiActionsDialog = () => {
        this.isAiActionsDialogOpen = false;
        // Reset state on close
        this.aiActionState = { running: false, message: '', progress: 0 };
    };

    setAiActionState = (running: boolean, message: string, progress: number) => {
        this.aiActionState = { running, message, progress };
    };

    showAlert = (message: string, severity: AlertSeverity = 'info') => {
        this.alertMessage = message;
        this.alertSeverity = severity;
        this.isAlertOpen = true;
    };

    hideAlert = () => {
        this.isAlertOpen = false;
    };

    startNotificationPolling = () => {
        // Prevent multiple intervals from starting
        if (this.notificationInterval) {
            return;
        }
        this.fetchNotifications(); // Fetch immediately on start
        this.notificationInterval = window.setInterval(() => {
            // Only fetch if the user is still logged in
            if (this.rootStore.authStore.currentUser) {
                this.fetchNotifications();
            } else {
                this.stopNotificationPolling();
            }
        }, 60000); // Poll every 60 seconds
    };

    stopNotificationPolling = () => {
        if (this.notificationInterval) {
            window.clearInterval(this.notificationInterval);
            this.notificationInterval = null;
        }
    };

    // --- WebSocket Actions ---
    sendWebSocketMessage = (payload: object) => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(payload));
        }
    };

    initializeWebSocket = async () => {
        if (this.websocket && this.websocket.readyState !== WebSocket.CLOSED) {
            console.log("WebSocket connection already open.");
            return;
        }

        this.shouldReconnect = true;

        // Step 1: Request a short-lived ticket from the backend for WebSocket authentication
        const ticketResponse = await this.rootStore.apiClient.getWebSocketTicket();
        if (!ticketResponse?.ticket) {
            console.error("Could not obtain WebSocket ticket. Connection aborted.");
            this.shouldReconnect = false; // Do not attempt to reconnect if we can't get a ticket
            return;
        }

        let wsUrl;
        try {
            const apiUrl = new URL(API_BASE_URL);
            const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = apiUrl.host;
            // Step 2: Append the ticket to the WebSocket URL
            wsUrl = `${wsProtocol}//${wsHost}?ticket=${ticketResponse.ticket}`;
        } catch (e) {
            console.error("Could not initialize WebSocket due to invalid API_BASE_URL:", e);
            this.shouldReconnect = false;
            return;
        }
        
        console.log(`Attempting to connect WebSocket to ${wsUrl}`);
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
            console.log("WebSocket connection established.");
            if (this.rootStore.projectStore.selectedProject && this.rootStore.projectStore.currentBranch) {
                this.rootStore.projectStore.notifyViewingBranch();
            }
        };

        this.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("WebSocket message received:", message);

                switch (message.type) {
                    case 'new_notification':
                        this.fetchNotifications();
                        break;
                    case 'server_branch_updated':
                        if (message.modifiedBy !== this.rootStore.authStore.currentUser?.id) {
                            this.rootStore.projectStore.handleBranchUpdate(message);
                        }
                        break;
                    case 'server_new_comment':
                        if (this.rootStore.projectStore.selectedTermId && message.termId === this.rootStore.projectStore.selectedTermId) {
                            this.rootStore.projectStore.fetchComments(message.projectId, message.termId);
                        }
                        break;
                    case 'server_user_typing_start':
                        if (message.userId !== this.rootStore.authStore.currentUser?.id && message.termId === this.rootStore.projectStore.selectedTermId) {
                            this.rootStore.projectStore.startTyping(message.userId, message.userName);
                        }
                        break;
                    case 'server_user_typing_stop':
                        this.rootStore.projectStore.stopTyping(message.userId);
                        break;
                }

            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        this.websocket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.websocket.onclose = (event) => {
            console.log("WebSocket connection closed. Code:", event.code);
            // Don't auto-reconnect on auth failure (1008 Policy Violation)
            if (event.code === 1008) {
                this.shouldReconnect = false;
                console.error("WebSocket connection rejected due to invalid ticket. Not reconnecting.");
                return;
            }
            if (this.shouldReconnect) {
                console.log("Attempting to reconnect WebSocket in 5 seconds...");
                this.reconnectionTimeout = window.setTimeout(this.initializeWebSocket, 5000);
            }
        };
    };

    closeWebSocket = () => {
        if (this.reconnectionTimeout) {
            window.clearTimeout(this.reconnectionTimeout);
            this.reconnectionTimeout = null;
        }
        this.shouldReconnect = false;
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        console.log("WebSocket connection closed manually.");
    };


    // --- Notification Actions ---
    fetchNotifications = async () => {
        runInAction(() => {
            this.isFetchingNotifications = true;
        });
        try {
            const notifications = await this.rootStore.apiClient.getNotifications(true); // Pass true to prevent global loader
            runInAction(() => {
                this.notifications = notifications;
            });
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            runInAction(() => {
                this.isFetchingNotifications = false;
            });
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
