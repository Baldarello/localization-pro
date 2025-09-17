
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, IconButton, Tooltip, Button, LinearProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SaveIcon from '@mui/icons-material/Save';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';
import BranchSelector from './BranchSelector';
import LanguageSelector from './LanguageSelector';

const ProjectSidebar: React.FC = observer(() => {
    const { projectStore, uiStore } = useStores();
    const { selectedProject: project, currentUserRole, deselectProject, getProjectCompletion, uncommittedChangesCount } = projectStore;

    if (!project) return null;

    const completion = getProjectCompletion(project);
    const mainBranchLatestCommitTerms = project.branches.find(b => b.name === 'main')?.commits[0]?.terms || [];
    const canManageProject = currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor;

    return (
        <Box
            sx={{
                width: 280,
                flexShrink: 0,
                borderRight: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Tooltip title="Back to Projects">
                        <IconButton onClick={deselectProject} edge="start" sx={{ mr: 1 }}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                        {project.name}
                    </Typography>
                </Box>
                <BranchSelector />
            </Box>

            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Project Stats</Typography>
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2">{mainBranchLatestCommitTerms.length} terms in main</Typography>
                    <Typography variant="body2">{project.languages.length} languages</Typography>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress variant="determinate" value={completion} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{`${Math.round(completion)}%`}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {uncommittedChangesCount > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                     <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Branch Status</Typography>
                     <Typography variant="body2" color="text.secondary">
                        {uncommittedChangesCount} uncommitted change{uncommittedChangesCount > 1 ? 's' : ''}.
                     </Typography>
                     <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<SaveIcon />}
                        onClick={uiStore.openCommitDialog}
                    >
                        Commit Changes
                    </Button>
                </Box>
            )}

            {canManageProject && (
                 <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ImportExportIcon />}
                        onClick={uiStore.openImportExportDialog}
                    >
                        Import / Export Data
                    </Button>
                </Box>
            )}

            {currentUserRole === UserRole.Admin && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold', mb: 1 }}>Admin Controls</Typography>
                    <LanguageSelector />
                     <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AccountTreeIcon />}
                        onClick={() => uiStore.openBranchManager()}
                    >
                        Manage Branches
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<PeopleIcon />}
                        onClick={() => uiStore.openTeamManager()}
                    >
                        Manage Team
                    </Button>
                </Box>
            )}
        </Box>
    );
});

export default ProjectSidebar;