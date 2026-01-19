import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Card, CardActionArea, CardContent, Typography, Box, LinearProgress, Avatar, AvatarGroup, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Project, User, UserRole } from '../types';
import { useStores } from '../stores/StoreProvider';

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = observer(({ project }) => {
    const { projectStore, authStore } = useStores();
    const completion = projectStore.getProjectCompletion(project);
    const mainBranchLatestCommitTerms = project.branches.find(b => b.name === 'main')?.commits[0]?.terms || [];

    const teamMemberIds = Object.keys(project.team);
    const teamMembers = teamMemberIds.map(id => projectStore.allUsers.find(u => u.id === id)).filter((u): u is User => !!u);
    const currentUser = authStore.currentUser;
    const isProjectAdmin = currentUser && project.team[currentUser.id]?.role === UserRole.Admin;

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        await projectStore.deleteProject(project.id);
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <Card sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                },
            }}>
                {isProjectAdmin && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                        <Tooltip title="Delete Project" children={
                            <IconButton 
                                size="small" 
                                onClick={handleDeleteClick}
                                sx={{ 
                                    bgcolor: 'background.paper',
                                    color: 'text.secondary',
                                    boxShadow: 1,
                                    '&:hover': { 
                                        bgcolor: 'background.paper', 
                                        color: 'error.main' 
                                    } 
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        } />
                    </Box>
                )}
                
                <CardActionArea onClick={() => projectStore.selectProject(project.id)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold', pr: 4 }}>
                            {project.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {mainBranchLatestCommitTerms.length} terms &bull; {project.languages.length} languages
                        </Typography>
                        
                        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress variant="determinate" value={completion} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="text.secondary">{`${Math.round(completion)}%`}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ flexGrow: 1 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                            <AvatarGroup max={4}
                                sx={{
                                    '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' },
                                }}
                            >
                                {teamMembers.map(member => (
                                    <Tooltip title={member.name} key={member.id} children={
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>{member.avatarInitials}</Avatar>
                                    } />
                                ))}
                            </AvatarGroup>
                        </Box>
                    </CardContent>
                </CardActionArea>
            </Card>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Project "{project.name}"?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this project? This action cannot be undone and will remove all terms, branches, translations, and commit history.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    );
});

export default ProjectCard;