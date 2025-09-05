import { UIStore } from './UIStore';
import { AuthStore } from './AuthStore';
import { ProjectStore } from './ProjectStore';

export class RootStore {
    uiStore: UIStore;
    authStore: AuthStore;
    projectStore: ProjectStore;

    constructor() {
        this.uiStore = new UIStore(this);
        this.authStore = new AuthStore(this);
        this.projectStore = new ProjectStore(this);
    }
}