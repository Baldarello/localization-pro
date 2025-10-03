

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
// FIX: Import `Divider` from `@mui/material` to resolve the "Cannot find name 'Divider'" error.
import { Box, Typography, TextField, IconButton, InputAdornment, CircularProgress, Button, useMediaQuery, Divider, Alert } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';
import { getFlagCode } from '../constants';
import CommentSection from './CommentSection';

const TranslationPanel: React.FC = observer(() => {
    const { projectStore } = useStores();
    const {
        selectedTerm: term,
        selectedProject: project,
        currentUserRole,
        getAssignedLanguagesForCurrentUser,
        updateTranslation,
        updateTermText,
        updateTermContext,
        generateTranslation,
        translatingState,
        deselectTerm,
        isCurrentBranchLocked,
    } = projectStore;

    // Local state for all editable fields
    const [editedKeyText, setEditedKeyText] = useState('');
    const [editedContext, setEditedContext] = useState('');
    const [localTranslations, setLocalTranslations] = useState<{ [key: string]: string }>({});

    // FIX: Pass a callback to useMediaQuery to safely access theme properties and avoid potential type errors.
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

    useEffect(() => {
        if (term) {
            // When term changes, reset all local editing states to match the store
            setEditedKeyText(term.text);
            setEditedContext(term.context || '');
            setLocalTranslations(term.translations || {});
            projectStore.fetchComments(project!.id, term.id);
        }
    }, [term, project, projectStore]);

    if (!term || !project) {
        return (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary">
                        Select a Term
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Choose a term from the list to start translating.
                    </Typography>
                </Box>
            </Box>
        );
    }

    const userPermissions = getAssignedLanguagesForCurrentUser();
    const canEditKey = (currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor) && !isCurrentBranchLocked;
    const languagesToDisplay = (currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor)
        ? project.languages
        : project.languages.filter(lang => userPermissions.includes(lang.code));

    // onBlur handler for Term Key
    const handleKeyBlur = () => {
        const trimmedText = editedKeyText.trim();
        if (trimmedText && trimmedText !== term.text) {
            updateTermText(term.id, trimmedText);
        } else {
            // If invalid or unchanged, revert to the store's value to prevent saving empty keys
            setEditedKeyText(term.text);
        }
    };
    
    // onBlur handler for Context
    const handleContextBlur = () => {
        // Only update if the content has actually changed
        if (editedContext.trim() !== (term.context || '')) {
            updateTermContext(term.id, editedContext.trim());
        }
    };

    // onChange handler for local translation state
    const handleTranslationChange = (langCode: string, value: string) => {
        setLocalTranslations(prev => ({ ...prev, [langCode]: value }));
    };

    // onBlur handler for Translations
    const handleTranslationBlur = (langCode: string) => {
        const localValue = localTranslations[langCode] || '';
        const originalValue = term.translations[langCode] || '';
        if (localValue !== originalValue) {
            updateTranslation(project.id, term.id, langCode, localValue);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 3 }, height: '100%' }}>
             {isMobile && (
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={deselectTerm}
                    sx={{ mb: 2 }}
                >
                    Back to Terms
                </Button>
            )}
             {isCurrentBranchLocked && (
                <Alert severity="info" icon={<LockIcon fontSize="inherit" />} sx={{ mb: 2 }}>
                    This branch is protected. Only admins can make changes.
                </Alert>
            )}
            <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    value={editedKeyText}
                    onChange={(e) => setEditedKeyText(e.target.value)}
                    onBlur={handleKeyBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                    variant="standard"
                    disabled={!canEditKey}
                    sx={{
                        '.MuiInput-input': {
                            fontSize: '1.75rem',
                            fontWeight: 'bold',
                            wordBreak: 'break-word',
                        },
                        // Show dotted underline to indicate editability, or none if disabled
                        '.MuiInput-root:before': {
                            borderBottomStyle: canEditKey ? 'dotted' : 'none',
                        },
                    }}
                />
            </Box>

             <Box sx={{ mb: 3, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" component="h4" sx={{ mb: 1.5 }}>Context</Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editedContext}
                    onChange={(e) => setEditedContext(e.target.value)}
                    onBlur={handleContextBlur}
                    placeholder="Provide context for translators (e.g., where this key is used, character limits)."
                    disabled={!canEditKey}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {languagesToDisplay.map(lang => {
                    const isDefault = lang.code === project.defaultLanguageCode;
                    const canEdit = userPermissions.includes(lang.code) && !isCurrentBranchLocked;
                    const isLoading = translatingState?.termId === term.id && translatingState?.langCode === lang.code;

                    return (
                        <Box key={lang.code}>
                            <Typography component="label" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1 }}>
                                <Box component="span" className={`flag-icon flag-icon-${getFlagCode(lang.code)}`} sx={{ mr: 1 }} />
                                {lang.name}
                                {isDefault && <StarIcon sx={{ ml: 1, color: 'warning.main', fontSize: 16 }} />}
                                {(!canEdit || isCurrentBranchLocked) && <LockIcon sx={{ ml: 1, color: 'text.disabled', fontSize: 16 }} />}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={localTranslations[lang.code] || ''}
                                onChange={(e) => handleTranslationChange(lang.code, e.target.value)}
                                onBlur={() => handleTranslationBlur(lang.code)}
                                placeholder={`Translation in ${lang.name}...`}
                                disabled={!canEdit}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {!isDefault && canEdit && (
                                                <IconButton
                                                    onClick={() => generateTranslation(term.id, lang.code)}
                                                    disabled={isLoading}
                                                    title={`Auto-translate to ${lang.name}`}
                                                >
                                                    {isLoading ? <CircularProgress size={24} /> : <AutoFixHighIcon />}
                                                </IconButton>
                                            )}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>

            <Divider sx={{ my: 4 }} />

            <CommentSection />
        </Box>
    );
});

export default TranslationPanel;