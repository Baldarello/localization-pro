
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Box, Typography } from '@mui/material';
import { useStores } from '../stores/StoreProvider';

const CommitDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { currentBranch, uncommittedChangesCount, commitChanges } = projectStore;
    const [message, setMessage] = useState('');

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

    if (!currentBranch) return null;

    return (
        <Dialog open={uiStore.isCommitDialogOpen} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Commit Changes to "{currentBranch.name}"</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    You have <Typography component="span" sx={{ fontWeight: 'bold' }}>{uncommittedChangesCount}</Typography> uncommitted change(s).
                    Provide a summary of your changes to create a new commit in the branch history.
                </DialogContentText>
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
                <Button onClick={handleCommit} variant="contained" disabled={!message.trim()}>Commit</Button>
            </DialogActions>
        </Dialog>
    );
});

export default CommitDialog;
