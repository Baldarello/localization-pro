

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
        mentionNotifications: boolean;
    };
}

export enum UserRole {
    Translator = 'translator',
    Editor = 'editor',
    Admin = 'admin',
}

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

export enum ApiKeyPermissions {
    ReadOnly = 'readonly',
    Edit = 'edit',
    Admin = 'admin',
}

export interface ApiKey {
    id: string;
    name: string;
    permissions: ApiKeyPermissions;
    keyPrefix: string;
    createdAt: string; // ISO string
    lastUsedAt: string | null; // ISO string
    secret?: string; // Only present on creation
}

export interface Project {
    id: string;
    name: string;
    defaultLanguageCode: string;
    languages: Language[];
    branches: Branch[];
    currentBranchName: string;
    team: { [userId: string]: { role: UserRole; languages: string[] } }; // Maps user ID to role and assigned languages
    apiKeys?: ApiKey[];
}

export type UncommittedChange =
    | { type: 'added'; term: Term }
    | { type: 'removed'; originalTerm: Term }
    | { type: 'modified'; term: Term; originalTerm: Term };

export interface Comment {
    id: string;
    content: string;
    termId: string;
    branchName: string;
    createdAt: string; // ISO string
    author: Pick<User, 'id' | 'name' | 'avatarInitials'>;
    replies: Comment[];
    parentId: string | null;
}

export interface Notification {
    id: string;
    read: boolean;
    type: 'mention';
    createdAt: string; // ISO string
    comment: Comment;
    termId: string;
    projectId: string;
    branchName: string;
}