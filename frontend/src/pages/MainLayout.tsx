import React from 'react';
import { Box } from '@mui/material';
import AppleNavbar from '../components/AppleNavbar.tsx';
import FloatingAIChatbot from '../components/FloatingAIChatbot.tsx';
import PageTransition from '../components/PageTransition.tsx';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
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