import React, { useState, useEffect } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, Link } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import LockIcon from '@mui/icons-material/Lock';
import { useStores } from '../stores/StoreProvider';
import { observer } from 'mobx-react-lite';

const ResetPasswordPage: React.FC = observer(() => {
    const { uiStore, authStore } = useStores();
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            uiStore.showAlert('Password reset token not found. Please request a new one.', 'error');
            uiStore.setView('forgotPassword');
        }
    }, [uiStore]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) {
            uiStore.showAlert('Please fill in both password fields.', 'warning');
            return;
        }
        if (password !== confirmPassword) {
            uiStore.showAlert('Passwords do not match.', 'error');
            return;
        }
        if (token) {
            await authStore.resetPassword(token, password);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                    onClick={() => uiStore.setView('home')}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                >
                    <TranslateIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography component="h1" variant="h5">
                        Set New Password
                    </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                    Please enter your new password below.
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="New Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Reset Password
                    </Button>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        <Link href="#" onClick={() => uiStore.setView('login')}>
                            &larr; Back to Log in
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
});

export default ResetPasswordPage;