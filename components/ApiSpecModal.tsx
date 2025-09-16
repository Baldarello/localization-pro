
import React, { useState, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, DialogActions, Button, Tabs, Tab, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItemButton, ListItemText, ListSubheader,
    CircularProgress, TextField, InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import { useStores } from '../stores/StoreProvider';
import ApiCodeSnippets from './ApiCodeSnippets';
import ApiExamplePanel from './ApiExamplePanel';

const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET': return 'success';
        case 'POST': return 'primary';
        case 'PUT': return 'warning';
        case 'DELETE': return 'error';
        default: return 'default';
    }
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    sx?: object;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`spec-tabpanel-${index}`} aria-labelledby={`spec-tab-${index}`} style={{ height: '100%' }} {...other}>
            {value === index && <Box sx={{ height: '100%', overflow: 'hidden', ...props.sx }}>{children}</Box>}
        </div>
    );
}

const EndpointContent = ({ path, method, details, spec }: { path: string, method: string, details: any, spec: any }) => {
    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Chip label={method.toUpperCase()} color={getMethodColor(method)} sx={{ fontWeight: 'bold', mb: 1 }} />
                <Typography variant="h4" component="h2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{path}</Typography>
                <Typography variant="h6" component="h3" color="text.secondary" sx={{ mt: 1 }}>{details.summary}</Typography>
            </Box>

            {details.parameters && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Parameters</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>In</TableCell>
                                    <TableCell>Required</TableCell>
                                    <TableCell>Type</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {details.parameters.map((param: any) => (
                                    <TableRow key={param.name}>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{param.name}</TableCell>
                                        <TableCell>{param.in}</TableCell>
                                        <TableCell>{param.required ? 'Yes' : 'No'}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{param.schema.type}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {details.responses && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Responses</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(details.responses).map(([code, response]: [string, any]) => (
                                    <TableRow key={code}>
                                        <TableCell>{code}</TableCell>
                                        <TableCell>{response.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* FIX: Replaced MUI Grid with Box and flexbox to resolve TypeScript errors with Grid's `item` prop. This approach achieves the same responsive layout. */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
                <Box sx={{ width: { xs: '100%', lg: '50%' }, p: 1.5 }}>
                    <ApiCodeSnippets path={path} method={method} details={details} spec={spec} />
                </Box>
                <Box sx={{ width: { xs: '100%', lg: '50%' }, p: 1.5 }}>
                    <ApiExamplePanel details={details} spec={spec} />
                </Box>
            </Box>
        </Box>
    );
};

const ApiReferenceView = () => {
    const [spec, setSpec] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState<{ path: string, method: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSpec = async () => {
            try {
                const response = await fetch('/openapi.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setSpec(data);
            } catch (e) {
                console.error("Failed to load API spec:", e);
                setError("Could not load API specification. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSpec();
    }, []);

    const groupedPaths = useMemo(() => {
        if (!spec) return {};
        const groups: Record<string, { path: string, method: string, details: any }[]> = {};
        for (const [path, methods] of Object.entries(spec.paths as object)) {
            for (const [method, details] of Object.entries(methods as object)) {
                const tag = details.tags?.[0] || 'Default';
                if (!groups[tag]) groups[tag] = [];
                groups[tag].push({ path, method, details });
            }
        }
        return groups;
    }, [spec]);

    const filteredTags = useMemo(() => {
        if (!spec) return [];
        if (!searchTerm.trim()) return spec.tags;

        const lowerCaseSearch = searchTerm.toLowerCase();
        const visibleEndpoints = new Set();

        Object.values(groupedPaths).flat().forEach(({ path, method, details }) => {
            if (path.toLowerCase().includes(lowerCaseSearch) || details.summary.toLowerCase().includes(lowerCaseSearch)) {
                visibleEndpoints.add(`${method}-${path}`);
            }
        });

        return spec.tags.filter((tag: any) =>
            groupedPaths[tag.name]?.some(({ path, method }) => visibleEndpoints.has(`${method}-${path}`))
        );
    }, [spec, searchTerm, groupedPaths]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }
    if (error) {
        return <Box sx={{ p: 3 }}><Typography color="error">{error}</Typography></Box>;
    }
    if (!spec) return null;

    const currentEndpointDetails = selectedEndpoint ? spec.paths[selectedEndpoint.path]?.[selectedEndpoint.method] : null;

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: 320, flexShrink: 0, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search endpoints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    />
                </Box>
                <Box sx={{ overflowY: 'auto' }}>
                    <List dense>
                        {filteredTags.map((tag: any) => {
                            const endpoints = groupedPaths[tag.name]?.filter(({ path, details }) =>
                                !searchTerm || path.toLowerCase().includes(searchTerm.toLowerCase()) || details.summary.toLowerCase().includes(searchTerm.toLowerCase())
                            );
                            if (!endpoints || endpoints.length === 0) return null;

                            return (
                                <li key={tag.name}>
                                    <ListSubheader sx={{ bgcolor: 'background.paper', py: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>{tag.name}</ListSubheader>
                                    {endpoints.map(({ path, method, details }) => (
                                        <ListItemButton
                                            key={`${method}-${path}`}
                                            selected={selectedEndpoint?.path === path && selectedEndpoint?.method === method}
                                            onClick={() => setSelectedEndpoint({ path, method })}
                                            sx={{ pl: 4 }}
                                        >
                                            <Chip label={method.toUpperCase()} color={getMethodColor(method)} size="small" sx={{ width: 60, mr: 1.5, fontWeight: 'bold', fontSize: '0.7rem' }} />
                                            <ListItemText primary={details.summary} primaryTypographyProps={{ sx: { fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }} />
                                        </ListItemButton>
                                    ))}
                                </li>
                            );
                        })}
                    </List>
                </Box>
            </Box>
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                {currentEndpointDetails ? (
                    <EndpointContent details={currentEndpointDetails} path={selectedEndpoint!.path} method={selectedEndpoint!.method} spec={spec} />
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', textAlign: 'center' }}>
                        <CodeIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">Select an endpoint from the menu</Typography>
                        <Typography color="text.secondary">API details and code examples will be displayed here.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const RawSpecView: React.FC = () => {
    const [rawSpec, setRawSpec] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/openapi.json')
            .then(res => res.json())
            .then(data => {
                const formattedSpec = JSON.stringify(data, null, 2);
                setRawSpec(formattedSpec);
            })
            .catch(e => console.error("Failed to load raw JSON spec:", e))
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
            {isLoading
                ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                : <Box component="pre" sx={{ p: 2, m: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {rawSpec.trim()}
                  </Box>
            }
        </Box>
    );
};

const ApiSpecModal: React.FC = observer(() => {
    const { uiStore } = useStores();
    const [tab, setTab] = useState(0);

    return (
        <Dialog open={uiStore.isApiSpecModalOpen} onClose={uiStore.closeApiSpecModal} fullWidth maxWidth="xl" scroll="paper" sx={{ '& .MuiDialog-paper': { height: '90vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CodeIcon />
                    <Typography variant="h6">API Specification (OpenAPI 3.0)</Typography>
                </Box>
                <IconButton onClick={uiStore.closeApiSpecModal}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}>
                    <Tabs value={tab} onChange={(e, v) => setTab(v)} aria-label="api spec tabs">
                        <Tab label="API Reference" id="spec-tab-0" aria-controls="spec-tabpanel-0" />
                        <Tab label="Raw Spec (JSON)" id="spec-tab-1" aria-controls="spec-tabpanel-1" />
                    </Tabs>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <TabPanel value={tab} index={0}>
                        <ApiReferenceView />
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                        <RawSpecView />
                    </TabPanel>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={uiStore.closeApiSpecModal}>Close</Button>
            </DialogActions>
        </Dialog>
    );
});

export default ApiSpecModal;
