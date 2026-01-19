import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, TextField, FormControlLabel, Switch, List, ListItemButton, ListItemText, LinearProgress, Typography, IconButton, InputAdornment, useMediaQuery, Alert, Theme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';

const TermList: React.FC = observer(() => {
    const { projectStore, authStore } = useStores();
    const {
        selectedProject,
        selectedTermId,
        currentUserRole,
        currentBranchTerms,
        selectTerm,
        addTerm,
        deleteTerm,
        getAssignedLanguagesForCurrentUser,
        isCurrentBranchLocked,
    } = projectStore;

    const [newTerm, setNewTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false);
    // FIX: Pass a callback to useMediaQuery to safely access theme properties and avoid potential type errors.
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const handleAddTerm = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTerm.trim()) {
            addTerm(newTerm.trim());
            setNewTerm('');
        }
    };

    const getCompletionPercentage = (term: any) => {
        if (!selectedProject) return 0;
        const translatedCount = selectedProject.languages.filter(lang => term.translations[lang.code]?.trim()).length;
        return selectedProject.languages.length > 0 ? (translatedCount / selectedProject.languages.length) * 100 : 0;
    };

    const userAssignedLangs = getAssignedLanguagesForCurrentUser();
    const filteredTerms = currentBranchTerms.filter(term => {
        const lowerQuery = searchQuery.toLowerCase();
        
        // Search in Key OR in Translations
        const matchesKey = (term.text || '').toLowerCase().includes(lowerQuery);
        const matchesTranslations = Object.values(term.translations || {}).some(
            (t: any) => (t || '').toLowerCase().includes(lowerQuery)
        );

        if (!matchesKey && !matchesTranslations) return false;

        if (showUntranslatedOnly) {
            if (userAssignedLangs.length === 0 && currentUserRole === UserRole.Translator) return false;
            if (userAssignedLangs.length > 0) {
                return userAssignedLangs.some(langCode => !term.translations[langCode]?.trim());
            }
        }
        return true;
    }) || [];

    const canManageTerms = currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor;
    const isTermLimitReached = authStore.isUsageLimitsEnforced &&
    currentBranchTerms.length >= authStore.termLimit;

    if (!selectedProject) return null;

    return (
        <Box
            sx={{
                width: isMobile ? '100%' : 360,
                height: '100%',
                flexShrink: 0,
                borderRight: isMobile ? 'none' : 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControlLabel
                    control={
                        <Switch
                            checked={showUntranslatedOnly}
                            onChange={() => setShowUntranslatedOnly(!showUntranslatedOnly)}
                            color="secondary"
                        />
                    }
                    label="Show untranslated (for you)"
                    sx={{ mt: 1, width: '100%', justifyContent: 'flex-end', mr: 0 }}
                />
                {canManageTerms && (
                    <>
                        {isTermLimitReached && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                You have reached the {authStore.termLimit} term limit for this project.
                            </Alert>
                        )}
                        {isCurrentBranchLocked && (
                             <Alert severity="info" sx={{ mt: 1 }}>
                                This branch is protected. Only admins can add or remove terms.
                            </Alert>
                        )}
                        <Box component="form" onSubmit={handleAddTerm} sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <TextField
                                fullWidth
                                label="Add new term key"
                                variant="outlined"
                                size="small"
                                value={newTerm}
                                onChange={(e) => setNewTerm(e.target.value)}
                                disabled={isTermLimitReached || isCurrentBranchLocked}
                            />
                            <IconButton type="submit" color="primary" sx={{ flexShrink: 0 }} disabled={isTermLimitReached || isCurrentBranchLocked}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </>
                )}
            </Box>
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                {filteredTerms.map(term => {
                    const completion = getCompletionPercentage(term);
                    return (
                        <ListItemButton
                            key={term.id}
                            selected={selectedTermId === term.id}
                            onClick={() => selectTerm(term.id)}
                            sx={{
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                mb: 1,
                                borderRadius: 1,
                                '&.Mui-selected': {
                                    bgcolor: 'action.selected',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <ListItemText
                                    primary={term.text}
                                    primaryTypographyProps={{
                                        fontWeight: selectedTermId === term.id ? 'bold' : 'normal',
                                        color: selectedTermId === term.id ? 'primary.main' : 'text.primary',
                                        noWrap: true,
                                    }}
                                />
                                {canManageTerms && (
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); deleteTerm(term.id); }}
                                        disabled={isCurrentBranchLocked}
                                        sx={{
                                            visibility: isCurrentBranchLocked ? 'hidden' : 'hidden',
                                            '.MuiListItemButton-root:hover &': {
                                                visibility: isCurrentBranchLocked ? 'hidden' : 'visible',
                                            },
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                            <Box sx={{ width: '100%', mt: 1 }}>
                                <LinearProgress variant="determinate" value={completion} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {Math.round(completion)}% complete
                                </Typography>
                            </Box>
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );
});

export default TermList;