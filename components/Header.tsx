import React from 'react';
import { observer } from 'mobx-react-lite';
import { AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Badge, Divider, useMediaQuery, useTheme } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CodeIcon from '@mui/icons-material/Code';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SaveIcon from '@mui/icons-material/Save';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useStores } from '../stores/StoreProvider';
import BranchSelector from './BranchSelector';
import { UserRole, Notification } from '../types';
import LanguageSelector from './LanguageSelector';

const Header: React.FC = observer(() => {
    const { authStore, uiStore, projectStore } = useStores();
    const { currentUser, logout } = authStore;
    const { selectedProject, deselectProject, uncommittedChangesCount, currentUserRole, selectProject, switchBranch, selectTerm } = projectStore;
    const canManageProject = currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor;
    // FIX: Correctly use useMediaQuery by getting the theme from the useTheme() hook to avoid type errors.
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [adminMenuAnchorEl, setAdminMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const isAdminMenuOpen = Boolean(adminMenuAnchorEl);
    const isNotificationMenuOpen = Boolean(notificationMenuAnchorEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => setAnchorEl(null);

    const handleAdminMenuClick = (event: React.MouseEvent<HTMLElement>) => setAdminMenuAnchorEl(event.currentTarget);
    const handleAdminMenuClose = () => setAdminMenuAnchorEl(null);

    const handleNotificationMenuOpen = (anchor: HTMLElement | null) => {
        if (anchor) {
            setNotificationMenuAnchorEl(anchor);
            uiStore.fetchNotifications();
        }
    };
    const handleNotificationMenuClose = () => setNotificationMenuAnchorEl(null);

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
    
    const createMenuAction = (handler: () => void) => () => {
        handler();
        handleAdminMenuClose();
    };
    
    const handleManageTeam = createMenuAction(uiStore.openTeamManager);
    const handleManageBranches = createMenuAction(uiStore.openBranchManager);
    const handleImportExportClick = createMenuAction(uiStore.openImportExportDialog);
    const handleApiSpecClick = createMenuAction(uiStore.openApiSpecModal);
    const handleApiKeysClick = createMenuAction(uiStore.openApiKeysManager);

    const handleMobileNotificationsClick = () => {
        handleAdminMenuClose();
        handleNotificationMenuOpen(adminMenuAnchorEl);
    };


    const handleNotificationClick = async (notification: Notification) => {
        if (selectedProjectId !== notification.projectId) {
            selectProject(notification.projectId);
        }
        // Await branch switch to ensure project state is updated before selecting term
        await switchBranch(notification.branchName); 
        selectTerm(notification.termId);
        uiStore.markNotificationsAsRead([notification.id]);
        handleNotificationMenuClose();
    };

    const { selectedProjectId } = projectStore;

    return (
        <AppBar position="static" elevation={1} color="primary">
            <Toolbar>
                {selectedProject && uiStore.view !== 'profile' ? (
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
                            TnT
                        </Typography>
                    </Button>
                )}


                <Box sx={{ flexGrow: 1 }} />

                {selectedProject && uiStore.view !== 'profile' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {uncommittedChangesCount > 0 && (
                            <Button
                                color="secondary"
                                variant="contained"
                                size="small"
                                startIcon={isMobile ? null : <SaveIcon />}
                                onClick={uiStore.openCommitDialog}
                                sx={{ color: 'common.white', mr: 1, ...(isMobile && { minWidth: 'auto', px: 1 }) }}
                            >
                                {isMobile ? <SaveIcon /> : 'Commit'}
                                {isMobile ? 
                                    <Box component="span" sx={{ ml: 0.5 }}>({uncommittedChangesCount})</Box> :
                                    ` (${uncommittedChangesCount})`
                                }
                            </Button>
                        )}
                        {isMobile ? (
                            <>
                                <Tooltip title="More Actions">
                                    <IconButton color="inherit" onClick={handleAdminMenuClick}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    id="admin-controls-menu"
                                    anchorEl={adminMenuAnchorEl}
                                    open={isAdminMenuOpen}
                                    onClose={handleAdminMenuClose}
                                >
                                    <MenuItem onClick={handleApiSpecClick}>
                                        <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText>API Spec</ListItemText>
                                    </MenuItem>
                                    {currentUser && (
                                        <MenuItem onClick={handleMobileNotificationsClick}>
                                            <ListItemIcon>
                                                <Badge badgeContent={uiStore.unreadNotificationCount} color="error">
                                                    <NotificationsIcon fontSize="small" />
                                                </Badge>
                                            </ListItemIcon>
                                            <ListItemText>Notifications</ListItemText>
                                        </MenuItem>
                                    )}
                                    <Divider />
                                    {canManageProject && (
                                         <MenuItem onClick={handleImportExportClick}>
                                            <ListItemIcon><ImportExportIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText>Import / Export</ListItemText>
                                        </MenuItem>
                                    )}
                                    {currentUserRole === UserRole.Admin && (
                                        <Box>
                                            <Divider />
                                            <LanguageSelector asMenuItem onMenuAction={handleAdminMenuClose} />
                                            <MenuItem onClick={handleManageBranches}>
                                                <ListItemIcon><AccountTreeIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Manage Branches</ListItemText>
                                            </MenuItem>
                                             <MenuItem onClick={handleApiKeysClick}>
                                                <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>API Keys</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={handleManageTeam}>
                                                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Manage Team</ListItemText>
                                            </MenuItem>
                                        </Box>
                                    )}
                                </Menu>
                            </>
                        ) : (
                            <>
                                <Tooltip title="View API Spec">
                                    <IconButton color="inherit" onClick={uiStore.openApiSpecModal}>
                                        <CodeIcon />
                                    </IconButton>
                                </Tooltip>
                                {currentUser && (
                                    <Tooltip title="Notifications">
                                        <IconButton color="inherit" onClick={(e) => handleNotificationMenuOpen(e.currentTarget)}>
                                            <Badge badgeContent={uiStore.unreadNotificationCount} color="error">
                                                <NotificationsIcon />
                                            </Badge>
                                        </IconButton>
                                    </Tooltip>
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
                                            <IconButton color="inherit" onClick={handleAdminMenuClick}>
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
                                             <MenuItem onClick={handleApiKeysClick}>
                                                <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>API Keys</ListItemText>
                                            </MenuItem>
                                            <MenuItem onClick={handleManageTeam}>
                                                <ListItemIcon><PeopleIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText>Manage Team</ListItemText>
                                            </MenuItem>
                                        </Menu>
                                    </>
                                )}
                            </>
                        )}
                    </Box>
                )}
                 {/* The API spec and notification icons are now inside the isMobile ternary, so remove them from here */}
                {currentUser && (
                    <>
                         <Menu
                            anchorEl={notificationMenuAnchorEl}
                            open={isNotificationMenuOpen}
                            onClose={handleNotificationMenuClose}
                            PaperProps={{ style: { width: 380, maxHeight: 400 } }}
                            sx={{ mt: 1 }}
                        >
                            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">Notifications</Typography>
                                {uiStore.unreadNotificationCount > 0 && (
                                    <Button size="small" onClick={() => uiStore.markNotificationsAsRead(uiStore.notifications.map(n => n.id))}>Mark all as read</Button>
                                )}
                            </Box>
                            <Divider />
                            {uiStore.notifications.length === 0 ? (
                                <MenuItem disabled>
                                    <ListItemText primary="No new notifications" />
                                </MenuItem>
                            ) : (
                                uiStore.notifications.map(notification => (
                                    <MenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} selected={!notification.read}>
                                        <ListItemText 
                                            primary={`${notification.comment.author.name} mentioned you`}
                                            secondary={`On term: "${projectStore.projects.find(p => p.id === notification.projectId)?.branches.flatMap(b => b.workingTerms).find(t => t.id === notification.termId)?.text || 'a term'}"`}
                                            primaryTypographyProps={{ fontWeight: !notification.read ? 'bold' : 'normal' }}
                                        />
                                    </MenuItem>
                                ))
                            )}
                        </Menu>

                        <Tooltip title="Account settings">
                            <IconButton onClick={handleMenu} sx={{ p: 0, ml: 1.5 }}>
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
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
});

export default Header;