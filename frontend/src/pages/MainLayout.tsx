import React from 'react';
import { Box, useTheme } from '@mui/material';
import AppleNavbar from '../components/AppleNavbar';
import FloatingAIChatbot from '../components/FloatingAIChatbot';
import PageTransition from '../components/PageTransition';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <AppleNavbar />
      <PageTransition>
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      </PageTransition>
      <FloatingAIChatbot />
    </Box>
  );
}

export default MainLayout;