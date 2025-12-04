import { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

// Imports (These must exist)
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import AssetEntryPage from './pages/AssetEntryPage';
import EditRecordPage from './pages/EditRecordPage';
import TypeManagementPage from './pages/TypeManagementPage';
import TypeRecordListPage from './pages/TypeRecordListPage';

function App() {
  const [mode, setMode] = useState('light');

  // --- SAFE EMBEDDED THEME CONFIGURATION ---
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        // Electric Violet (Modern & High Tech)
        main: mode === 'light' ? '#7c3aed' : '#a78bfa',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Emerald for success
      },
      background: {
        // Light: Off-White | Dark: Deep Navy Slate (Not pitch black)
        default: mode === 'light' ? '#f8fafc' : '#0f172a', 
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#94a3b8',
      },
      divider: mode === 'light' ? '#e2e8f0' : '#334155',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 12 }, // Modern rounded corners
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            // Use Borders in Dark Mode instead of Shadows
            border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
            boxShadow: mode === 'light' ? '0 1px 3px 0 rgba(0,0,0,0.05)' : 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none', // Remove default material gradient
          }
        }
      }
    },
  }), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* This applies the dark background globally */}
      <Router>
        <MainLayout toggleColorMode={toggleColorMode} mode={mode}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/new" element={<AssetEntryPage />} />
            <Route path="/manage" element={<TypeManagementPage />} />
            <Route path="/manage/:typeId" element={<TypeRecordListPage />} />
            <Route path="/edit/:id" element={<EditRecordPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;