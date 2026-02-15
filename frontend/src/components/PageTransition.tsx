import React, { ReactNode } from 'react';
import { Box, Fade, Slide } from '@mui/material';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <Fade in timeout={400} key={location.pathname}>
      <Box
        sx={{
          minHeight: '100vh',
          animation: 'slideUp 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
          '@keyframes slideUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {children}
      </Box>
    </Fade>
  );
};

export default PageTransition;
