import React from 'react';
import { observer } from 'mobx-react-lite';
import { AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box, Tooltip, Menu, MenuItem } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CodeIcon from '@mui/icons-material/Code';
import { useStores } from '../stores/StoreProvider';

const Header: React.FC = observer(() => {
    const { authStore, uiStore, projectStore } = useStores();
    const { currentUser, logout } = authStore;

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        uiStore.setView('profile');
        handleClose();
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };

    const handleGoHome = () => {
        // Deselecting a project takes the user back to the dashboard
        if (projectStore.selectedProject) {
            projectStore.deselectProject();
        }
        uiStore.setView('app');
    };

    return (
        <AppBar position="static" elevation={1} color="primary">
            <Toolbar>
                <Button color="inherit" onClick={handleGoHome} sx={{ p: 1, textTransform: 'none', borderRadius: 2 }}>
                    <TranslateIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                        Localization Manager Pro
                    </Typography>
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="View API Spec">
                    <IconButton color="inherit" onClick={uiStore.openApiSpecModal} sx={{ mr: 1 }}>
                        <CodeIcon />
                    </IconButton>
                </Tooltip>

                {currentUser && (
                    <div>
                        <Tooltip title="Account settings">
                            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.875rem' }}>
                                    {currentUser.avatarInitials}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={open}
                            onClose={handleClose}
                            sx={{ mt: 1 }}
                        >
                            <MenuItem onClick={handleProfile}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </div>
                )}
            </Toolbar>
        </AppBar>
    );
});

export default Header;