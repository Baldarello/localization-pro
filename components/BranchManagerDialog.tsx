



import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, TextField, Select,
    MenuItem, List, ListItem, ListItemText, Divider, Tabs, Tab, Chip, Tooltip, Alert, Grid, Paper, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DeleteIcon from '@mui/icons-material/Delete';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import AddIcon from '@mui/icons-material/Add';
import { useStores } from '../stores/StoreProvider';
import { Branch } from '../types';

/**
 * Creates a word-level diff between two strings using the Longest Common Subsequence algorithm.
 * @param {string} oldText The original text.
 * @param {string} newText The new text.
 * @returns {Array<{value: string, type: 'added' | 'removed' | 'common'}>} An array of diff parts.
 */
const createWordDiff = (oldText = '', newText = '') => {
    // Split by whitespace but keep the whitespace as part of the array for accurate reconstruction
    const oldWords = oldText.split(/(\s+)/).filter(Boolean);
    const newWords = newText.split(/(\s+)/).filter(Boolean);
    const n = oldWords.length;
    const m = newWords.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    // Build DP table to find the length of the longest common subsequence
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (oldWords[i - 1] === newWords[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack through the DP table to construct the diff
    const diff = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
            diff.unshift({ value: oldWords[i - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ value: newWords[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ value: oldWords[i - 1], type: 'removed' });
            i--;
        } else {
            break;
        }
    }
    return diff;
};


const BranchManagerDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { isBranchManagerOpen, closeBranchManager } = uiStore;
    const project = projectStore.selectedProject;
    // FIX: Use callback form of useMediaQuery to resolve issue with theme breakpoints.
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

    const [tabIndex, setTabIndex] = useState(0);
    const [newBranchName, setNewBranchName] = useState('');
    const [sourceBranch, setSourceBranch] = useState('main');

    // State for compare & merge tab
    const [baseBranch, setBaseBranch] = useState('main');
    const [compareBranch, setCompareBranch] = useState(project?.branches.find(b => b.name !== 'main')?.name || '');

    const handleCreateBranch = () => {
        if (!project || !newBranchName.trim()) return;
        projectStore.createBranch(newBranchName.trim(), sourceBranch);
        setNewBranchName('');
    };

    const handleMerge = () => {
        if (!project || !compareBranch) return;
        projectStore.mergeBranches(compareBranch, baseBranch);
    };

    const comparison = useMemo(() => {
        if (!project || !baseBranch || !compareBranch || baseBranch === compareBranch) return null;

        const base = project.branches.find(b => b.name === baseBranch);
        const compare = project.branches.find(b => b.name === compareBranch);
        if (!base || !compare || !base.commits || base.commits.length === 0 || !compare.commits || compare.commits.length === 0) return null;

        const baseTerms = new Map(base.commits[0].terms.map(t => [t.text, t]));
        const compareTerms = new Map(compare.commits[0].terms.map(t => [t.text, t]));

        const added: { termKey: string; translation: string; }[] = [];
        const modified: { termKey: string; changes: { langCode: string; langName: string; oldValue: string; newValue: string }[] }[] = [];
        const unchanged: string[] = [];

        for (const [key, compareTerm] of compareTerms.entries()) {
            if (!baseTerms.has(key)) {
                const defaultLangCode = project.defaultLanguageCode;
                const translation = compareTerm.translations[defaultLangCode] || '';
                added.push({ termKey: key, translation });
            } else {
                const baseTerm = baseTerms.get(key)!;
                const termChanges = [];

                project.languages.forEach(lang => {
                    const oldValue = baseTerm.translations[lang.code] || '';
                    const newValue = compareTerm.translations[lang.code] || '';
                    if (oldValue !== newValue) {
                        termChanges.push({
                            langCode: lang.code,
                            langName: lang.name,
                            oldValue,
                            newValue,
                        });
                    }
                });
    
                if (termChanges.length > 0) {
                    modified.push({ termKey: key, changes: termChanges });
                } else {
                    unchanged.push(key);
                }
            }
        }
        
        const removed: string[] = Array.from(baseTerms.keys()).filter(key => !compareTerms.has(key));

        return { added, modified, unchanged, removed };

    }, [project, baseBranch, compareBranch]);
    
    const allChanges = useMemo(() => {
        if (!comparison) return [];
        
        const added = comparison.added.map(item => ({ type: 'added' as const, ...item }));
        const removed = comparison.removed.map(termKey => ({ type: 'removed' as const, termKey }));
        const modified = comparison.modified.map(item => ({ type: 'modified' as const, ...item }));
        
        // Sort order: modified, then added, then removed
        return [...modified, ...added, ...removed];
    }, [comparison]);


    if (!project) return null;

    return (
        <Dialog open={isBranchManagerOpen} onClose={closeBranchManager} fullWidth maxWidth="md" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTreeIcon />
                    <Typography variant="h6">Manage Branches for "{project.name}"</Typography>
                </Box>
                <IconButton onClick={closeBranchManager}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)}>
                        <Tab label="Branches" />
                        <Tab label="Compare & Merge" />
                    </Tabs>
                </Box>
                {tabIndex === 0 && (
                    <Box>
                        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle1" gutterBottom>Create New Branch</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <TextField
                                    label="New branch name"
                                    variant="outlined"
                                    size="small"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    sx={{ flexGrow: 1, minWidth: '150px' }}
                                />
                                <Typography>from</Typography>
                                 <Select value={sourceBranch} onChange={(e) => setSourceBranch(e.target.value)} size="small">
                                    {project.branches.map(b => <MenuItem key={b.name} value={b.name}>{b.name}</MenuItem>)}
                                </Select>
                                <Button variant="contained" color="secondary" onClick={handleCreateBranch} startIcon={<AddIcon />} disabled={!newBranchName.trim()}>Create</Button>
                            </Box>
                        </Box>
                        <List>
                            {project.branches.map(branch => (
                                <ListItem key={branch.name} secondaryAction={
                                    branch.name !== 'main' && (
                                        <Tooltip title="Delete branch">
                                            <IconButton edge="end" aria-label="delete" onClick={() => projectStore.deleteBranch(branch.name)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {branch.name}
                                                {branch.name === 'main' && <Chip label="default" size="small" color="primary" variant="outlined" />}
                                                {branch.name === project.currentBranchName && <Chip label="current" size="small" color="secondary" />}
                                            </Box>
                                        }
                                        secondary={`${branch.commits?.[0]?.terms.length || 0} terms, ${branch.commits?.length || 0} commit(s)`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
                {tabIndex === 1 && (
                     <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                             <Select value={baseBranch} onChange={(e) => setBaseBranch(e.target.value)} size="small" sx={{minWidth: 150}}>
                                {project.branches.map(b => <MenuItem key={b.name} value={b.name}>{b.name}</MenuItem>)}
                            </Select>
                            <Typography> &larr; merge from </Typography>
                            <Select value={compareBranch} onChange={(e) => setCompareBranch(e.target.value)} size="small" sx={{minWidth: 150}} displayEmpty>
                                 <MenuItem value="" disabled><em>Select branch</em></MenuItem>
                                {project.branches.filter(b => b.name !== baseBranch).map(b => <MenuItem key={b.name} value={b.name}>{b.name}</MenuItem>)}
                            </Select>
                            <Button
                                variant="contained"
                                startIcon={<CallMergeIcon />}
                                onClick={handleMerge}
                                disabled={!comparison || (comparison.added.length === 0 && comparison.modified.length === 0)}
                            >
                                Merge
                            </Button>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {comparison ? (
                            <Box>
                                <Typography variant="h6" gutterBottom>Comparison Summary</Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    This will merge changes from the latest commit of <strong>{compareBranch}</strong> into the current working copy of <strong>{baseBranch}</strong>.
                                    You can then review and commit the merged changes.
                                </Alert>
                                
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
                                    <Chip label={`${comparison.modified.length} Modified`} color="warning" variant="outlined" />
                                    <Chip label={`${comparison.added.length} New`} color="success" variant="outlined" />
                                    <Chip label={`${comparison.removed.length} Removed (in ${compareBranch})`} color="error" variant="outlined" />
                                </Box>
                                
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                        p: 2,
                                        ...(allChanges.length === 0 && {
                                            height: 150,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }),
                                    }}
                                >
                                    {allChanges.length > 0 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {allChanges.map((item) => (
                                                <Box key={`${item.type}-${item.termKey}`}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: (item.type === 'modified' || item.type === 'added') ? 1.5 : 0 }}>
                                                        {item.type === 'added' && <Chip label="NEW" color="success" size="small" />}
                                                        {item.type === 'modified' && <Chip label="MODIFIED" color="warning" size="small" />}
                                                        {item.type === 'removed' && <Chip label="REMOVED" color="error" size="small" />}
                                                        <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{item.termKey}</Typography>
                                                    </Box>

                                                    {item.type === 'added' && (
                                                        <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: 2, borderColor: 'divider' }}>
                                                            <Box>
                                                                <Chip label={project.defaultLanguageCode.toUpperCase()} size="small" variant="outlined" />
                                                                <Box sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: 'rgba(46, 125, 50, 0.1)', borderRadius: 1 }}>
                                                                    <Typography component="span" sx={{ color: 'success.dark' }}>
                                                                        {item.translation}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    )}

                                                    {item.type === 'modified' && (
                                                        <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 2, borderLeft: 2, borderColor: 'divider' }}>
                                                            {item.changes.map(change => {
                                                                const diffParts = createWordDiff(change.oldValue, change.newValue);
                                                                return (
                                                                    <Box key={change.langCode}>
                                                                        <Chip label={change.langName} size="small" variant="outlined" />
                                                                        <Box sx={{ p: 1.5, mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: 'action.hover', borderRadius: 1 }}>
                                                                            {diffParts.map((part, index) => (
                                                                                <Box
                                                                                    component="span"
                                                                                    key={index}
                                                                                    sx={{
                                                                                        color: part.type === 'added' ? 'success.dark' : part.type === 'removed' ? 'error.dark' : 'text.primary',
                                                                                        textDecoration: part.type === 'removed' ? 'line-through' : 'none',
                                                                                        bgcolor: part.type === 'added' ? 'rgba(46, 125, 50, 0.1)' : part.type === 'removed' ? 'rgba(211, 47, 47, 0.1)' : 'transparent',
                                                                                    }}
                                                                                >
                                                                                    {part.value}
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography color="text.secondary">No differences found between these branches.</Typography>
                                    )}
                                </Paper>

                                <Typography sx={{ mt: 2 }} color="text.secondary">
                                    <strong>{comparison.unchanged.length}</strong> term(s) are unchanged.
                                </Typography>

                            </Box>
                        ) : (
                            <Typography color="text.secondary" sx={{pt: 2}}>Select two different branches to see a comparison.</Typography>
                        )}
                     </Box>
                )}

            </DialogContent>
            <DialogActions>
                <Button onClick={closeBranchManager}>Done</Button>
            </DialogActions>
        </Dialog>
    );
});

export default BranchManagerDialog;