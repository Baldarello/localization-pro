import React from 'react';
import { observer } from 'mobx-react-lite';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProjectsDashboard from './components/ProjectsDashboard';
import ProjectDetailView from './components/ProjectDetailView';
import ProfilePage from './components/ProfilePage';
import { ThemeProvider, CssBaseline, Box, Alert, Snackbar } from '@mui/material';
import { createAppTheme } from './theme';
import { useStores } from './stores/StoreProvider';
import ApiSpecModal from './components/ApiSpecModal';
import CommitDialog from './components/CommitDialog';
import ImportExportDialog from './components/ImportExportDialog';

const App: React.FC = observer(() => {
    const { uiStore, authStore, projectStore } = useStores();
    const theme = createAppTheme(uiStore.theme, uiStore.themeName);

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

        if (uiStore.view === 'profile') {
            return (
                <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
                    <Header />
                    <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'background.default' }}>
                        <ProfilePage />
                    </Box>
                </Box>
            );
        }

        return (
            <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
                <Header />
                <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {projectStore.selectedProject ? (
                        <ProjectDetailView />
                    ) : (
                        <ProjectsDashboard />
                    )}
                </Box>
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
            <ApiSpecModal />
            <CommitDialog />
            <ImportExportDialog />
        </ThemeProvider>
    );
});

export default App;