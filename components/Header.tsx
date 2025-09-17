import React from 'react';
import { observer } from 'mobx-react-lite';
import { AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CodeIcon from '@mui/icons-material/Code';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useStores } from '../stores/StoreProvider';
import BranchSelector from './BranchSelector';
import { UserRole } from '../types';
import LanguageSelector from './LanguageSelector';

const Header: React.FC = observer(() => {
    const { authStore, uiStore, projectStore } = useStores();
    const { currentUser, logout } = authStore;
    const { selectedProject, deselectProject, uncommittedChangesCount, currentUserRole } = projectStore;
    const canManageProject = currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor;

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [adminMenuAnchorEl, setAdminMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const isAdminMenuOpen = Boolean(adminMenuAnchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const handleAdminMenuClick = (event: React.MouseEvent<HTMLElement>) => setAdminMenuAnchorEl(event.currentTarget);
    const handleAdminMenuClose = () => setAdminMenuAnchorEl(null);

    const handleProfile = () => {
        uiStore.setView('profile');
        handleClose();
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };

    const handleGoHome = () => {
        if (projectStore.selectedProject) {
            projectStore.deselectProject();
        }
        uiStore.setView('app');
    };
    
    const handleManageTeam = () => {
        uiStore.openTeamManager();
        handleAdminMenuClose();
    };
    const handleManageBranches = () => {
        uiStore.openBranchManager();
        handleAdminMenuClose();
    };

    return (
        <AppBar position="static" elevation={1} color="primary">
            <Toolbar>
                {selectedProject ? (
                    <>
                        <Tooltip title="Back to Projects">
                            <IconButton color="inherit" onClick={deselectProject} edge="start" sx={{ mr: 1 }}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="h6" component="h1" noWrap sx={{ fontWeight: 'bold' }}>
                            {selectedProject.name}
                        </Typography>
                        <Box sx={{ ml: 2, borderLeft: 1, borderColor: 'rgba(255, 255, 255, 0.12)', pl: 2 }}>
                             <BranchSelector />
                        </Box>
                    </>
                ) : (
                    <Button color="inherit" onClick={handleGoHome} sx={{ p: 1, textTransform: 'none', borderRadius: 2 }}>
                        <TranslateIcon sx={{ mr: 2, fontSize: 32 }} />
                        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                            Localization Manager Pro
                        </Typography>
                    </Button>
                )}


                <Box sx={{ flexGrow: 1 }} />

                {selectedProject && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {uncommittedChangesCount > 0 && (
                            <Button
                                color="secondary"
                                variant="contained"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={uiStore.openCommitDialog}
                                sx={{ color: 'common.white', mr: 1 }}
                            >
                                Commit ({uncommittedChangesCount})
                            </Button>
                        )}
                         {canManageProject && (
                            <Tooltip title="Import / Export Data">
                                <IconButton color="inherit" onClick={uiStore.openImportExportDialog}>
                                    <ImportExportIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        {currentUserRole === UserRole.Admin && (
                            <>
                                <Tooltip title="Admin Controls">
                                    <IconButton
                                        color="inherit"
                                        onClick={handleAdminMenuClick}
                                        aria-controls={isAdminMenuOpen ? 'admin-controls-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={isAdminMenuOpen ? 'true' : undefined}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    id="admin-controls-menu"
                                    anchorEl={adminMenuAnchorEl}
                                    open={isAdminMenuOpen}
                                    onClose={handleAdminMenuClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    sx={{ mt: 1 }}
                                >
                                    <LanguageSelector asMenuItem onMenuAction={handleAdminMenuClose} />
                                    <MenuItem onClick={handleManageBranches}>
                                        <ListItemIcon><AccountTreeIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText>Manage Branches</ListItemText>
                                    </MenuItem>
                                    <MenuItem onClick={handleManageTeam}>
                                        <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText>Manage Team</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                )}

                <Tooltip title="View API Spec">
                    <IconButton color="inherit" onClick={uiStore.openApiSpecModal} sx={{ mr: 1, ml: 1 }}>
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