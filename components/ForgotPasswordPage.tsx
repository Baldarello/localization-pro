import React, { useState } from 'react';
import { UIStore } from '../stores/UIStore';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, Link } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import EmailIcon from '@mui/icons-material/Email';

interface ForgotPasswordPageProps {
    uiStore: UIStore;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ uiStore }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would call an API.
        uiStore.showAlert(`If an account with email ${email} exists, a reset link has been sent.`, 'success');
        setEmail('');
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TranslateIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography component="h1" variant="h5">
                    Forgot Password?
                </Typography>
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