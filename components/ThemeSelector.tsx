import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IconButton, Menu, Box, Tooltip } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckIcon from '@mui/icons-material/Check';
import { useStores } from '../stores/StoreProvider';
import { themes, ThemeName } from '../theme';

const ThemeSelector: React.FC = observer(() => {
    const { uiStore } = useStores();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleSelectTheme = (themeName: ThemeName) => {
        uiStore.setThemeName(themeName);
        handleClose();
    };

    return (
        <>
            <Tooltip title="Change Theme" children={
                <IconButton onClick={handleClick} color="inherit" aria-label="Change theme">
                    <PaletteIcon />
                </IconButton>
            } />
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'theme-button',
                    sx: { display: 'flex', gap: 1, p: 1, flexWrap: 'wrap', maxWidth: 180 }
                }}
            >
                {Object.entries(themes).map(([name, config]) => (
                    <Tooltip title={name.charAt(0).toUpperCase() + name.slice(1)} key={name} children={
                        <Box
                            onClick={() => handleSelectTheme(name as ThemeName)}
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                background: `linear-gradient(135deg, ${config.primary.main} 50%, ${config.secondary.main} 50%)`,
                                border: uiStore.themeName === name ? '2px solid' : '2px solid transparent',
                                borderColor: 'primary.main',
                                '&:hover': {
                                    opacity: 0.8,
                                },
                            }}
                        >
                            {uiStore.themeName === name && (
                                <CheckIcon sx={{ color: 'white' }} />
                            )}
                        </Box>
                    } />
                ))}
            </Menu>
        </>
    );
});

export default ThemeSelector;