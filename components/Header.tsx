
import React from 'react';
import { observer } from 'mobx-react-lite';
import { AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useStores } from '../stores/StoreProvider';

const Header: React.FC = observer(() => {
    const { authStore, uiStore } = useStores();
    const { currentUser, logout } = authStore;
    const { theme, toggleTheme } = uiStore;

    return (
        <AppBar position="static" elevation={1} color="primary">
            <Toolbar>
                <TranslateIcon sx={{ mr: 2, fontSize: 32 }} />
                <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    Localization Manager Pro
                </Typography>

                <IconButton sx={{ mr: 2 }} onClick={toggleTheme} color="inherit" aria-label="Toggle theme">
                    {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>

                {currentUser && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                            {currentUser.avatarInitials}
                        </Avatar>
                        <Typography variant="subtitle1">{currentUser.name}</Typography>
                        <Button
                            color="inherit"
                            variant="outlined"
                            startIcon={<LogoutIcon />}
                            onClick={logout}
                            sx={{
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                '&:hover': {
                                    borderColor: 'white',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
});

export default Header;
