import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, TextField, Select,
    MenuItem, List, ListItem, ListItemText, Divider, Chip, Tooltip, Alert, useMediaQuery, useTheme, FormControl, InputLabel, SelectChangeEvent, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useStores } from '../stores/StoreProvider';
import { ApiKey, ApiKeyPermissions } from '../types';

const getPermissionChipColor = (permission: ApiKeyPermissions) => {
    switch (permission) {
        case ApiKeyPermissions.Admin: return 'error';
        case ApiKeyPermissions.Edit: return 'warning';
        case ApiKeyPermissions.ReadOnly: return 'success';
        default: return 'default';
    }
};

const CreateKeyDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onCreate: (name: string, permissions: ApiKeyPermissions) => void;
}> = ({ open, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<ApiKeyPermissions>(ApiKeyPermissions.ReadOnly);

    const handleSubmit = () => {
        if (name.trim()) {
            onCreate(name.trim(), permissions);
            onClose();
            setName('');
            setPermissions(ApiKeyPermissions.ReadOnly);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Key Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., CI/CD Pipeline Key"
                    sx={{ mt: 1 }}
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Permissions</InputLabel>
                    <Select
                        value={permissions}
                        label="Permissions"
                        onChange={(e: SelectChangeEvent) => setPermissions(e.target.value as ApiKeyPermissions)}
                    >
                        <MenuItem value={ApiKeyPermissions.ReadOnly}>Read-Only</MenuItem>
                        <MenuItem value={ApiKeyPermissions.Edit}>Edit</MenuItem>
                        <MenuItem value={ApiKeyPermissions.Admin}>Admin</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={!name.trim()}>Create</Button>
            </DialogActions>
        </Dialog>
    );
};

const ShowKeyDialog: React.FC<{
    apiKey: ApiKey | null;
    onClose: () => void;
}> = ({ apiKey, onClose }) => {
    const [copied, setCopied] = useState(false);
    if (!apiKey || !apiKey.secret) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey.secret!);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={!!apiKey} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Please copy this secret key and store it in a safe place. You will not be able to see it again.
                </Alert>
                
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>How to Use This Key</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    <Typography component="code" sx={{ display: 'block', mb: 1 }}>
                        # Include these two headers in your API requests:
                    </Typography>
                    <Typography component="code" sx={{ display: 'block' }}>
                        X-Api-Key-Prefix: {apiKey.keyPrefix}
                    </Typography>
                    <Typography component="code" sx={{ display: 'block' }}>
                        Authorization: Bearer {apiKey.secret}
                    </Typography>
                </Paper>

                <Typography gutterBottom sx={{ mt: 3 }}><strong>Key Prefix:</strong> {apiKey.keyPrefix}</Typography>
                <Typography gutterBottom><strong>Secret:</strong></Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', position: 'relative' }}>
                    <Typography component="code" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {apiKey.secret}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                        <IconButton onClick={handleCopy} sx={{ position: 'absolute', top: 4, right: 4 }}>
                            {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Paper>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Done</Button>
            </DialogActions>
        </Dialog>
    );
};


const ApiKeysManagerDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { isApiKeysManagerOpen, closeApiKeysManager } = uiStore;
    const project = projectStore.selectedProject;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [isCreateOpen, setCreateOpen] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
    const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);
    
    const handleCreateKey = async (name: string, permissions: ApiKeyPermissions) => {
        const newKey = await projectStore.createApiKey(name, permissions);
        if (newKey) {
            setNewlyCreatedKey(newKey);
        }
    };

    const handleRevoke = async () => {
        if (keyToRevoke) {
            await projectStore.deleteApiKey(keyToRevoke.id);
            setKeyToRevoke(null);
        }
    };

    if (!project) return null;

    return (
        <>
            <Dialog open={isApiKeysManagerOpen} onClose={closeApiKeysManager} fullWidth maxWidth="md" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VpnKeyIcon />
                        <Typography variant="h6">API Keys for "{project.name}"</Typography>
                    </Box>
                    <IconButton onClick={closeApiKeysManager}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography>Manage keys for programmatic access to this project.</Typography>
                        <Button variant="contained" color="secondary" onClick={() => setCreateOpen(true)} startIcon={<AddIcon />}>
                            Create New Key
                        </Button>
                    </Box>
                    
                    {project.apiKeys && project.apiKeys.length > 0 ? (
                        <List>
                            {project.apiKeys.map(key => (
                                <React.Fragment key={key.id}>
                                    <ListItem
                                        secondaryAction={
                                            <Tooltip title="Revoke Key">
                                                <IconButton edge="end" onClick={() => setKeyToRevoke(key)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        }
                                    >
                                        <ListItemText
                                            primary={key.name}
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={key.permissions}
                                                        color={getPermissionChipColor(key.permissions)}
                                                        size="small"
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                    <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>{key.keyPrefix}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary">
                                                        Created: {new Date(key.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">No API keys have been created for this project yet.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeApiKeysManager}>Done</Button>
                </DialogActions>
            </Dialog>

            <CreateKeyDialog open={isCreateOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreateKey} />
            <ShowKeyDialog apiKey={newlyCreatedKey} onClose={() => setNewlyCreatedKey(null)} />
            
            <Dialog open={!!keyToRevoke} onClose={() => setKeyToRevoke(null)}>
                <DialogTitle>Confirm Revoke API Key</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">
                        Are you sure you want to revoke the key "<strong>{keyToRevoke?.name}</strong>"? This action cannot be undone, and any applications using this key will immediately lose access.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setKeyToRevoke(null)}>Cancel</Button>
                    <Button onClick={handleRevoke} color="error">Revoke Key</Button>
                </DialogActions>
            </Dialog>
        </>
    );
});

export default ApiKeysManagerDialog;