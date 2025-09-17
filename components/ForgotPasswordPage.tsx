import React, { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, Link } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import EmailIcon from '@mui/icons-material/Email';
import { useStores } from '../stores/StoreProvider';

const ForgotPasswordPage: React.FC = () => {
    const { uiStore, authStore } = useStores();
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            uiStore.showAlert('Please enter your email address.', 'warning');
            return;
        }
        await authStore.forgotPassword(email);
        setEmail('');
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
                        Forgot Password?
                    </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                    No worries, we'll send you reset instructions.
                </Typography>
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
                            startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
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
};

export default ForgotPasswordPage;