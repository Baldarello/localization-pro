import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, Tabs, Tab,
    Select, MenuItem, FormControl, InputLabel, Alert, LinearProgress, SelectChangeEvent, useMediaQuery, Theme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useStores } from '../stores/StoreProvider';
import { AVAILABLE_LANGUAGES, TONES } from '../constants';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-actions-tabpanel-${index}`}
      aria-labelledby={`ai-actions-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 200 }}>{children}</Box>}
    </div>
  );
}

const AiActionsDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { isAiActionsDialogOpen, closeAiActionsDialog, aiActionState } = uiStore;
    const project = projectStore.selectedProject;
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    const [tabIndex, setTabIndex] = useState(0);

    // State for each tab
    const [translateLang, setTranslateLang] = useState('');
    const [reviewLang, setReviewLang] = useState('');
    const [toneLang, setToneLang] = useState('');
    const [selectedTone, setSelectedTone] = useState(TONES[0]);

    const handleClose = () => {
        if (aiActionState.running) return;
        setTabIndex(0);
        setTranslateLang('');
        setReviewLang('');
        setToneLang('');
        setSelectedTone(TONES[0]);
        closeAiActionsDialog();
    };

    const availableForTranslation = useMemo(() => {
        if (!project) return [];
        const existingLangCodes = new Set(project.languages.map(l => l.code));
        return AVAILABLE_LANGUAGES.filter(l => !existingLangCodes.has(l.code));
    }, [project]);

    const availableForReviewAndTone = useMemo(() => {
        if (!project) return [];
        return project.languages.filter(l => l.code !== project.defaultLanguageCode);
    }, [project]);

    const handleTranslate = () => {
        if (translateLang) {
            projectStore.translateToNewLanguage(translateLang);
        }
    };

    const handleReview = () => {
        if (reviewLang) {
            projectStore.reviewLanguage(reviewLang);
        }
    };

    const handleChangeTone = () => {
        if (toneLang) {
            projectStore.changeLanguageTone(toneLang, selectedTone);
        }
    };

    return (
        <Dialog open={isAiActionsDialogOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon />
                    <Typography variant="h6">AI Actions for "{project?.name}"</Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={aiActionState.running}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {aiActionState.running ? (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
                        <Typography variant="h6">{aiActionState.message}</Typography>
                        <Box sx={{ width: '100%', maxWidth: 400 }}>
                            <LinearProgress variant="determinate" value={aiActionState.progress} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">{aiActionState.progress}% complete</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="fullWidth">
                                <Tab label="Translate New" />
                                <Tab label="Review Existing" />
                                <Tab label="Change Tone" />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabIndex} index={0}>
                            <Typography gutterBottom>Translate all terms from your default language ({project?.languages.find(l => l.code === project.defaultLanguageCode)?.name}) to a new language.</Typography>
                            <Alert severity="info" sx={{ my: 2 }}>This will add the new language to your project and create uncommitted changes for all new translations.</Alert>
                            <FormControl fullWidth margin="normal" disabled={availableForTranslation.length === 0}>
                                <InputLabel>New Language</InputLabel>
                                <Select value={translateLang} label="New Language" onChange={(e: SelectChangeEvent) => setTranslateLang(e.target.value)}>
                                    {availableForTranslation.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </TabPanel>

                        <TabPanel value={tabIndex} index={1}>
                             <Typography gutterBottom>Have the AI proofread and correct all existing translations for a specific language against your default language.</Typography>
                             <Alert severity="info" sx={{ my: 2 }}>This will create uncommitted changes for any translations that the AI improves.</Alert>
                             <FormControl fullWidth margin="normal" disabled={availableForReviewAndTone.length === 0}>
                                <InputLabel>Language to Review</InputLabel>
                                <Select value={reviewLang} label="Language to Review" onChange={(e: SelectChangeEvent) => setReviewLang(e.target.value)}>
                                    {availableForReviewAndTone.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </TabPanel>
                        
                        <TabPanel value={tabIndex} index={2}>
                            <Typography gutterBottom>Rewrite all translations for a selected language to match a specific tone, ensuring consistency.</Typography>
                            <Alert severity="info" sx={{ my: 2 }}>This is useful for adapting content for different audiences. It will create uncommitted changes.</Alert>
                             <FormControl fullWidth margin="normal" disabled={availableForReviewAndTone.length === 0}>
                                <InputLabel>Language to Change</InputLabel>
                                <Select value={toneLang} label="Language to Change" onChange={(e: SelectChangeEvent) => setToneLang(e.target.value)}>
                                     {availableForReviewAndTone.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth margin="normal" disabled={!toneLang}>
                                <InputLabel>New Tone</InputLabel>
                                <Select value={selectedTone} label="New Tone" onChange={(e: SelectChangeEvent) => setSelectedTone(e.target.value)}>
                                    {TONES.map(tone => <MenuItem key={tone} value={tone}>{tone}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </TabPanel>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={aiActionState.running}>Cancel</Button>
                {tabIndex === 0 && <Button variant="contained" onClick={handleTranslate} disabled={!translateLang || aiActionState.running}>Translate Project</Button>}
                {tabIndex === 1 && <Button variant="contained" onClick={handleReview} disabled={!reviewLang || aiActionState.running}>Review Translations</Button>}
                {tabIndex === 2 && <Button variant="contained" onClick={handleChangeTone} disabled={!toneLang || aiActionState.running}>Change Tone</Button>}
            </DialogActions>
        </Dialog>
    );
});

export default AiActionsDialog;