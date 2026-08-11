import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#2563eb' : '#6366f1', // Blue vs Indigo
        light: mode === 'light' ? '#3b82f6' : '#818cf8',
        dark: mode === 'light' ? '#1d4ed8' : '#4f46e5',
      },
      secondary: {
        main: mode === 'light' ? '#0d9488' : '#14b8a6', // Teal
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0b0f19', // Slate-50 vs Deep Navy
        paper: mode === 'light' ? '#ffffff' : '#111827',   // White vs Gray-900
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
      },
      success: {
        main: '#10b981',
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      },
      info: {
        main: '#06b6d4',
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { fontSize: '0.975rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #1f2937',
            boxShadow: 'none',
          },
        },
      },
    },
  });
};
