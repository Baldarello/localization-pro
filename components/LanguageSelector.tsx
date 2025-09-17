
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AVAILABLE_LANGUAGES, getFlagCode } from '../constants';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Checkbox, IconButton, Divider, Typography, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { useStores } from '../stores/StoreProvider';

const LanguageSelector: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { selectedProject, updateProjectLanguages, setDefaultLanguage } = projectStore;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    if (!selectedProject) return null;

    const { languages: projectLanguages, defaultLanguageCode } = selectedProject;

    const isSelected = (langCode: string) => projectLanguages.some(l => l.code === langCode);

    const handleToggleLanguage = (langCode: string) => {
        const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
        if (!lang) return;

        let newLanguages;
        if (isSelected(lang.code)) {
            // Prevent removing the very last language
            if (projectLanguages.length === 1) {
                return; 
            }
            newLanguages = projectLanguages.filter(l => l.code !== lang.code);
        } else {
            newLanguages = [...projectLanguages, lang];
        }
        updateProjectLanguages(newLanguages);
    };

    return (
        <div>
            <Button
                id="language-selector-button"
                aria-controls={open ? 'language-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                onClick={(event) => setAnchorEl(event.currentTarget)}
                startIcon={<LanguageIcon />}
                endIcon={<ExpandMoreIcon />}
                fullWidth
                sx={{ justifyContent: 'space-between' }}
            >
                Manage Languages
            </Button>
            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{ 'aria-labelledby': 'language-selector-button' }}
                PaperProps={{ style: { width: 320, maxHeight: 400 } }}
            >
                <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2">Project Languages</Typography>
                </Box>
                <Divider />
                {AVAILABLE_LANGUAGES.map(lang => (
                    <MenuItem key={lang.code} onClick={() => handleToggleLanguage(lang.code)} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ListItemIcon>
                                <Checkbox
                                    edge="start"
                                    checked={isSelected(lang.code)}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            </ListItemIcon>
                            <Box component="span" className={`flag-icon flag-icon-${getFlagCode(lang.code)}`} sx={{ mr: 1.5 }} />
                            <ListItemText primary={lang.name} />
                        </Box>
                        {isSelected(lang.code) && (
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setDefaultLanguage(lang.code); }}
                                color={lang.code === defaultLanguageCode ? 'warning' : 'default'}
                            >
                                {lang.code === defaultLanguageCode ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
});

export default LanguageSelector;