
import React from 'react';
import { observer } from 'mobx-react-lite';
import ProjectSidebar from './components/ProjectSidebar';
import TermList from './components/TermList';
import TranslationPanel from './components/TranslationPanel';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import TeamManager from './components/TeamManager';
import { ThemeProvider, CssBaseline, Box, Typography, Button, Toolbar, Alert, Snackbar } from '@mui/material';
import { createAppTheme } from './theme';
import PeopleIcon from '@mui/icons-material/People';
import { useStores } from './stores/StoreProvider';
import { UserRole } from './types';

const App: React.FC = observer(() => {
    const { uiStore, authStore, projectStore } = useStores();
    const theme = createAppTheme(uiStore.theme);

    const handleCloseAlert = () => {
        uiStore.hideAlert();
    };

    const mainContent = () => {
        if (uiStore.view === 'login') {
            return <LoginPage />;
        }
        if (uiStore.view === 'register') {
            return <RegisterPage />;
        }
        if (uiStore.view === 'forgotPassword') {
            return <ForgotPasswordPage />;
        }

        return (
            <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
                <Header />
                <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                    <ProjectSidebar />
                    <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {projectStore.selectedProject ? (
                            <>
                                <Toolbar
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        backgroundColor: 'background.paper',
                                    }}
                                >
                                    <Typography variant="h5" component="h2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                                        {projectStore.selectedProject.name}
                                    </Typography>
                                    {projectStore.currentUserRole === UserRole.Admin && (
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PeopleIcon />}
                                                onClick={() => uiStore.openTeamManager()}
                                            >
                                                Manage Team
                                            </Button>
                                            <LanguageSelector />
                                        </Box>
                                    )}
                                </Toolbar>
                                <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                                    <TermList />
                                    <TranslationPanel />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <Typography variant="h4" color="text.secondary">
                                    No Project Selected
                                </Typography>
                                <Typography color="text.secondary" sx={{ mt: 1 }}>
                                    Please select a project from the sidebar or add a new one.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                {projectStore.selectedProject && projectStore.currentUserRole === UserRole.Admin && (
                    <TeamManager />
                )}
            </Box>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {mainContent()}
            <Snackbar
                open={uiStore.isAlertOpen}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity={uiStore.alertSeverity} variant="filled" sx={{ width: '100%' }}>
                    {uiStore.alertMessage}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
});

export default App;
