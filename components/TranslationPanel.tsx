import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/ProjectStore';
import { Box, Typography, TextField, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface TranslationPanelProps {
    projectStore: ProjectStore;
}

const TranslationPanel: React.FC<TranslationPanelProps> = observer(({ projectStore }) => {
    const {
        selectedTerm: term,
        selectedProject: project,
        currentUserRole,
        getAssignedLanguagesForCurrentUser,
        updateTranslation,
        updateTermText,
        generateTranslation,
        translatingState,
    } = projectStore;

    const [isEditingKey, setIsEditingKey] = useState(false);
    const [editedKeyText, setEditedKeyText] = useState('');

    useEffect(() => {
        if (term) {
            setEditedKeyText(term.text);
            setIsEditingKey(false);
        }
    }, [term]);

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
    const canEditKey = currentUserRole === 'admin' || currentUserRole === 'editor';

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

    return (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
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
                            <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold' }}>
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
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Translate this term for the selected languages.
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {project.languages.map(lang => {
                    const isDefault = lang.code === project.defaultLanguageCode;
                    const canEdit = userPermissions.includes(lang.code);
                    const isLoading = translatingState?.termId === term.id && translatingState?.langCode === lang.code;

                    return (
                        <Box key={lang.code}>
                            <Typography component="label" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', mb: 1 }}>
                                <Box component="span" className={`flag-icon flag-icon-${lang.code === 'en' ? 'gb' : lang.code}`} sx={{ mr: 1 }} />
                                {lang.name}
                                {isDefault && <StarIcon sx={{ ml: 1, color: 'warning.main', fontSize: 16 }} />}
                                {!canEdit && <LockIcon sx={{ ml: 1, color: 'text.disabled', fontSize: 16 }} />}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={term.translations[lang.code] || ''}
                                onChange={(e) => updateTranslation(lang.code, e.target.value)}
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
        </Box>
    );
});

export default TranslationPanel;