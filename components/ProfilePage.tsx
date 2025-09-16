import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Container, Paper, Box, Typography, TextField, Button, Avatar, Divider, Switch,
    FormControlLabel, InputAdornment, IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PaletteIcon from '@mui/icons-material/Palette';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useStores } from '../stores/StoreProvider';
import ThemeSelector from './ThemeSelector';

const ProfilePage: React.FC = observer(() => {
    const { authStore, uiStore } = useStores();
    const { currentUser, updateCurrentUserName, changePassword } = authStore;

    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [passwordData, setPasswordData] = useState({
        current: '',
        newPass: '',
        confirmPass: '',
    });

    useEffect(() => {
        setName(currentUser?.name || '');
    }, [currentUser]);

    if (!currentUser) {
        return null; // Should not happen if view is protected
    }

    const handleNameSave = async () => {
        if (name.trim() && name.trim() !== currentUser.name) {
            await updateCurrentUserName(name.trim());
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setName(currentUser.name);
        setIsEditingName(false);
    };

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPass !== passwordData.confirmPass) {
            uiStore.showAlert('New passwords do not match.', 'error');
            return;
        }
        if (passwordData.newPass.length < 6) {
             uiStore.showAlert('New password must be at least 6 characters long.', 'warning');
            return;
        }
        const success = await changePassword(passwordData.current, passwordData.newPass);
        if (success) {
            setPasswordData({ current: '', newPass: '', confirmPass: '' });
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                My Profile
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PersonIcon color="primary" sx={{ mr: 1.5 }} />
                    <Typography variant="h6">Personal Information</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <Avatar sx={{ width: 80, height: 80, fontSize: '2.5rem', bgcolor: 'primary.main' }}>
                        {currentUser.avatarInitials}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <TextField
                            label="Email Address"
                            value={currentUser.email}
                            fullWidth
                            disabled
                            variant="filled"
                        />
                    </Box>
                </Box>

                <TextField
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    disabled={!isEditingName}
                    variant="outlined"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                {isEditingName ? (
                                    <>
                                        <IconButton onClick={handleNameSave} edge="end" color="primary">
                                            <SaveIcon />
                                        </IconButton>
                                        <IconButton onClick={handleNameCancel} edge="end">
                                            <CloseIcon />
                                        </IconButton>
                                    </>
                                ) : (
                                    <IconButton onClick={() => setIsEditingName(true)} edge="end">
                                        <EditIcon />
                                    </IconButton>
                                )}
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LockIcon color="primary" sx={{ mr: 1.5 }} />
                    <Typography variant="h6">Security</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                     <TextField
                        label="Current Password"
                        name="current"
                        type="password"
                        value={passwordData.current}
                        onChange={handlePasswordInputChange}
                        fullWidth
                        required
                    />
                     <TextField
                        label="New Password"
                        name="newPass"
                        type="password"
                        value={passwordData.newPass}
                        onChange={handlePasswordInputChange}
                        fullWidth
                        required
                    />
                     <TextField
                        label="Confirm New Password"
                        name="confirmPass"
                        type="password"
                        value={passwordData.confirmPass}
                        onChange={handlePasswordInputChange}
                        fullWidth
                        required
                    />
                    <Button type="submit" variant="contained" sx={{ mt: 1, alignSelf: 'flex-start' }}>
                        Change Password
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PaletteIcon color="primary" sx={{ mr: 1.5 }} />
                    <Typography variant="h6">Appearance</Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography gutterBottom>Theme Color</Typography>
                        <ThemeSelector />
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={uiStore.theme === 'dark'}
                                onChange={uiStore.toggleTheme}
                                color="secondary"
                            />
                        }
                        label="Dark Mode"
                    />
                </Box>
            </Paper>

        </Container>
    );
});

export default ProfilePage;
