
import React, { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, InputAdornment, Link } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { useStores } from '../stores/StoreProvider';

const RegisterPage: React.FC = () => {
    const { uiStore, authStore } = useStores();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) {
            uiStore.showAlert('Please fill in all fields.', 'warning');
            return;
        }
        await authStore.register(name, email, password);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <TranslateIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                <Typography component="h1" variant="h5">
                    Create an Account
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label="Full Name"
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>,
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
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
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        Sign Up
                    </Button>
                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        Already have an account?{' '}
                        <Link href="#" onClick={() => uiStore.setView('login')}>
                            Log in
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegisterPage;