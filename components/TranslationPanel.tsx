

import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, TextField, IconButton, InputAdornment, CircularProgress, Button, Paper, Divider, useMediaQuery, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
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
    } = projectStore;

    const [isEditingKey, setIsEditingKey] = useState(false);
    const [editedKeyText, setEditedKeyText] = useState('');
    const [isEditingContext, setIsEditingContext] = useState(false);
    const [editedContext, setEditedContext] = useState('');
    // FIX: Correctly use useMediaQuery by getting the theme from the useTheme() hook to avoid type errors.
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (term) {
            setEditedKeyText(term.text);
            setIsEditingKey(false);
            setEditedContext(term.context || '');
            setIsEditingContext(false);
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
    const canEditKey = currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor;
    const languagesToDisplay = (currentUserRole === UserRole.Admin || currentUserRole === UserRole.Editor)
        ? project.languages
        : project.languages.filter(lang => userPermissions.includes(lang.code));

    const handleKeySave = () => {
        if (editedKeyText.trim() && editedKeyText !== term.text) {
            updateTermText(term.id, editedKeyText.trim());
        }
        setIsEditingKey(false);
    };
    
    const handleKeyCancel = () => {
        setEditedKeyText(term.text);
        setIsEditingKey(false);
    };

    const handleContextSave = () => {
        if (editedContext.trim() !== (term.context || '')) {
            updateTermContext(term.id, editedContext.trim());
        }
        setIsEditingContext(false);
    };

    const handleContextCancel = () => {
        setEditedContext(term.context || '');
        setIsEditingContext(false);
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
            <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '48px' }}>
                    {isEditingKey && canEditKey ? (
                        <>
                            <TextField
                                value={editedKeyText}
                                onChange={(e) => setEditedKeyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleKeySave(); if (e.key === 'Escape') handleKeyCancel(); }}
                                variant="standard"
                                autoFocus
                                sx={{
                                    '.MuiInput-input': {
                                        fontSize: '1.75rem',
                                        fontWeight: 'bold',
                                    }
                                }}
                            />
                            <IconButton onClick={handleKeySave} color="primary"><DoneIcon /></IconButton>
                            <IconButton onClick={handleKeyCancel}><CloseIcon /></IconButton>
                        </>
                    ) : (
                        <>
                            <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                                {term.text}
                            </Typography>
                            {canEditKey && (
                                <IconButton onClick={() => setIsEditingKey(true)} size="small">
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            )}
                        </>
                    )}
                </Box>
            </Box>

             <Box sx={{ mb: 3, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="h6" component="h4">Context</Typography>
                    {canEditKey && !isEditingContext && (
                        <Button onClick={() => setIsEditingContext(true)} startIcon={<EditIcon />} size="small">
                            Edit
                        </Button>
                    )}
                </Box>
                {isEditingContext ? (
                    <>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={editedContext}
                            onChange={(e) => setEditedContext(e.target.value)}
                            placeholder="Provide context for translators (e.g., where this key is used, character limits)."
                            autoFocus
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                            <Button onClick={handleContextCancel}>Cancel</Button>
                            <Button onClick={handleContextSave} variant="contained">Save</Button>
                        </Box>
                    </>
                ) : (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            bgcolor: 'action.hover',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: term.context ? 'text.primary' : 'text.secondary',
                            fontStyle: term.context ? 'normal' : 'italic',
                            minHeight: '60px'
                        }}
                    >
                        {term.context || 'No context provided. Click "Edit" to add one.'}
                    </Paper>
                )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {languagesToDisplay.map(lang => {
                    const isDefault = lang.code === project.defaultLanguageCode;
                    const canEdit = userPermissions.includes(lang.code);
                    const isLoading = translatingState?.termId === term.id && translatingState?.langCode === lang.code;

                    return (
                        <Box key={lang.code}>
                            <Typography component="label" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1 }}>
                                <Box component="span" className={`flag-icon flag-icon-${getFlagCode(lang.code)}`} sx={{ mr: 1 }} />
                                {lang.name}
                                {isDefault && <StarIcon sx={{ ml: 1, color: 'warning.main', fontSize: 16 }} />}
                                {!canEdit && <LockIcon sx={{ ml: 1, color: 'text.disabled', fontSize: 16 }} />}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={term.translations[lang.code] || ''}
                                // The store's updateTranslation method is now branch-aware, so no change needed here.
                                onChange={(e) => updateTranslation(project.id, term.id, lang.code, e.target.value)}
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