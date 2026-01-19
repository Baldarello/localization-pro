import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Paper, Divider, Chip, Tooltip, IconButton, Link, Alert } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ApiIcon from '@mui/icons-material/Api';
import CodeIcon from '@mui/icons-material/Code';
import DnsIcon from '@mui/icons-material/Dns';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useStores } from '../stores/StoreProvider';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Paper variant="outlined" sx={{ mt: 2, bgcolor: 'action.hover', position: 'relative' }}>
            <Tooltip title={copied ? "Copied!" : "Copy code"} children={
                <IconButton onClick={handleCopy} sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, color: 'text.secondary' }}>
                    {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
            } />
            <Box component="pre" sx={{ m: 0, p: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <code>{code.trim()}</code>
            </Box>
        </Paper>
    );
};

const DocsPage: React.FC = () => {
    const { uiStore } = useStores();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <Box
                            onClick={() => uiStore.setView('home')}
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                        >
                            <TranslateIcon sx={{ mr: 2, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                TnT
                            </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button color="inherit" onClick={() => uiStore.setView('docs')} sx={{ mr: 1 }}>Docs</Button>
                        <Button color="inherit" onClick={() => uiStore.setView('login')} sx={{ mr: 1 }}>Login</Button>
                        <Button variant="contained" color="secondary" onClick={() => uiStore.setView('register')}>Sign Up</Button>
                    </Toolbar>
                </Container>
            </AppBar>
        
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <ApiIcon color="primary" sx={{ fontSize: 60, mb: 1 }} />
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                            API Documentation & Workflows
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                            Integrate your translations anywhere with our simple and powerful API.
                        </Typography>
                    </Box>

                    <Paper sx={{ p: { xs: 2, md: 4 }, my: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <VpnKeyIcon />
                            <Typography variant="h4" component="h2">Authentication</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography paragraph>
                            All API requests must be authenticated using an API key. You can generate keys within a project's settings under "API Keys".
                            Each request must include two headers:
                        </Typography>
                        <ul>
                            <li><Typography component="li"><code>X-Api-Key-Prefix</code>: The public, non-secret prefix of your key (e.g., <code>tnt_key_...</code>).</Typography></li>
                            <li><Typography component="li"><code>Authorization</code>: The secret part of your key, prefixed with `Bearer ` (e.g., <code>Bearer tnt_sec_...</code>).</Typography></li>
                        </ul>
                        <CodeBlock code={`
curl --request GET \\
  --url 'https://localizationpro-api.tnl.one/api/v1/read-all/YOUR_PROJECT_ID?locale=en' \\
  --header 'Authorization: Bearer YOUR_API_SECRET' \\
  --header 'X-Api-Key-Prefix: YOUR_API_KEY_PREFIX'
                        `} />
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Logged-in users can access a full, interactive OpenAPI (Swagger) specification from the project dashboard for a complete list of all available endpoints.
                        </Alert>
                    </Paper>

                    <Paper sx={{ p: { xs: 2, md: 4 }, my: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <DnsIcon />
                            <Typography variant="h4" component="h2">Core Endpoints</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="h5" component="h3" sx={{ mt: 3 }}>Check for Updates</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, flexWrap: 'wrap' }}>
                            <Chip label="GET" color="success" size="small" />
                            <Typography component="code" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>/api/v1/check-last-edit/:projectId</Typography>
                        </Box>
                        <Typography paragraph color="text.secondary">
                            A lightweight endpoint to quickly check the last modification time for a specific language in a branch. Ideal for determining if you need to fetch fresh data.
                        </Typography>
                        <CodeBlock code={`
const projectId = 'proj-1';
const locale = 'en';
const branch = 'main'; // optional, defaults to 'main'

// This function checks if your local translations are outdated.
async function checkForUpdates(localLastUpdateTimestamp) {
    const response = await fetch(\`https://localizationpro-api.tnl.one/api/v1/check-last-edit/\${projectId}?locale=\${locale}&branch=\${branch}\`, {
        headers: {
            'Authorization': 'Bearer YOUR_API_SECRET',
            'X-Api-Key-Prefix': 'YOUR_API_KEY_PREFIX'
        }
    });

    if (!response.ok) {
        console.error('Failed to check for updates');
        return false;
    }

    const data = await response.json();
    const remoteTimestamp = new Date(data.updatedAt);
    
    return remoteTimestamp > new Date(localLastUpdateTimestamp);
}
                        `} />
                        <Typography variant="h5" component="h3" sx={{ mt: 4 }}>Fetch All Translations</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, flexWrap: 'wrap' }}>
                            <Chip label="GET" color="success" size="small" />
                            <Typography component="code" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>/api/v1/read-all/:projectId</Typography>
                        </Box>
                        <Typography paragraph color="text.secondary">
                            Fetches a complete JSON object of all key-value pairs for a given language and branch.
                        </Typography>
                        <CodeBlock code={`
async function fetchTranslations() {
    const response = await fetch(\`https://localizationpro-api.tnl.one/api/v1/read-all/\${projectId}?locale=\${locale}&branch=\${branch}\`, {
        headers: {
            'Authorization': 'Bearer YOUR_API_SECRET',
            'X-Api-Key-Prefix': 'YOUR_API_KEY_PREFIX'
        }
    });
    const data = await response.json();
    // data will be in the format: { "en": { "welcome_message": "Welcome!", ... } }
    const translations = data[locale];
    return translations;
}
                        `} />
                    </Paper>

                    <Paper sx={{ p: { xs: 2, md: 4 }, my: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <CodeIcon />
                            <Typography variant="h4" component="h2">Example Workflows</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="h5" component="h3" sx={{ mt: 3 }}>Dynamic Loading in a Web App</Typography>
                        <Typography paragraph color="text.secondary">
                            Use this workflow to ensure your users always have the latest translations without needing to clear their cache or reload the application.
                        </Typography>
                        <CodeBlock code={`
// 1. On app startup, get your stored data
let translations = JSON.parse(localStorage.getItem('translations') || '{}');
let lastUpdate = localStorage.getItem('lastUpdate') || new Date(0).toISOString();

// 2. Check if an update is available
const needsUpdate = await checkForUpdates(lastUpdate);

// 3. If needed, fetch and store the new data
if (needsUpdate) {
    console.log('New translations available, fetching...');
    translations = await fetchTranslations();
    lastUpdate = new Date().toISOString(); // Or use the timestamp from the check-last-edit response

    localStorage.setItem('translations', JSON.stringify(translations));
    localStorage.setItem('lastUpdate', lastUpdate);

    // TODO: Trigger a state update in your app to use the new translations
    // e.g., i18n.addResourceBundle('en', 'translation', translations, true, true);
} else {
    console.log('Translations are up-to-date.');
}
                        `} />
                        <Typography variant="h5" component="h3" sx={{ mt: 4 }}>CI/CD Integration</Typography>
                        <Typography paragraph color="text.secondary">
                            Integrate translation fetching directly into your build process to bundle the latest text with every deployment.
                        </Typography>
                        <CodeBlock code={`
# Your build script (e.g., in package.json or a .sh file)
echo "Fetching latest translations..."

# Define variables
PROJECT_ID="proj-1"
API_PREFIX="YOUR_API_KEY_PREFIX"
API_SECRET="YOUR_API_SECRET"
LOCALES=("en" "es" "de")
OUTPUT_DIR="./public/locales"

# Create directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Loop through each locale and download the JSON file
for LOCALE in "\${LOCALES[@]}"
do
  echo "Fetching $LOCALE..."
  curl --request GET \\
    --url "https://localizationpro-api.tnl.one/api/v1/read-all/$PROJECT_ID?locale=$LOCALE&branch=main" \\
    --header "Authorization: Bearer $API_SECRET" \\
    --header "X-Api-Key-Prefix: $API_PREFIX" \\
    --output "$OUTPUT_DIR/$LOCALE.json"
done

echo "Translations downloaded successfully!"

# Continue with your regular build process...
# npm run build
                        `} />
                    </Paper>
                </Container>
            </Box>

            <Box component="footer" sx={{ py: 4, textAlign: 'center', flexShrink: 0, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary">
                        &copy; {new Date().getFullYear()} TnT. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default DocsPage;