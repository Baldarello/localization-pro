import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { useStores } from '../stores/StoreProvider';
import { Commit, Term } from '../types';

const calculateCommitChanges = (commit: Commit, parentCommit: Commit | null) => {
    const parentTerms = parentCommit?.terms || [];
    const currentTerms = commit.terms;

    const parentTermsMap = new Map<string, Term>(parentTerms.map(t => [t.id, t]));
    const currentTermsMap = new Map<string, Term>(currentTerms.map(t => [t.id, t]));

    let added = 0;
    let removed = 0;
    let modified = 0;

    const allTermIds = new Set([...parentTerms.map(t => t.id), ...currentTerms.map(t => t.id)]);

    for (const termId of allTermIds) {
        const parentTerm = parentTermsMap.get(termId);
        const currentTerm = currentTermsMap.get(termId);

        if (currentTerm && !parentTerm) {
            added++;
        } else if (!currentTerm && parentTerm) {
            removed++;
        } else if (currentTerm && parentTerm) {
            let hasChanged = false;
            if (currentTerm.text !== parentTerm.text) hasChanged = true;
            if ((currentTerm.context || '') !== (parentTerm.context || '')) hasChanged = true;
            
            if (!hasChanged) {
                const allLangCodes = new Set([...Object.keys(currentTerm.translations), ...Object.keys(parentTerm.translations)]);
                for (const langCode of allLangCodes) {
                    if ((currentTerm.translations[langCode] || '') !== (parentTerm.translations[langCode] || '')) {
                        hasChanged = true;
                        break;
                    }
                }
            }
            if (hasChanged) modified++;
        }
    }
    
    return { added, modified, removed };
};

const StatsView: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { currentBranch } = projectStore;

    const commitStats = useMemo(() => {
        if (!currentBranch || !currentBranch.commits || currentBranch.commits.length === 0) {
            return [];
        }

        const stats = [];
        // Commits are sorted newest to oldest. Iterate through them to compare with the parent (next in array).
        for (let i = 0; i < currentBranch.commits.length; i++) {
            const commit = currentBranch.commits[i];
            const parentCommit = currentBranch.commits[i + 1] || null; // The next commit is the parent
            const changes = calculateCommitChanges(commit, parentCommit);
            const totalChanges = changes.added + changes.modified + changes.removed;
            
            if (totalChanges > 0 || i === currentBranch.commits.length - 1) { // Always include initial commit
                 stats.push({
                    commit,
                    changes,
                    totalChanges,
                });
            }
        }
        return stats.reverse(); // Reverse to show oldest to newest
    }, [currentBranch]);
    
    const maxChanges = useMemo(() => {
        if (commitStats.length === 0) return 1;
        return Math.max(1, ...commitStats.map(s => s.totalChanges));
    }, [commitStats]);

    if (!currentBranch) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">No branch selected.</Typography>
            </Box>
        );
    }
    
    if (commitStats.length === 0) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">No commit history with term changes to display for this branch.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h5" gutterBottom>Commit Activity for "{currentBranch.name}"</Typography>
            <Paper variant="outlined" sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Changes per Commit</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '1px', width: '100%', height: '300px', borderBottom: 1, borderColor: 'divider', position: 'relative', pl: 5, pr: 2 }}>
                    
                    {/* Y-Axis labels */}
                    <Box sx={{ position: 'absolute', top: -8, left: 0, height: 'calc(100% + 8px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', width: 35 }}>
                        <Typography variant="caption" color="text.secondary">{maxChanges}</Typography>
                        <Typography variant="caption" color="text.secondary">0</Typography>
                    </Box>

                    {commitStats.map(({ commit, changes, totalChanges }) => {
                        const barHeight = (totalChanges / maxChanges) * 100;
                        const addedHeight = (changes.added / totalChanges) * 100 || 0;
                        const modifiedHeight = (changes.modified / totalChanges) * 100 || 0;
                        
                        const tooltipContent = (
                            <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{commit.message.split('\n')[0]}</Typography>
                                <Typography variant="caption" color="inherit">{new Date(commit.timestamp).toLocaleDateString()}</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#66bb6a' }} display="block">Added: {changes.added}</Typography>
                                    <Typography variant="caption" sx={{ color: '#ffa726' }} display="block">Modified: {changes.modified}</Typography>
                                    <Typography variant="caption" sx={{ color: '#ef5350' }} display="block">Removed: {changes.removed}</Typography>
                                </Box>
                            </>
                        );

                        return (
                            <Tooltip key={commit.id} title={tooltipContent} placement="top" arrow children={
                                <Box sx={{ flex: 1, height: `${barHeight}%`, minWidth: '10px', display: 'flex', flexDirection: 'column', bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
                                    <Box sx={{ height: `${addedHeight}%`, bgcolor: 'success.main', width: '100%' }} />
                                    <Box sx={{ height: `${modifiedHeight}%`, bgcolor: 'warning.main', width: '100%' }} />
                                    <Box sx={{ flexGrow: 1, bgcolor: 'error.main', width: '100%' }} />
                                </Box>
                            } />
                        );
                    })}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 5, pr: 2 }}>
                     <Typography variant="caption" color="text.secondary">{commitStats.length > 0 ? new Date(commitStats[0].commit.timestamp).toLocaleDateString() : ''}</Typography>
                     <Typography variant="caption" color="text.secondary">{commitStats.length > 1 ? new Date(commitStats[commitStats.length-1].commit.timestamp).toLocaleDateString() : ''}</Typography>
                </Box>
                 <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: 'success.main', borderRadius: '2px' }} />
                        <Typography variant="caption">Added</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: 'warning.main', borderRadius: '2px' }} />
                        <Typography variant="caption">Modified</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: 'error.main', borderRadius: '2px' }} />
                        <Typography variant="caption">Removed</Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
});

export default StatsView;