import React, { useMemo } from 'react';
import { Box, Paper, Typography, Tooltip, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { generateExampleFromSchema } from './apiSpecUtils';

interface ApiExamplePanelProps {
    details: any;
    spec: any;
}

const JsonBlock: React.FC<{ title: string, data: any }> = ({ title, data }) => {
    const [copied, setCopied] = React.useState(false);

    if (!data) {
        return null;
    }

    const textToCopy = JSON.stringify(data, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Box>
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
                        m: 0,
                        p: 2,
                        bgcolor: 'action.hover',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        maxHeight: '400px',
                        overflow: 'auto',
                    }}
                >
                    <code>{textToCopy}</code>
                </Box>
            </Paper>
        </Box>
    );
};

const ApiExamplePanel: React.FC<ApiExamplePanelProps> = ({ details, spec }) => {

    const requestBodyExample = useMemo(() => {
        const schema = details.requestBody?.content?.['application/json']?.schema;
        return schema ? generateExampleFromSchema(schema, spec) : null;
    }, [details, spec]);

    const responseExample = useMemo(() => {
        const successResponse = details.responses?.['200'] || details.responses?.['201'];
        const schema = successResponse?.content?.['application/json']?.schema;
        return schema ? generateExampleFromSchema(schema, spec) : null;
    }, [details, spec]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <JsonBlock title="Request Body Example" data={requestBodyExample} />
            <JsonBlock title="Response Example (Success)" data={responseExample} />
        </Box>
    );
};

export default ApiExamplePanel;