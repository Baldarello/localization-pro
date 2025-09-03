import React, { useState } from 'react';
import { UserIcon, AtSymbolIcon, LockClosedIcon, TranslateIcon } from './icons';

interface RegisterPageProps {
    onNavigateToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!name || !email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        // In a real app, this would call an API.
        // Here, we'll just simulate success.
        setMessage('Registration successful! Please log in.');
        setTimeout(() => {
           onNavigateToLogin();
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto bg-light-surface dark:bg-dark-surface p-8 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                <div className="flex items-center justify-center mb-6">
                    <TranslateIcon className="w-12 h-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary ml-3">Localization Pro</h1>
                </div>
                <h2 className="text-2xl font-semibold text-center text-light-text-secondary dark:text-dark-text-secondary mb-6">Create an Account</h2>
                {error && <p className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 text-center">{error}</p>}
                {message && <p className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md mb-4 text-center">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Full Name</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="h-5 w-5 text-gray-400" /></span>
                            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70" placeholder="John Doe" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email-register" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Email</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><AtSymbolIcon className="h-5 w-5 text-gray-400" /></span>
                            <input id="email-register" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70" placeholder="you@example.com" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="password-register" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Password</label>
                         <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockClosedIcon className="h-5 w-5 text-gray-400" /></span>
                            <input id="password-register" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70" placeholder="••••••••" required />
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="w-full py-3 px-4 text-white bg-brand-primary rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary font-semibold">
                            Sign Up
                        </button>
                    </div>
                </form>
                <p className="mt-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Already have an account?{' '}
                    <button onClick={onNavigateToLogin} className="font-medium text-brand-primary hover:underline">
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;