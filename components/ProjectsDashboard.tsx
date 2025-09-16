
import React from 'react';
import { observer } from 'mobx-react-lite';
// FIX: Removed Grid from imports as it is no longer used.
import { Box, Typography, Button, Container } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useStores } from '../stores/StoreProvider';
import ProjectCard from './ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';

const ProjectsDashboard: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();

    return (
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Projects
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={uiStore.openCreateProjectDialog}
                    color="secondary"
                >
                    New Project
                </Button>
            </Box>
            {projectStore.projects.length > 0 ? (
                // FIX: Replaced MUI Grid with Box and flexbox for layout. The Grid component's props (`item`, `xs`, etc.) were causing TypeScript errors, possibly due to a type definition issue in the project's environment. This alternative achieves the same responsive layout. The spacing is replicated using negative margins on the container and padding on the items.
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2 }}>
                    {projectStore.projects.map(project => (
                        <Box key={project.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.3333%' }, p: 2 }}>
                            <ProjectCard project={project} />
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h5" color="text.secondary">
                        No projects yet
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Create your first project to get started.
                    </Typography>
                </Box>
            )}
            <CreateProjectDialog />
        </Container>
    );
});

export default ProjectsDashboard;
