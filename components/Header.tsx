import React from 'react';
import { TranslateIcon, LogoutIcon, SunIcon, MoonIcon } from './icons';
import { User } from '../types';

interface HeaderProps {
    user: User | null;
    onLogout: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, onToggleTheme }) => {
    return (
        <header className="flex items-center justify-between p-4 bg-brand-primary text-white shadow-md z-10">
            <div className="flex items-center space-x-3">
                <TranslateIcon className="w-8 h-8"/>
                <h1 className="text-2xl font-bold tracking-wider">Localization Manager Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onToggleTheme}
                    className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-white transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
                {user && (
                     <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-white font-bold">
                                {user.avatarInitials}
                            </div>
                            <span className="font-semibold">{user.name}</span>
                        </div>
                        <button onClick={onLogout} className="flex items-center space-x-2 text-white hover:text-indigo-200 transition-colors">
                            <LogoutIcon className="w-6 h-6" />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;