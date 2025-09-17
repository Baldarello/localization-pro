import React, { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, Link, Divider, Alert } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { GoogleIcon } from './icons';
import { useStores } from '../stores/StoreProvider';
import { observer } from 'mobx-react-lite';

const LoginPage: React.FC = observer(() => {
    const { authStore, uiStore } = useStores();
    const [email, setEmail] = useState('alice@example.com');
    const [password, setPassword] = useState('password');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            uiStore.showAlert('Please enter both email and password.', 'warning');
            return;
        }
        await authStore.login(email, password);
    };

    const handleGoogleLogin = () => {
        authStore.loginWithGoogle();
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TranslateIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography component="h1" variant="h5">
                    Localization Pro
                </Typography>
                <Typography component="h2" variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    Welcome Back
                </Typography>
                
                <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
                    Use <b>alice@example.com</b> & <b>password</b> or Google Sign-In.
                </Alert>
                
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Link href="#" variant="body2" sx={{ display: 'block', textAlign: 'right', mt: 1 }} onClick={() => uiStore.setView('forgotPassword')}>
                        Forgot password?
                    </Link>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Log In
                    </Button>
                    {authStore.isGoogleAuthEnabled && (
                        <>
                            <Divider sx={{ my: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    OR
                                </Typography>
                            </Divider>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GoogleIcon />}
                                onClick={handleGoogleLogin}
                            >
                                Sign in with Google
                            </Button>
                        </>
                    )}
                    <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                        Don't have an account?{' '}
                        <Link href="#" onClick={() => uiStore.setView('register')}>
                            Sign up
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
});

export default LoginPage;