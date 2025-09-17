
import { createTheme } from '@mui/material/styles';

export type ThemeName = 'default' | 'teal' | 'purple' | 'green' | 'red' | 'cyan';

interface ThemeConfig {
    primary: { main: string };
    secondary: { main: string };
}

export const themes: Record<ThemeName, ThemeConfig> = {
    default: {
        primary: { main: '#1976d2' },
        secondary: { main: '#f50057' },
    },
    teal: {
        primary: { main: '#009688' },
        secondary: { main: '#ffc107' },
    },
    purple: {
        primary: { main: '#673ab7' },
        secondary: { main: '#ff9800' },
    },
    green: {
        primary: { main: '#4caf50' },
        secondary: { main: '#3f51b5' },
    },
    red: {
        primary: { main: '#f44336' },
        secondary: { main: '#607d8b' },
    },
    cyan: {
        primary: { main: '#00bcd4' },
        secondary: { main: '#cddc39' },
    },
};

export const createAppTheme = (mode: 'light' | 'dark', themeName: ThemeName) =>
    createTheme({
        palette: {
            mode,
            ...(themes[themeName] || themes.default),
            ...(mode === 'light'
                ? {
                      background: {
                          default: '#f5f5f5', // grey[100]
                          paper: '#ffffff',
                      },
                  }
                : {
                      background: {
                          default: '#121212',
                          paper: '#1e1e1e',
                      },
                  }),
        },
        typography: {
            fontFamily: 'Roboto, sans-serif',
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        borderRadius: 0,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderRight: 'none',
                    }
                }
            }
        },
    });