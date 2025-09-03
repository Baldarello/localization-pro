import React, { useState } from 'react';
import { AtSymbolIcon, LockClosedIcon, TranslateIcon, GoogleIcon } from './icons';

interface LoginPageProps {
    onLogin: (email: string, pass: string) => Promise<void>;
    onNavigateToRegister: () => void;
    onNavigateToForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToRegister, onNavigateToForgotPassword }) => {
    const [email, setEmail] = useState('alice@example.com');
    const [password, setPassword] = useState('password');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        try {
            await onLogin(email, password);
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleGoogleLogin = async () => {
        setError('');
        try {
            // In a real app, this would trigger the Google OAuth flow.
            // Here, we simulate a successful login with a predefined user.
            await onLogin('alice@example.com', 'password');
        } catch (err: any) {
             setError('Could not sign in with Google.');
        }
    }

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto bg-light-surface dark:bg-dark-surface p-8 border border-light-border dark:border-dark-border rounded-lg shadow-lg">
                <div className="flex items-center justify-center mb-6">
                    <TranslateIcon className="w-12 h-12 text-brand-primary" />
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary ml-3">Localization Pro</h1>
                </div>
                <h2 className="text-2xl font-semibold text-center text-light-text-secondary dark:text-dark-text-secondary mb-6">Welcome Back</h2>
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                        <div className="py-1">
                           <p className="text-sm text-blue-700 dark:text-blue-300">Use <b>alice@example.com</b> and password <b>password</b> to log in, or use Google Sign-In.</p>
                        </div>
                    </div>
                </div>
                {error && <p className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Email</label>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                               <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password-login" className="text-sm font-bold text-light-text-secondary dark:text-dark-text-secondary block">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </span>
                            <input
                                id="password-login"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 mt-1 text-light-text-primary dark:text-dark-text-primary bg-light-surface dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary placeholder:text-light-text-secondary/70 dark:placeholder:text-dark-text-secondary/70"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                         <div/>
                        <button type="button" onClick={onNavigateToForgotPassword} className="text-sm text-brand-primary hover:underline">
                            Forgot password?
                        </button>
                    </div>
                    <div>
                        <button type="submit" className="w-full py-3 px-4 text-white bg-brand-primary rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary font-semibold">
                            Log In
                        </button>
                    </div>
                </form>
                
                <div className="mt-6 flex items-center justify-center">
                    <div className="border-t border-light-border dark:border-dark-border flex-grow"></div>
                    <span className="px-4 text-sm text-light-text-secondary dark:text-dark-text-secondary bg-light-surface dark:bg-dark-surface">or continue with</span>
                    <div className="border-t border-light-border dark:border-dark-border flex-grow"></div>
                </div>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center py-2.5 px-4 border border-light-border dark:border-dark-border rounded-md shadow-sm bg-light-surface dark:bg-dark-surface text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                    >
                        <GoogleIcon className="w-5 h-5 mr-2" />
                        Sign in with Google
                    </button>
                </div>

                <p className="mt-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Don't have an account?{' '}
                    <button onClick={onNavigateToRegister} className="font-medium text-brand-primary hover:underline">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;