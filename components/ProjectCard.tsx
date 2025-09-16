
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Card, CardActionArea, CardContent, Typography, Box, LinearProgress, Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { Project, User } from '../types';
import { useStores } from '../stores/StoreProvider';

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = observer(({ project }) => {
    const { projectStore } = useStores();
    const completion = projectStore.getProjectCompletion(project);
    const mainBranchLatestCommitTerms = project.branches.find(b => b.name === 'main')?.commits[0]?.terms || [];

    const teamMemberIds = Object.keys(project.team);
    const teamMembers = teamMemberIds.map(id => projectStore.allUsers.find(u => u.id === id)).filter((u): u is User => !!u);

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column',
            transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
            },
        }}>
            <CardActionArea onClick={() => projectStore.selectProject(project.id)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                                <Tooltip title={member.name} key={member.id}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>{member.avatarInitials}</Avatar>
                                </Tooltip>
                            ))}
                        </AvatarGroup>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
});

export default ProjectCard;
