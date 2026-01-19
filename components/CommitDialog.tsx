import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Box,
    Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, Paper, useMediaQuery, Theme
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import { useStores } from '../stores/StoreProvider';
import { UncommittedChange } from '../types';

const CommitDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { currentBranch, uncommittedChanges, commitChanges, discardChange } = projectStore;
    const [message, setMessage] = useState('');
    // FIX: Pass a callback to useMediaQuery to safely access theme properties and avoid potential type errors.
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const handleCommit = async () => {
        if (message.trim()) {
            await commitChanges(message.trim());
            handleClose();
        }
    };

    const handleClose = () => {
        setMessage('');
        uiStore.closeCommitDialog();
    };

    const handleDiscardChange = (change: UncommittedChange) => {
        discardChange(change);
    };

    if (!currentBranch) return null;

    const renderChange = (change: UncommittedChange) => {
        let icon;
        let termText;
        let changeType;

        switch (change.type) {
            case 'added':
                icon = <AddCircleOutlineIcon color="success" />;
                termText = change.term.text;
                changeType = "Added";
                break;
            case 'removed':
                icon = <RemoveCircleOutlineIcon color="error" />;
                termText = change.originalTerm.text;
                changeType = "Removed";
                break;
            case 'modified':
                icon = <EditIcon color="warning" />;
                termText = change.term.text;
                changeType = "Modified";
                break;
        }

        return (
            <ListItem
                key={change.type === 'removed' ? change.originalTerm.id : change.term.id}
                secondaryAction={
                    <Tooltip title="Discard this change" children={
                        <IconButton edge="end" aria-label="discard" onClick={() => handleDiscardChange(change)}>
                            <UndoIcon />
                        </IconButton>
                    } />
                }
            >
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={termText} secondary={changeType} />
            </ListItem>
        );
    };

    return (
        <Dialog open={uiStore.isCommitDialogOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle>Commit Changes to "{currentBranch.name}"</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    You have <Typography component="span" sx={{ fontWeight: 'bold' }}>{uncommittedChanges.length}</Typography> uncommitted change(s).
                    Provide a summary of your changes to create a new commit in the branch history.
                </DialogContentText>

                {uncommittedChanges.length > 0 && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Changes:</Typography>
                        <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                            <List dense>
                                {uncommittedChanges.map(renderChange)}
                            </List>
                        </Paper>
                    </Box>
                )}
                
                <TextField
                    autoFocus
                    margin="dense"
                    id="message"
                    label="Commit message"
                    type="text"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., feat: Update welcome message for new users"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCommit} variant="contained" disabled={!message.trim() || uncommittedChanges.length === 0}>Commit</Button>
            </DialogActions>
        </Dialog>
    );
});

export default CommitDialog;