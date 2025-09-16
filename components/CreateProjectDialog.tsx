
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useStores } from '../stores/StoreProvider';

const CreateProjectDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const [name, setName] = useState('');

    const handleCreate = () => {
        if (name.trim()) {
            projectStore.addProject(name.trim());
            handleClose();
        }
    };

    const handleClose = () => {
        setName('');
        uiStore.closeCreateProjectDialog();
    };

    return (
        <Dialog open={uiStore.isCreateProjectDialogOpen} onClose={handleClose}>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Give your new project a name to get started. You can add languages and team members later.
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Project Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" disabled={!name.trim()}>Create</Button>
            </DialogActions>
        </Dialog>
    );
});

export default CreateProjectDialog;
