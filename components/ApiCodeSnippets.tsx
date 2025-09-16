
import React, { useState, useMemo } from 'react';
import { Box, Tabs, Tab, IconButton, Tooltip, Paper, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { generateExampleFromSchema } from './apiSpecUtils';

const generateCurlSnippet = (path: string, method: string, details: any, spec: any) => {
    let curl = `curl -X ${method.toUpperCase()} "${window.location.origin}/api/v1${path}" \\`;
    
    const headers = { 'Content-Type': 'application/json' };
    for (const [key, value] of Object.entries(headers)) {
        curl += `\n  -H "${key}: ${value}" \\`;
    }

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        curl += `\n  -d '${JSON.stringify(example, null, 2)}'`;
    } else {
        curl = curl.slice(0, -2); // Remove trailing backslash
    }

    return curl;
};

const generateJsSnippet = (path: string, method: string, details: any, spec: any) => {
    let js = `const url = "${window.location.origin}/api/v1${path}";\n`;
    const options: any = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
    };

    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        options.body = `JSON.stringify(${JSON.stringify(example, null, 2)})`;
    }

    js += `const options = {\n  method: '${options.method}',\n  headers: ${JSON.stringify(options.headers)},\n`;
    if(options.body) {
        js += `  body: ${options.body}\n`
    }
    js += `};\n\n`;

    js += `fetch(url, options)\n  .then(res => res.json())\n  .then(json => console.log(json))\n  .catch(err => console.error('error:' + err));`;
    return js;
};

const generatePythonSnippet = (path: string, method: string, details: any, spec: any) => {
    let py = `import requests\nimport json\n\n`;
    py += `url = "${window.location.origin}/api/v1${path}"\n`;
    
    if (details.requestBody) {
        const schema = details.requestBody.content['application/json'].schema;
        const example = generateExampleFromSchema(schema, spec);
        py += `payload = json.dumps(${JSON.stringify(example, null, 4)})\n`;
    } else {
        py += `payload = {}\n`;
    }
    
    py += `headers = {'Content-Type': 'application/json'}\n\n`;
    
    if (details.requestBody) {
        py += `response = requests.request("${method.toUpperCase()}", url, headers=headers, data=payload)\n`;
    } else {
        py += `response = requests.request("${method.toUpperCase()}", url, headers=headers)\n`;
    }
    
    py += `\nprint(response.text)`;
    return py;
};

interface ApiCodeSnippetsProps {
    path: string;
    method: string;
    details: any;
    spec: any;
}

const ApiCodeSnippets: React.FC<ApiCodeSnippetsProps> = ({ path, method, details, spec }) => {
    const [tab, setTab] = useState(0);
    const [copied, setCopied] = useState(false);

    const snippets = useMemo(() => {
        return [
            { label: 'cURL', code: generateCurlSnippet(path, method, details, spec) },
            { label: 'JavaScript', code: generateJsSnippet(path, method, details, spec) },
            { label: 'Python', code: generatePythonSnippet(path, method, details, spec) },
        ];
    }, [path, method, details, spec]);
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setCopied(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(snippets[tab].code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', px: 2, pt: 2 }}>Request Examples</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
                <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
                    {snippets.map(s => <Tab key={s.label} label={s.label} sx={{textTransform: 'none'}} />)}
                </Tabs>
            </Box>
            <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 200 }}>
                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                    <IconButton onClick={handleCopy} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                        {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
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
                        height: '100%',
                        overflow: 'auto',
                        borderBottomLeftRadius: 'inherit',
                        borderBottomRightRadius: 'inherit',
                    }}
                >
                    <code>
                        {snippets[tab].code}
                    </code>
                </Box>
            </Box>
        </Paper>
    );
};

export default ApiCodeSnippets;
