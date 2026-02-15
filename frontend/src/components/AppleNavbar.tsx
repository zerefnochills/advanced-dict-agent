import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from '../utils/auth';

const AppleNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const authenticated = isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicNavItems = [
    { label: 'Features', path: '/#features' },
    { label: 'Pricing', path: '/#pricing' },
    { label: 'Docs', path: '/docs' },
  ];

  const protectedNavItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Connections', path: '/connections' },
    { label: 'Explorer', path: '/explorer' },
    { label: 'Quality', path: '/quality' },
    { label: 'Chat', path: '/chat' },
  ];

  const navItems = authenticated ? protectedNavItems : publicNavItems;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(path.substring(2));
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <StorageIcon sx={{ color: '#007AFF', fontSize: 24 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Data Dictionary
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: '#86868b' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ p: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                py: 1.5,
                '&.Mui-selected': {
                  background: 'rgba(0, 122, 255, 0.08)',
                  color: '#007AFF',
                  '&:hover': {
                    background: 'rgba(0, 122, 255, 0.12)',
                  },
                },
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '1rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {authenticated && (
          <ListItem disablePadding sx={{ mt: 2 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                py: 1.5,
                color: '#ff3b30',
                '&:hover': {
                  background: 'rgba(255, 59, 48, 0.08)',
                },
              }}
            >
              <ListItemText
                primary="Log Out"
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '1rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: scrolled
            ? 'rgba(255, 255, 255, 0.72)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: scrolled
            ? '1px solid rgba(0, 0, 0, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: scrolled
            ? '0 1px 3px rgba(0, 0, 0, 0.05)'
            : 'none',
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {/* Logo */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
            onClick={() => navigate(authenticated ? '/dashboard' : '/')}
          >
            <StorageIcon sx={{ color: '#007AFF', fontSize: 24 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Data Dictionary
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                mx: 4,
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: location.pathname === item.path ? '#007AFF' : '#1d1d1f',
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    background:
                      location.pathname === item.path
                        ? 'rgba(0, 122, 255, 0.08)'
                        : 'transparent',
                    '&:hover': {
                      background:
                        location.pathname === item.path
                          ? 'rgba(0, 122, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {/* Auth Buttons */}
          {!isMobile && (
            <Box display="flex" gap={1.5}>
              {!authenticated ? (
                <>
                  <Button
                    onClick={() => navigate('/login')}
                    sx={{
                      color: '#1d1d1f',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.04)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    variant="contained"
                    sx={{
                      background: '#007AFF',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)',
                      '&:hover': {
                        background: '#0051D5',
                        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.35)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    }}
                  >
                    Sign up
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/settings')}
                    sx={{
                      color: '#1d1d1f',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    Settings
                  </Button>
                  <Button
                    onClick={handleLogout}
                    sx={{
                      color: '#ff3b30',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      px: 2.5,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        background: 'rgba(255, 59, 48, 0.08)',
                      },
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: '#1d1d1f',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            width: 280,
            background: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Spacer */}
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
    </>
  );
};

export default AppleNavbar;
