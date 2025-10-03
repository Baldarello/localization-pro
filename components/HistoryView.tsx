import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, List, ListItemText, Avatar, Divider, ListItemButton, ListItemAvatar } from '@mui/material';
import { useStores } from '../stores/StoreProvider';
import { User, Commit } from '../types';
import CommitDetailDialog from './CommitDetailDialog';

const HistoryView: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { currentBranch, allUsers, isCurrentBranchLocked } = projectStore;
    const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

    if (!currentBranch) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">Please select a project and branch first.</Typography>
            </Box>
        );
    }

    const getUser = (userId: string): User | undefined => {
        return allUsers.find(u => u.id === userId);
    };

    const handleOpenDialog = (commit: Commit) => {
        setSelectedCommit(commit);
    };

    const handleCloseDialog = () => {
        setSelectedCommit(null);
    };

    return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, flexShrink: 0 }}>
                <Typography variant="h5">Commit History for "{currentBranch.name}"</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {currentBranch.commits.length > 0 ? (
                    <List sx={{ bgcolor: 'background.paper', p: 0 }}>
                        {currentBranch.commits.map((commit, index) => {
                            const author = getUser(commit.authorId);
                            const commitDate = new Date(commit.timestamp);
                            const [summary] = commit.message.split('\n');

                            return (
                                <React.Fragment key={commit.id}>
                                    <ListItemButton onClick={() => handleOpenDialog(commit)} sx={{ p: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                {author?.avatarInitials || 'U'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                                                    {summary}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                        {author?.name || 'Unknown User'}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        committed on {commitDate.toLocaleDateString()} at {commitDate.toLocaleTimeString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                    {index < currentBranch.commits.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No commit history for this branch yet.</Typography>
                    </Box>
                )}
            </Box>
            
            {selectedCommit && (
                <CommitDetailDialog 
                    commit={selectedCommit}
                    parentCommit={currentBranch.commits[currentBranch.commits.findIndex(c => c.id === selectedCommit.id) + 1] || null}
                    isLatest={currentBranch.commits[0].id === selectedCommit.id}
                    isBranchLocked={isCurrentBranchLocked}
                    open={!!selectedCommit}
                    onClose={handleCloseDialog}
                />
            )}
        </Box>
    );
});

export default HistoryView;