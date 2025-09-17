
export interface Language {
    code: string;
    name: string;
}

export interface Term {
    id: string;
    text: string;
    context?: string;
    translations: { [langCode: string]: string };
}

export interface Commit {
    id: string;
    message: string;
    authorId: string;
    timestamp: string; // ISO string
    terms: Term[];
}

export interface Branch {
    name: string;
    commits: Commit[];
    workingTerms: Term[];
}

export interface User {
    id:string;
    name: string;
    email: string;
    avatarInitials: string;
    settings?: {
        commitNotifications: boolean;
    };
}

export enum UserRole {
    Translator = 'translator',
    Editor = 'editor',
    Admin = 'admin',
}

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

export interface Project {
    id: string;
    name: string;
    defaultLanguageCode: string;
    languages: Language[];
    branches: Branch[];
    currentBranchName: string;
    team: { [userId: string]: { role: UserRole; languages: string[] } }; // Maps user ID to role and assigned languages
}

export type UncommittedChange =
    | { type: 'added'; term: Term }
    | { type: 'removed'; originalTerm: Term }
    | { type: 'modified'; term: Term; originalTerm: Term };
