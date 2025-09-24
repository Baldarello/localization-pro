import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Paper, SvgIcon, Select, MenuItem, SelectChangeEvent, ListItemIcon, ListItemText, Divider, List, ListItem, Chip } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import HistoryIcon from '@mui/icons-material/History';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CommentIcon from '@mui/icons-material/Comment';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import { useStores } from '../stores/StoreProvider';
import { useTheme } from '@mui/material/styles';
import { getFlagCode } from '../constants';
import { GitHubIcon } from './icons';

const features = [
    {
        icon: AccountTreeIcon,
        title: { en: 'Git-like Branching', it: 'Branching stile Git' },
        description: {
            en: 'Work on features in isolation. Create branches from the main line or any commit, then merge when ready.',
            it: 'Lavora su funzionalità in isolamento. Crea branch dalla linea principale o da qualsiasi commit, poi unisci quando è pronto.'
        }
    },
    {
        icon: CallMergeIcon,
        title: { en: 'Compare & Merge', it: 'Confronta e Unisci' },
        description: {
            en: 'Visually compare branches with a word-level diff and merge changes back into your main branch with confidence.',
            it: 'Confronta visivamente i branch con un diff a livello di parola e unisci le modifiche nel tuo branch principale con sicurezza.'
        }
    },
    {
        icon: PeopleIcon,
        title: { en: 'Team Management', it: 'Gestione del Team' },
        description: {
            en: 'Assign roles (Admin, Editor, Translator) and specific languages to team members for controlled access.',
            it: 'Assegna ruoli (Admin, Editor, Traduttore) e lingue specifiche ai membri del team per un accesso controllato.'
        }
    },
    {
        icon: AutoFixHighIcon,
        title: { en: 'AI Translations', it: 'Traduzioni AI' },
        description: {
            en: 'Get instant, high-quality translation suggestions powered by Google\'s Gemini API to speed up your workflow.',
            it: 'Ottieni suggerimenti di traduzione istantanei e di alta qualità grazie alla Gemini API di Google per accelerare il tuo flusso di lavoro.'
        }
    },
    {
        icon: HistoryIcon,
        title: { en: 'Commit History', it: 'Cronologia dei Commit' },
        description: {
            en: 'Track every change with a detailed commit log. View historical states and restore versions by creating a new branch.',
            it: 'Traccia ogni modifica con un registro dettagliato dei commit. Visualizza gli stati storici e ripristina versioni creando un nuovo branch.'
        }
    },
    {
        icon: CommentIcon,
        title: { en: 'Real-time Collaboration', it: 'Collaborazione in Tempo Reale' },
        description: {
            en: 'Discuss translations directly on a term using comments, with @mentions to notify specific team members.',
            it: 'Discuti le traduzioni direttamente su un termine usando i commenti, con @menzioni per notificare membri specifici del team.'
        }
    },
     {
        icon: ImportExportIcon,
        title: { en: 'Import & Export', it: 'Importa & Esporta' },
        description: {
            en: 'Easily move your data in and out. Supports JSON for single-language files and CSV for bulk translations.',
            it: 'Sposta facilmente i tuoi dati in entrata e in uscita. Supporta JSON per file monolingua e CSV per traduzioni di massa.'
        }
    },
    {
        icon: VpnKeyIcon,
        title: { en: 'Secure Authentication', it: 'Autenticazione Sicura' },
        description: {
            en: 'Secure your projects with both traditional email/password login and seamless Google OAuth 2.0 sign-in.',
            it: 'Proteggi i tuoi progetti sia con il tradizionale login email/password sia con l\'accesso rapido di Google OAuth 2.0.'
        }
    }
];

const heroContent = {
    en: {
        title: 'The Smart Way to Localize Your Projects',
        subtitle: 'A powerful platform inspired by POEditor, designed for developers and translation teams. Streamline your workflow with branching, AI assistance, and robust team management.'
    },
    it: {
        title: 'Il Modo Intelligente per Localizzare i Tuoi Progetti',
        subtitle: 'Una potente piattaforma ispirata a POEditor, pensata per sviluppatori e team di traduzione. Semplifica il tuo flusso di lavoro con branching, assistenza AI e una solida gestione del team.'
    }
};

const featuresSectionTitle = {
    en: 'Everything You Need, All in One Place',
    it: 'Tutto Ciò di Cui Hai Bisogno, in un Unico Posto'
};

const pricingContent = {
    en: {
        title: 'Choose Your Plan',
        subtitle: 'Start for free and scale as you grow. Powerful localization for every team size.',
        openSource: {
            title: 'Open Source',
            price: 'Forever Free',
            description: 'Self-host on your own infrastructure for complete control and unlimited access.',
            features: [ 'Unlimited Projects', 'Unlimited Terms', 'Unlimited Team Members', 'Full Feature Access' ],
            buttonText: 'View on GitHub'
        },
        cloudFree: {
            title: 'Cloud - Free',
            price: 'Free',
            description: 'Perfect for personal projects and small teams to get started. Generous limits, no credit card required.',
            features: [ '3 Projects', '1,000 Terms per Project', '5 Team Members per Project', 'Community Support' ],
            buttonText: 'Get Started for Free'
        },
        cloudPro: {
            title: 'Cloud - Pro & Enterprise',
            price: 'Coming Soon',
            description: 'The ultimate solution for professional teams, businesses, and enterprises that need to scale.',
            features: [ 'Unlimited Projects', 'Unlimited Terms', 'Unlimited Team Members', 'Priority Support & SLA' ],
            buttonText: 'Contact for Info',
            contactEmail: 'mmazzocchetti@tnl.one',
            contactSubject: 'Inquiry about TnT Enterprise Plan',
            contactBody: "Hello, I'm interested in learning more about the Enterprise plan, including pricing and premium support options. Thank you."
        }
    },
    it: {
        title: 'Scegli il Tuo Piano',
        subtitle: 'Inizia gratuitamente e cresci con le tue esigenze. Localizzazione potente per team di ogni dimensione.',
        openSource: {
            title: 'Open Source',
            price: 'Gratis per Sempre',
            description: 'Ospita sulla tua infrastruttura per un controllo completo e un accesso illimitato.',
            features: [ 'Progetti Illimitati', 'Termini Illimitati', 'Membri del Team Illimitati', 'Accesso a Tutte le Funzionalità' ],
            buttonText: 'Vedi su GitHub'
        },
        cloudFree: {
            title: 'Cloud - Gratuito',
            price: 'Gratis',
            description: 'Perfetto per progetti personali e piccoli team. Limiti generosi, nessuna carta di credito richiesta.',
            features: [ '3 Progetti', '1.000 Termini per Progetto', '5 Membri del Team per Progetto', 'Supporto Community' ],
            buttonText: 'Inizia Gratuitamente'
        },
        cloudPro: {
            title: 'Cloud - Pro & Enterprise',
            price: 'In Arrivo',
            description: 'La soluzione definitiva per team professionali, aziende ed enterprise che necessitano di scalare.',
            features: [ 'Progetti Illimitati', 'Termini Illimitati', 'Membri del Team Illimitati', 'Supporto Prioritario e SLA' ],
            buttonText: 'Contatta per Info',
            contactEmail: 'mmazzocchetti@tnl.one',
            contactSubject: 'Richiesta informazioni per il piano TnT Enterprise',
            contactBody: "Salve, sarei interessato/a a ricevere maggiori informazioni riguardo al piano Enterprise, inclusi i prezzi e le opzioni di supporto premium. Grazie."
        }
    }
};

const supportedLanguages: { code: 'en' | 'it', name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italiano' },
];

const HomePage: React.FC = () => {
    const { uiStore } = useStores();
    const theme = useTheme();
    const [lang, setLang] = useState<'en' | 'it'>('en');

    const handleLangChange = (event: SelectChangeEvent) => {
        setLang(event.target.value as 'en' | 'it');
    };

    const proPlanContent = pricingContent[lang].cloudPro;
    const mailtoLink = `mailto:${proPlanContent.contactEmail}?subject=${encodeURIComponent(proPlanContent.contactSubject)}&body=${encodeURIComponent(proPlanContent.contactBody)}`;

    return (
        <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
            <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <TranslateIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            TnT
                        </Typography>
                        <Select
                            value={lang}
                            onChange={handleLangChange}
                            variant="outlined"
                            sx={{
                                mr: 2,
                                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '& .MuiSelect-select': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1,
                                    bgcolor: 'action.hover',
                                    borderRadius: 1
                                },
                            }}
                            renderValue={(value) => (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box component="span" className={`flag-icon flag-icon-${getFlagCode(value)}`} />
                                    <Typography variant="body2" sx={{textTransform: 'uppercase'}}>{value}</Typography>
                                </Box>
                            )}
                        >
                            {supportedLanguages.map((language) => (
                                <MenuItem key={language.code} value={language.code}>
                                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                                        <Box component="span" className={`flag-icon flag-icon-${getFlagCode(language.code)}`} />
                                    </ListItemIcon>
                                    <ListItemText primary={language.name} />
                                </MenuItem>
                            ))}
                        </Select>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Button color="inherit" onClick={() => uiStore.setView('docs')} sx={{ mr: 1 }}>Docs</Button>
                            <Button color="inherit" onClick={() => uiStore.setView('login')} sx={{ mr: 1 }}>Login</Button>
                            <Button variant="contained" color="secondary" onClick={() => uiStore.setView('register')}>Sign Up</Button>
                        </Box>
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                             <Button color="inherit" onClick={() => uiStore.setView('docs')}>Docs</Button>
                            <Button color="inherit" onClick={() => uiStore.setView('login')}>Login</Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <main>
                <Box
                    sx={{
                        pt: { xs: 8, md: 12 },
                        pb: { xs: 6, md: 10 },
                        textAlign: 'center'
                    }}
                >
                    <Container maxWidth="md">
                        <Typography
                            component="h1"
                            variant="h2"
                            sx={{ fontWeight: 'bold', mb: 2 }}
                        >
                            {heroContent[lang].title}
                        </Typography>
                        <Typography variant="h5" color="text.secondary" paragraph sx={lang === 'it' ? { fontStyle: 'italic' } : {}}>
                            {heroContent[lang].subtitle}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            onClick={() => uiStore.setView('register')}
                            sx={{ mt: 2 }}
                        >
                            Get Started for Free
                        </Button>
                    </Container>
                </Box>

                <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100', py: { xs: 8, md: 12 } }}>
                    <Container maxWidth="lg">
                        <Typography variant="h3" component="h2" textAlign="center" sx={{ fontWeight: 'bold', mb: 8 }}>
                            {featuresSectionTitle[lang]}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2 }}>
                            {features.map((feature, index) => (
                                <Box key={index} sx={{ width: { xs: '100%', sm: '50%', md: '33.3333%' }, p: 2 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            height: '100%',
                                            borderColor: 'divider',
                                            bgcolor: 'background.paper'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <SvgIcon component={feature.icon} color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
                                            <Typography variant="h6" component="h3" sx={{ fontWeight: 500, ...(lang === 'it' && { fontStyle: 'italic' }) }}>
                                                {feature.title[lang]}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={lang === 'it' ? { fontStyle: 'italic' } : {}}>
                                            {feature.description[lang]}
                                        </Typography>
                                    </Paper>
                                </Box>
                            ))}
                        </Box>
                    </Container>
                </Box>

                <Box sx={{ py: { xs: 8, md: 12 } }}>
                    <Container maxWidth="lg">
                        <Typography variant="h3" component="h2" textAlign="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {pricingContent[lang].title}
                        </Typography>
                         <Typography variant="h5" color="text.secondary" textAlign="center" paragraph sx={{ mb: 8, ...(lang === 'it' && { fontStyle: 'italic' }) }}>
                            {pricingContent[lang].subtitle}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -2, alignItems: 'stretch', justifyContent: 'center' }}>
                            {/* Open Source Card */}
                            <Box sx={{ width: { xs: '100%', md: '33.3333%' }, p: 2 }}>
                                <Paper variant="outlined" sx={{ p: {xs: 2, sm: 4}, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>{pricingContent[lang].openSource.title}</Typography>
                                    <Typography variant="h4" component="p" sx={{ my: 1 }}><Box component="span" sx={{ fontWeight: 'bold' }}>{pricingContent[lang].openSource.price}</Box></Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>{pricingContent[lang].openSource.description}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <List dense sx={{ flexGrow: 1 }}>
                                        {pricingContent[lang].openSource.features.map(feature => (
                                            <ListItem key={feature} disableGutters>
                                                <ListItemIcon sx={{ minWidth: 32 }}><CheckIcon color="primary" fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={feature} />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Button fullWidth variant="outlined" startIcon={<GitHubIcon />} onClick={() => window.open('https://github.com/Baldarello/localization-pro', '_blank')} sx={{ mt: 2 }}>
                                        {pricingContent[lang].openSource.buttonText}
                                    </Button>
                                </Paper>
                            </Box>

                             {/* Cloud Free Card (Highlighted) */}
                            <Box sx={{ width: { xs: '100%', md: '33.3333%' }, p: 2 }}>
                                <Paper elevation={4} sx={{ p: {xs: 2, sm: 4}, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', border: 2, borderColor: 'secondary.main', overflow: 'visible' }}>
                                    <Chip icon={<StarIcon />} label="Most Popular" color="secondary" sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold' }} />
                                    <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>{pricingContent[lang].cloudFree.title}</Typography>
                                    <Typography variant="h4" component="p" sx={{ my: 1 }}><Box component="span" sx={{ fontWeight: 'bold' }}>{pricingContent[lang].cloudFree.price}</Box></Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>{pricingContent[lang].cloudFree.description}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <List dense sx={{ flexGrow: 1 }}>
                                        {pricingContent[lang].cloudFree.features.map(feature => (
                                            <ListItem key={feature} disableGutters>
                                                <ListItemIcon sx={{ minWidth: 32 }}><CheckIcon color="secondary" fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={feature} />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Button fullWidth variant="contained" color="secondary" onClick={() => uiStore.setView('register')} sx={{ mt: 2 }}>
                                        {pricingContent[lang].cloudFree.buttonText}
                                    </Button>
                                </Paper>
                            </Box>

                            {/* Cloud Pro Card */}
                             <Box sx={{ width: { xs: '100%', md: '33.3333%' }, p: 2 }}>
                                <Paper variant="outlined" sx={{ p: {xs: 2, sm: 4}, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>{proPlanContent.title}</Typography>
                                    <Typography variant="h4" component="p" sx={{ my: 1 }}><Box component="span" sx={{ fontWeight: 'bold' }}>{proPlanContent.price}</Box></Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: '4.5em' }}>{proPlanContent.description}</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <List dense sx={{ flexGrow: 1 }}>
                                         {proPlanContent.features.map(feature => (
                                            <ListItem key={feature} disableGutters>
                                                <ListItemIcon sx={{ minWidth: 32 }}><CheckIcon color="primary" fontSize="small" /></ListItemIcon>
                                                <ListItemText primary={feature} />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        sx={{ mt: 2 }}
                                        component="a"
                                        href={mailtoLink}
                                    >
                                        {proPlanContent.buttonText}
                                    </Button>
                                </Paper>
                            </Box>
                        </Box>
                    </Container>
                </Box>
            </main>

            <Box component="footer" sx={{ py: 4, textAlign: 'center' }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary">
                        &copy; {new Date().getFullYear()} TnT. All rights reserved.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        FE Version: 0.1.0 | BE Version: 1.0.0
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default HomePage;