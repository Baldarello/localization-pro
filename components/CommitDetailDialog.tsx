import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box, Typography, Paper, Divider, Chip, List, ListItem, ListItemText, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, IconButton, TextField, Alert, useMediaQuery, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useStores } from '../stores/StoreProvider';
import { User, Term, Commit } from '../types';

/**
 * Creates a word-level diff between two strings.
 */
const createWordDiff = (oldText = '', newText = '') => {
    const oldWords = oldText.split(/(\s+)/).filter(Boolean);
    const newWords = newText.split(/(\s+)/).filter(Boolean);
    const n = oldWords.length;
    const m = newWords.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
            diff.unshift({ value: oldWords[i - 1], type: 'common' as const });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            // This word is in the new text but not the old one -> ADDED
            diff.unshift({ value: newWords[j - 1], type: 'added' as const });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            // This word was in the old text but not in the new one -> REMOVED
            diff.unshift({ value: oldWords[i - 1], type: 'removed' as const });
            i--;
        } else {
            break;
        }
    }
    return diff;
};


interface CommitDetailDialogProps {
    commit: Commit;
    parentCommit: Commit | null;
    isLatest: boolean;
    isBranchLocked: boolean;
    open: boolean;
    onClose: () => void;
}

const CommitDetailDialog: React.FC<CommitDetailDialogProps> = observer(({ commit, parentCommit, isLatest, isBranchLocked, open, onClose }) => {
    const { projectStore } = useStores();
    // FIX: Changed `project` to `selectedProject` and aliased it to `project` to correctly access the selected project from the store.
    const { selectedProject: project, allUsers, createBranchFromCommit, deleteLatestCommit } = projectStore;
    const [isRestoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newBranchName, setNewBranchName] = useState(`restore-${commit.id.slice(0, 7)}`);
    // FIX: Pass a callback to useMediaQuery to safely access theme properties and avoid potential type errors.
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

    const author = useMemo(() => allUsers.find(u => u.id === commit.authorId), [commit, allUsers]);
    const commitDate = useMemo(() => new Date(commit.timestamp), [commit]);

    const getLangName = (code: string) => {
        return project?.languages.find(l => l.code === code)?.name || code.toUpperCase();
    };

    const changes = useMemo(() => {
        const parentTerms = parentCommit?.terms || [];
        const currentTerms = commit.terms;

        const parentTermsMap = new Map<string, Term>(parentTerms.map(t => [t.id, t]));
        const currentTermsMap = new Map<string, Term>(currentTerms.map(t => [t.id, t]));

        const allTermIds = new Set([...parentTerms.map(t => t.id), ...currentTerms.map(t => t.id)]);
        
        const added: Term[] = [];
        const removed: Term[] = [];
        const modified: { term: Term; changes: { type: 'key' | 'context' | 'translation'; langCode?: string; oldValue: string; newValue: string; }[] }[] = [];

        for (const termId of allTermIds) {
            const parentTerm = parentTermsMap.get(termId);
            const currentTerm = currentTermsMap.get(termId);

            if (currentTerm && !parentTerm) {
                added.push(currentTerm);
            } else if (!currentTerm && parentTerm) {
                removed.push(parentTerm);
            } else if (currentTerm && parentTerm) {
                const termChanges: { type: 'key' | 'context' | 'translation'; langCode?: string; oldValue: string; newValue: string; }[] = [];
                
                if (currentTerm.text !== parentTerm.text) {
                    termChanges.push({ type: 'key', oldValue: parentTerm.text, newValue: currentTerm.text });
                }
                if ((currentTerm.context || '') !== (parentTerm.context || '')) {
                    termChanges.push({ type: 'context', oldValue: parentTerm.context || '', newValue: currentTerm.context || '' });
                }
                
                const allLangCodes = new Set([...Object.keys(currentTerm.translations), ...Object.keys(parentTerm.translations)]);
                for (const langCode of allLangCodes) {
                    const oldValue = parentTerm.translations[langCode] || '';
                    const newValue = currentTerm.translations[langCode] || '';
                    if (oldValue !== newValue) {
                        termChanges.push({ type: 'translation', langCode, oldValue, newValue });
                    }
                }

                if (termChanges.length > 0) {
                    modified.push({ term: currentTerm, changes: termChanges });
                }
            }
        }
        
        return { added, modified, removed };
    }, [commit, parentCommit]);

    const allChangesCount = changes.added.length + changes.modified.length + changes.removed.length;

    const handleRestore = async () => {
        if (newBranchName.trim()) {
            await createBranchFromCommit(commit.id, newBranchName.trim());
            setRestoreDialogOpen(false);
            onClose();
        }
    };

    const handleDelete = async () => {
        await deleteLatestCommit();
        setDeleteDialogOpen(false);
        onClose();
    };


    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper" fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Commit Details
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Paper sx={{ p: 2, mb: 2, borderLeft: 4, borderColor: 'primary.main' }} variant="outlined">
                        <Typography variant="h6">{(commit.message || '').split('\n')[0]}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>{author?.name || 'Unknown'}</strong> committed on {commitDate.toLocaleString()}
                        </Typography>
                    </Paper>

                    {allChangesCount === 0 ? (
                        <Typography color="text.secondary" sx={{ p: 2 }}>No changes to terms in this commit.</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                           {/* MODIFIED TERMS */}
                           {changes.modified.map(({ term, changes: termChanges }) => (
                                <Paper key={term.id} variant="outlined" sx={{ p: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><Chip label="MODIFIED" color="warning" size="small" /><Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{term.text}</Typography></Box>
                                    <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: 2, borderColor: 'divider' }}>
                                        {termChanges.map((change, index) => {
                                            const diffParts = createWordDiff(change.oldValue, change.newValue);
                                            let changeLabel = change.type === 'key' ? 'Term Key' : change.type === 'context' ? 'Context' : getLangName(change.langCode!);
                                            return (
                                                <Box key={index}>
                                                    <Chip label={changeLabel} size="small" variant="outlined" />
                                                    <Box sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: 'action.hover', borderRadius: 1 }}>
                                                        {diffParts.map((part, partIndex) => (
                                                            <Box component="span" key={partIndex} sx={{ color: part.type === 'added' ? 'success.dark' : part.type === 'removed' ? 'error.dark' : 'text.primary', textDecoration: part.type === 'removed' ? 'line-through' : 'none', bgcolor: part.type === 'added' ? 'rgba(46, 125, 50, 0.1)' : part.type === 'removed' ? 'rgba(211, 47, 47, 0.1)' : 'transparent' }}>{part.value}</Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Paper>
                            ))}
                            {/* NEW TERMS */}
                            {changes.added.length > 0 && <Box><Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>New Terms</Typography><List dense disablePadding component={Paper} variant="outlined">{changes.added.map((term, index) => (<React.Fragment key={term.id}><ListItem><Chip label="NEW" color="success" size="small" sx={{ mr: 1.5 }} /><ListItemText primaryTypographyProps={{ sx: { fontFamily: 'monospace' } }} primary={term.text} /></ListItem>{index < changes.added.length - 1 && <Divider component="li" />}</React.Fragment>))}</List></Box>}
                            {/* REMOVED TERMS */}
                            {changes.removed.length > 0 && <Box><Typography variant="subtitle2" sx={{ textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>Removed Terms</Typography><List dense disablePadding component={Paper} variant="outlined">{changes.removed.map((term, index) => (<React.Fragment key={term.id}><ListItem><Chip label="REMOVED" color="error" size="small" sx={{ mr: 1.5 }} /><ListItemText primaryTypographyProps={{ sx: { fontFamily: 'monospace', textDecoration: 'line-through' } }} primary={term.text} /></ListItem>{index < changes.removed.length - 1 && <Divider component="li" />}</React.Fragment>))}</List></Box>}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {isLatest ? (
                        <Tooltip title={isBranchLocked ? "Cannot delete commit on a protected branch" : ""}>
                            <span>
                                <Button color="error" startIcon={<DeleteForeverIcon />} onClick={() => setDeleteDialogOpen(true)} disabled={!parentCommit || isBranchLocked}>Delete Commit</Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <Button color="primary" startIcon={<RestoreIcon />} onClick={() => setRestoreDialogOpen(true)}>Restore from this commit</Button>
                    )}
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Restore Sub-Dialog */}
            <Dialog open={isRestoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} fullScreen={isMobile}>
                <DialogTitle>Create Branch from Commit</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Create a new branch based on the state of this commit. This is a safe way to restore old work without losing history.</Typography>
                    <TextField autoFocus margin="dense" label="New branch name" type="text" fullWidth variant="standard" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRestore} disabled={!newBranchName.trim()}>Create Branch</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Sub-Dialog */}
             <Dialog open={isDeleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobile}>
                <DialogTitle>Confirm Delete Commit</DialogTitle>
                <DialogContent>
                    <Alert severity="warning">Are you sure you want to delete this commit? This will revert all working changes to the previous state. This action cannot be undone.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Confirm Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    );
});

export default CommitDetailDialog;