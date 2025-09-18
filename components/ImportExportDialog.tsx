import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/StoreProvider';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Box, Tabs, Tab,
    Select, MenuItem, Checkbox, FormControl, InputLabel, ListItemText, OutlinedInput, FormControlLabel, SelectChangeEvent, Alert, Chip, useMediaQuery, useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import UploadFileIcon from '@mui/icons-material/UploadFile';

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
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}


const ImportExportDialog: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { isImportExportDialogOpen, closeImportExportDialog } = uiStore;
    const project = projectStore.selectedProject;
    // FIX: Explicitly get theme with useTheme() to resolve TypeScript error with useMediaQuery.
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [tabIndex, setTabIndex] = useState(0);

    // Export state
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [exportLangs, setExportLangs] = useState<string[]>([]);
    
    // Import state
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLang, setImportLang] = useState('');
    const [createMissing, setCreateMissing] = useState(true);
    const [overwriteExisting, setOverwriteExisting] = useState(true);

    const handleClose = () => {
        setTabIndex(0);
        setExportFormat('json');
        setExportLangs([]);
        setImportFile(null);
        setImportLang('');
        setCreateMissing(true);
        setOverwriteExisting(true);
        closeImportExportDialog();
    };
    
    // FIX: Widened event type to handle both single (string) and multiple (string[]) select values.
    const handleExportLangsChange = (event: SelectChangeEvent<string[] | string>) => {
        const { target: { value } } = event;
        // The value from MUI can be a string for single select or an array for multi-select.
        const selectedValue = typeof value === 'string' ? value.split(',') : value;

        if (exportFormat === 'json') {
            // For JSON, only allow the last selected item
            setExportLangs(selectedValue.length > 0 ? [selectedValue[selectedValue.length - 1]] : []);
        } else {
            setExportLangs(selectedValue);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImportFile(event.target.files[0]);
        }
    };

    const isExportButtonDisabled = exportLangs.length === 0;

    const handleExport = () => {
        projectStore.exportTranslations(exportLangs, exportFormat);
    };

    const isImportButtonDisabled = !importFile || (importFile.name.endsWith('.json') && !importLang);

    const handleImport = async () => {
        if (importFile) {
            await projectStore.importTranslations(importFile, {
                createNew: createMissing,
                overwrite: overwriteExisting,
                langCode: importLang,
            });
            handleClose();
        }
    };

    const isJsonImport = useMemo(() => importFile?.name.endsWith('.json'), [importFile]);
    const isCsvImport = useMemo(() => importFile?.name.endsWith('.csv'), [importFile]);

    if (!project) return null;

    return (
        <Dialog open={isImportExportDialogOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImportExportIcon />
                    <Typography variant="h6">Import / Export Translations</Typography>
                </Box>
                <IconButton onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                 <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} variant="fullWidth">
                        <Tab label="Export" id="import-export-tab-0" aria-controls="import-export-tabpanel-0" />
                        <Tab label="Import" id="import-export-tab-1" aria-controls="import-export-tabpanel-1" />
                    </Tabs>
                </Box>
                <TabPanel value={tabIndex} index={0}>
                    <Typography variant="subtitle1" gutterBottom>Export translations from the latest commit.</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="format-select-label">Format</InputLabel>
                        <Select
                            labelId="format-select-label"
                            value={exportFormat}
                            label="Format"
                            onChange={(e) => {
                                setExportFormat(e.target.value as 'json' | 'csv');
                                // Reset language selection when format changes to avoid invalid states
                                setExportLangs([]);
                            }}
                        >
                            <MenuItem value="json">JSON (Single Language)</MenuItem>
                            <MenuItem value="csv">CSV (Multiple Languages)</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="languages-select-label">Languages</InputLabel>
                        <Select
                            labelId="languages-select-label"
                            multiple={exportFormat === 'csv'}
                            // FIX: The `value` prop must be a string for single select and an array for multiple select.
                            value={exportFormat === 'csv' ? exportLangs : (exportLangs[0] || '')}
                            onChange={handleExportLangsChange}
                            input={<OutlinedInput label="Languages" />}
                            // FIX: The `selected` value can be a string or an array depending on the `multiple` prop. Normalize to an array for consistent rendering.
                            renderValue={(selected) => {
                                const values = Array.isArray(selected) ? selected : (selected ? [selected] : []);
                                return (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {values.map((code) => {
                                        const langName = project.languages.find(l => l.code === code)?.name || code;
                                        return <Chip key={code} label={langName} />;
                                    })}
                                </Box>
                                );
                            }}
                        >
                            {project.languages.map((lang) => (
                                <MenuItem key={lang.code} value={lang.code}>
                                    <Checkbox checked={exportLangs.indexOf(lang.code) > -1 && exportFormat === 'csv'} />
                                    <ListItemText primary={lang.name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </TabPanel>
                 <TabPanel value={tabIndex} index={1}>
                    <Typography variant="subtitle1" gutterBottom>Import translations into the current working branch.</Typography>
                    <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={<UploadFileIcon />}
                        sx={{ mt: 2, mb: 2 }}
                    >
                        {importFile ? importFile.name : "Select File (.json or .csv)"}
                        <input type="file" hidden accept=".json,.csv" onChange={handleFileChange} />
                    </Button>

                    {isJsonImport && (
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel id="import-lang-label">Language of JSON file</InputLabel>
                            <Select
                                labelId="import-lang-label"
                                value={importLang}
                                label="Language of JSON file"
                                onChange={(e) => setImportLang(e.target.value)}
                            >
                                {project.languages.map(lang => (
                                    <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {isCsvImport && (
                        <Alert severity="info">Languages will be detected from the CSV header row.</Alert>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column' }}>
                        <FormControlLabel
                            control={<Checkbox checked={overwriteExisting} onChange={(e) => setOverwriteExisting(e.target.checked)} />}
                            label="Overwrite existing translations"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />}
                            label="Create new terms if they don't exist in the project"
                        />
                    </Box>
                 </TabPanel>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                {tabIndex === 0 && (
                    <Button variant="contained" onClick={handleExport} disabled={isExportButtonDisabled}>Export</Button>
                )}
                {tabIndex === 1 && (
                    <Button variant="contained" onClick={handleImport} disabled={isImportButtonDisabled}>Import</Button>
                )}
            </DialogActions>
        </Dialog>
    );
});

export default ImportExportDialog;