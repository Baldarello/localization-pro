export interface Language {
    code: string;
    name: string;
}

export interface Term {
    id: string;
    text: string;
    translations: { [langCode: string]: string };
}

export interface Branch {
    id: string;
    name: string;
    terms: Term[];
}

export interface User {
    id:string;
    name: string;
    email: string;
    avatarInitials: string;
}

export type Role = 'translator' | 'editor' | 'admin';

export interface Project {
    id: string;
    name: string;
    defaultLanguageCode: string;
    languages: Language[];
    team: { [userId: string]: { role: Role; languages: string[] } }; // Maps user ID to role and assigned languages
    branches: Branch[];
    defaultBranchId: string;
}