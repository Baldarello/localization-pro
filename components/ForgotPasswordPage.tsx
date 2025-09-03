import React, { useState } from 'react';
import { AtSymbolIcon, TranslateIcon } from './icons';

interface ForgotPasswordPageProps {
    onNavigateToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call an API.
        setMessage(`If an account with the email ${email} exists, a password reset link has been sent.`);
        setEmail('');
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto bg-light-surface dark:bg-dark-surface p-8 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                 <div className="flex items-center justify-center mb-6">
                    <TranslateIcon className="w-12 h-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary ml-3">Localization Pro</h1>
                </div>
                <h2 className="text-2xl font-semibold text-center text-light-text-secondary dark:text-dark-text-secondary mb-2">Forgot Password?</h2>
                <p className="text-center text-gray-500 mb-6">No worries, we'll send you reset instructions.</p>
                {message && <p className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md mb-4 text-center">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email-forgot" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Email</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><AtSymbolIcon className="h-5 w-5 text-gray-400" /></span>
                            <input
                                id="email-forgot"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="w-full py-3 px-4 text-white bg-brand-primary rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary font-semibold">
                            Reset Password
                        </button>
                    </div>
                </form>
                 <p className="mt-8 text-center text-sm text-gray-600">
                    <button onClick={onNavigateToLogin} className="font-medium text-brand-primary hover:underline">
                        &larr; Back to Log in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;