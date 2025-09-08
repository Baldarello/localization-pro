import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode: 'light' | 'dark') =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: '#1976d2', // blue[600]
            },
            secondary: {
                main: '#f50057', // pink['A400']
            },
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