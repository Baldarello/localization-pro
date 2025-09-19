import { UIStore } from './UIStore';
import { AuthStore } from './AuthStore';
import { ProjectStore } from './ProjectStore';
import ApiClient from '../ApiClient';

export class RootStore {
    uiStore: UIStore;
    authStore: AuthStore;
    projectStore: ProjectStore;
    apiClient = ApiClient;

    constructor() {
        this.uiStore = new UIStore(this);
        this.authStore = new AuthStore(this);
        this.projectStore = new ProjectStore(this);
        this.apiClient.setUiStore(this.uiStore);
    }
}