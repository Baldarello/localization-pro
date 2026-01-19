import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, Paper, CircularProgress, Alert, Chip, SelectChangeEvent, IconButton, Tooltip, ListItemText, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useStores } from '../stores/StoreProvider';
import { ApiKeyPermissions } from '../types';

const API_BASE_URL = 'https://localizationpro-api.tnl.one/api/v1';

const getPermissionChipColor = (permission: ApiKeyPermissions) => {
    switch (permission) {
        case ApiKeyPermissions.Admin: return 'error';
        case ApiKeyPermissions.Edit: return 'warning';
        case ApiKeyPermissions.ReadOnly: return 'success';
        default: return 'default';
    }
};

const ResponseBlock: React.FC<{ title: string, content: string, language?: string }> = ({ title, content, language = 'json' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>{title}</Typography>
            <Paper variant="outlined" sx={{ position: 'relative' }}>
                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} children={
                    <IconButton onClick={handleCopy} sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}>
                        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                } />
                <Box
                    component="pre"
                    sx={{
                        m: 0, p: 2, bgcolor: 'action.hover', whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8rem',
                        lineHeight: 1.6, maxHeight: '300px', overflow: 'auto',
                    }}
                >
                    <code>{content}</code>
                </Box>
            </Paper>
        </Box>
    );
};

type Endpoint = 'read-all' | 'check-last-edit' | 'read-all-locales' | 'get-project-locales' | 'add-term' | 'upsert-translation';

const ApiTryOutView: React.FC = observer(() => {
    const { uiStore, projectStore } = useStores();
    const { selectedProject } = projectStore;

    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>('read-all');
    const [selectedApiKeyPrefix, setSelectedApiKeyPrefix] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [selectedLocale, setSelectedLocale] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [termText, setTermText] = useState('');
    const [translationText, setTranslationText] = useState('');
    const [response, setResponse] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [curlCommand, setCurlCommand] = useState<string | null>(null);


    if (!selectedProject) return null;

    const apiKeys = selectedProject.apiKeys || [];
    
    const endpointDetails = {
        'read-all': { title: 'Fetch All Translations', path: `/read-all/${selectedProject.id}`, method: 'GET' },
        'check-last-edit': { title: 'Check for Updates', path: `/check-last-edit/${selectedProject.id}`, method: 'GET' },
        'read-all-locales': { title: 'Fetch All Available Locales', path: '/locale/read', method: 'GET' },
        'get-project-locales': { title: 'Fetch Project Locales', path: `/projects/${selectedProject.id}/locales`, method: 'GET' },
        'add-term': { title: 'Add a Term', path: `/projects/${selectedProject.id}/terms`, method: 'POST' },
        'upsert-translation': { title: 'Upsert Translation', path: `/projects/${selectedProject.id}/translations/upsert`, method: 'PUT' }
    };
    
    const currentEndpoint = endpointDetails[selectedEndpoint];
    const currentMethod = currentEndpoint.method;

    const handleEndpointChange = (event: SelectChangeEvent) => {
        const newEndpoint = event.target.value as Endpoint;
        setSelectedEndpoint(newEndpoint);
        // Reset dynamic fields on endpoint change
        setResponse(null);
        setError(null);
        setCurlCommand(null);
        setSelectedLocale('');
        setSelectedBranch('');
        setTermText('');
        setTranslationText('');
    };

    const handleSendRequest = async () => {
        let isInvalid = false;
        if (!selectedApiKeyPrefix || !apiSecret) {
            isInvalid = true;
        } else if (selectedEndpoint === 'read-all' || selectedEndpoint === 'check-last-edit') {
            if (!selectedLocale || !selectedBranch) isInvalid = true;
        } else if (selectedEndpoint === 'add-term') {
            if (!termText.trim()) isInvalid = true;
        } else if (selectedEndpoint === 'upsert-translation') {
            if (!termText.trim() || !selectedLocale || !translationText.trim()) isInvalid = true;
        }

        if (isInvalid) {
            setError('Please fill in all required fields for this endpoint.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse(null);
        setCurlCommand(null);

        let url = `${API_BASE_URL}${currentEndpoint.path}`;
        const headers: HeadersInit = {
            'X-Api-Key-Prefix': selectedApiKeyPrefix,
            'Authorization': `Bearer ${apiSecret}`
        };
        const fetchOptions: RequestInit = { method: currentMethod, headers };
        
        let curl = `curl -X ${currentMethod} "${url}" \\
  -H "X-Api-Key-Prefix: ${selectedApiKeyPrefix}" \\
  -H "Authorization: Bearer ${apiSecret}"`;

        if (currentMethod === 'GET') {
            const params = new URLSearchParams();
            if (selectedEndpoint === 'read-all' || selectedEndpoint === 'check-last-edit') {
                params.append('locale', selectedLocale);
                params.append('branch', selectedBranch);
            }

            if (params.toString()) {
                url = `${url}?${params.toString()}`;
            }

            fetchOptions.method = 'GET';
            // Update URL in curl command
            curl = `curl -X GET "${url}" \\
  -H "X-Api-Key-Prefix: ${selectedApiKeyPrefix}" \\
  -H "Authorization: Bearer ${apiSecret}"`;
        } else if (currentMethod === 'POST' || currentMethod === 'PUT') {
            headers['Content-Type'] = 'application/json';
            let body = {};

            if (selectedEndpoint === 'add-term') {
                body = { termText: termText.trim() };
            } else if (selectedEndpoint === 'upsert-translation') {
                body = { 
                    termKey: termText.trim(),
                    langCode: selectedLocale,
                    translation: translationText.trim()
                };
            }

            fetchOptions.body = JSON.stringify(body);
            curl += ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body)}'`;
        }

        setCurlCommand(curl);
        
        try {
            const res = await fetch(url, fetchOptions);
            const responseBody = await res.json();
            
            setResponse({
                status: res.status,
                statusText: res.statusText,
                body: responseBody,
            });

        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const openKeyManager = () => {
        uiStore.closeApiSpecModal();
        uiStore.openApiKeysManager();
    };
    
    let isSendDisabled = isLoading || !selectedApiKeyPrefix || !apiSecret;
    if (selectedEndpoint === 'read-all' || selectedEndpoint === 'check-last-edit') {
        if (!selectedLocale || !selectedBranch) isSendDisabled = true;
    } else if (selectedEndpoint === 'add-term') {
        if (!termText.trim()) isSendDisabled = true;
    } else if (selectedEndpoint === 'upsert-translation') {
        if (!termText.trim() || !selectedLocale || !translationText.trim()) isSendDisabled = true;
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflowY: 'auto' }}>
            {apiKeys.length === 0 ? (
                <Alert severity="warning" action={<Button color="inherit" size="small" onClick={openKeyManager}>Create One</Button>}>
                    No API keys found for this project. You need to create an API key to try out the endpoints.
                </Alert>
            ) : (
                <Box>
                    <Typography variant="h6" gutterBottom>Configuration</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>API Key</InputLabel>
                        <Select
                            value={selectedApiKeyPrefix}
                            label="API Key"
                            onChange={(e: SelectChangeEvent) => setSelectedApiKeyPrefix(e.target.value)}
                            renderValue={(value) => {
                                const selectedKey = apiKeys.find(k => k.keyPrefix === value);
                                if (!selectedKey) return value;
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography>{selectedKey.name}</Typography>
                                        <Chip
                                            label={selectedKey.permissions}
                                            color={getPermissionChipColor(selectedKey.permissions)}
                                            size="small" sx={{ textTransform: 'capitalize' }}
                                        />
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedKey.keyPrefix}</Typography>
                                    </Box>
                                );
                            }}
                        >
                            {apiKeys.map(key => (
                                <MenuItem key={key.id} value={key.keyPrefix}>
                                    <ListItemText primary={key.name} secondary={key.keyPrefix} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="API Secret"
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder="Paste your tnt_sec_... here"
                        helperText="Your secret is not stored and is only used for this browser session."
                        InputProps={{ startAdornment: <VpnKeyIcon sx={{ mr: 1, color: 'action.active' }} /> }}
                    />

                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Endpoint & Parameters</Typography>
                     <FormControl fullWidth margin="normal">
                        <InputLabel>Endpoint</InputLabel>
                        <Select value={selectedEndpoint} label="Endpoint" onChange={handleEndpointChange}>
                            <MenuItem value="read-all">[GET] Fetch All Translations</MenuItem>
                            <MenuItem value="check-last-edit">[GET] Check for Updates</MenuItem>
                            <MenuItem value="read-all-locales">[GET] Fetch All Available Locales</MenuItem>
                            <MenuItem value="get-project-locales">[GET] Fetch Project Locales</MenuItem>
                            <MenuItem value="add-term">[POST] Add a Term</MenuItem>
                            <MenuItem value="upsert-translation">[PUT] Upsert Translation (By Key)</MenuItem>
                        </Select>
                    </FormControl>

                    {(selectedEndpoint === 'read-all' || selectedEndpoint === 'check-last-edit') && (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Locale</InputLabel>
                                <Select value={selectedLocale} label="Locale" onChange={(e: SelectChangeEvent) => setSelectedLocale(e.target.value)} required>
                                    {selectedProject.languages.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Branch</InputLabel>
                                <Select value={selectedBranch} label="Branch" onChange={(e: SelectChangeEvent) => setSelectedBranch(e.target.value)} required>
                                    {selectedProject.branches.map(branch => <MenuItem key={branch.name} value={branch.name}>{branch.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {(selectedEndpoint === 'add-term' || selectedEndpoint === 'upsert-translation') && (
                        <>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Term Key"
                                value={termText}
                                onChange={(e) => setTermText(e.target.value)}
                                placeholder="e.g., common.submit_button"
                                required
                            />
                             <Alert severity="info" sx={{ mt: 1 }}>
                                Note: Terms are added to the project's currently active branch ({selectedProject.currentBranchName}).
                            </Alert>
                        </>
                    )}

                    {selectedEndpoint === 'upsert-translation' && (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' }, mt: 1 }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Locale</InputLabel>
                                <Select value={selectedLocale} label="Locale" onChange={(e: SelectChangeEvent) => setSelectedLocale(e.target.value)} required>
                                    {selectedProject.languages.map(lang => <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Translation Value"
                                value={translationText}
                                onChange={(e) => setTranslationText(e.target.value)}
                                placeholder="e.g., Invia"
                                required
                            />
                        </Box>
                    )}
                    
                    <Button
                        variant="contained"
                        onClick={handleSendRequest}
                        disabled={isSendDisabled}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{ mt: 2 }}
                    >
                        Send Request
                    </Button>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>Result</Typography>

                    {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
                    
                    {curlCommand && <ResponseBlock title="cURL Command" content={curlCommand} language="bash" />}

                    {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                    
                    {response && (
                         <Box>
                            <Typography sx={{mt:2}}>Status: <Chip label={`${response.status} ${response.statusText}`} color={response.status >= 200 && response.status < 300 ? 'success' : 'error'} size="small" /></Typography>
                            <ResponseBlock title="Response Body" content={JSON.stringify(response.body, null, 2)} />
                         </Box>
                    )}
                </Box>
            )}
        </Box>
    );
});

export default ApiTryOutView;