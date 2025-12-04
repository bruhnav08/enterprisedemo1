import { AppBar, Toolbar, Typography, Container, Box, Button, IconButton, useTheme } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import StorageIcon from '@mui/icons-material/Storage';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon Icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun Icon

const MainLayout = ({ children, toggleColorMode, mode }) => {
  const location = useLocation();
  const theme = useTheme();

  const isActive = (path) => {
    return location.pathname === path 
      ? { 
          backgroundColor: theme.palette.primary.main,
          color: '#ffffff'
        } 
      : { 
          color: theme.palette.text.secondary,
          '&:hover': { backgroundColor: theme.palette.action.hover }
        };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Modern Glass Navbar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
            // 80% Opacity Background
            bgcolor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.8)',
            // Blur Effect
            backdropFilter: 'blur(12px)',
            borderBottom: 1,
            borderColor: 'divider',
        }}
      >
        <Toolbar>
          {/* Gradient Text Logo */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
                flexGrow: 1, 
                fontWeight: 800, 
                letterSpacing: '-0.5px',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}
          >
            ENTERPRISE REGISTRY
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Button 
              component={Link} 
              to="/" 
              startIcon={<DashboardIcon />}
              sx={{ ...isActive('/'), borderRadius: 2, px: 2, fontWeight: 600 }}
            >
              Dashboard
            </Button>
            
            <Button 
              component={Link} 
              to="/new" 
              startIcon={<AddCircleOutlineIcon />}
              sx={{ ...isActive('/new'), borderRadius: 2, px: 2, fontWeight: 600 }}
            >
              New Entry
            </Button>

            <Button 
              component={Link} 
              to="/manage" 
              startIcon={<StorageIcon />}
              sx={{ ...isActive('/manage'), borderRadius: 2, px: 2, fontWeight: 600 }}
            >
              Manage Records
            </Button>
          </Box>

          {/* Dark Mode Toggle */}
          <IconButton onClick={toggleColorMode} color="default">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Page Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>

      {/* Footer */}
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 Enterprise Internship Project.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;