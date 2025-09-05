
export interface Language {
    code: string;
    name: string;
}

export interface Term {
    id: string;
    text: string;
    translations: { [langCode: string]: string };
}

export interface User {
    id:string;
    name: string;
    email: string;
    avatarInitials: string;
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
    terms: Term[];
    team: { [userId: string]: { role: UserRole; languages: string[] } }; // Maps user ID to role and assigned languages
}
