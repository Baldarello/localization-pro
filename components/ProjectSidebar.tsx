import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/ProjectStore';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box, TextField, Button, Divider } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';

interface ProjectSidebarProps {
    projectStore: ProjectStore;
}

const drawerWidth = 280;

const ProjectSidebar: React.FC<ProjectSidebarProps> = observer(({ projectStore }) => {
    const { projects, selectedProjectId, selectProject, addProject } = projectStore;
    const [newProjectName, setNewProjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddProject = () => {
        if (newProjectName.trim()) {
            addProject(newProjectName.trim());
            setNewProjectName('');
            setIsAdding(false);
        }
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', position: 'relative' },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    Projects
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                {projects.map(project => (
                    <ListItemButton
                        key={project.id}
                        selected={selectedProjectId === project.id}
                        onClick={() => selectProject(project.id)}
                        sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            },
                        }}
                    >
                        <ListItemIcon>
                            <FolderIcon color={selectedProjectId === project.id ? 'primary' : 'inherit'} />
                        </ListItemIcon>
                        <ListItemText primary={project.name} />
                    </ListItemButton>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                {isAdding ? (
                    <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <TextField
                            label="New project name"
                            variant="outlined"
                            size="small"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddProject()}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleAddProject}
                                fullWidth
                                startIcon={<AddIcon />}
                            >
                                Add
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setIsAdding(false)}
                                fullWidth
                                startIcon={<CancelIcon />}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setIsAdding(true)}
                        fullWidth
                        startIcon={<AddIcon />}
                    >
                        New Project
                    </Button>
                )}
            </Box>
        </Drawer>
    );
});

export default ProjectSidebar;