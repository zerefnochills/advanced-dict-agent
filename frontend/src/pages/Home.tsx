import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Fade,
  Zoom
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AutoAwesome,
  Storage,
  Assessment,
  Chat,
  Speed,
  Security,
  CloudSync
} from "@mui/icons-material";
import FloatingAIChatbot from "../components/FloatingAIChatbot.tsx";


const features = [
  {
    icon: <Storage sx={{ fontSize: 48 }} />,
    title: "Multi-Database Support",
    description: "Connect to PostgreSQL, MySQL, SQL Server, and Snowflake databases seamlessly"
  },
  {
    icon: <AutoAwesome sx={{ fontSize: 48 }} />,
    title: "AI-Powered Insights",
    description: "Automatically generate business-friendly documentation using advanced AI"
  },
  {
    icon: <Assessment sx={{ fontSize: 48 }} />,
    title: "Data Quality Analysis",
    description: "Identify issues, track metrics, and improve data quality across your organization"
  },
  {
    icon: <Chat sx={{ fontSize: 48 }} />,
    title: "Natural Language Chat",
    description: "Ask questions about your schema in plain English and get instant answers"
  },
  {
    icon: <Speed sx={{ fontSize: 48 }} />,
    title: "Lightning Fast",
    description: "Generate comprehensive documentation in minutes, not hours"
  },
  {
    icon: <Security sx={{ fontSize: 48 }} />,
    title: "Enterprise Security",
    description: "Bank-level encryption and security for all your database credentials"
  }
];

function Home() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'float 20s infinite linear',
          '@keyframes float': {
            '0%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(-50px)' }
          }
        }}
      />

      {/* Navigation */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
        }}
      >
        <Toolbar>
          <Box display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1 }}>
            <Storage sx={{ color: 'white' }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Data Dictionary Agent
            </Typography>
          </Box>
          <Button
            sx={{ color: 'white', mr: 2 }}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/signup")}
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Box
            mt={12}
            mb={10}
            textAlign="center"
            sx={{ position: 'relative', zIndex: 1 }}
          >
            <Zoom in timeout={1200}>
              <Typography
                variant="h2"
                gutterBottom
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                AI-Powered Database
                <br />
                Documentation
              </Typography>
            </Zoom>

            <Fade in timeout={1500}>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 5,
                  maxWidth: '800px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  fontWeight: 400
                }}
              >
                Automatically generate data dictionaries, analyze data quality,
                and query your database using natural language.
              </Typography>
            </Fade>

            <Fade in timeout={1800}>
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/signup")}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    background: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.95)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: 'white',
                      borderWidth: 2,
                      background: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Watch Demo
                </Button>
              </Box>
            </Fade>
          </Box>
        </Fade>

        {/* Features Grid */}
        <Box mb={10}>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Zoom in timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                        background: 'rgba(255, 255, 255, 0.15)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Box
                        sx={{
                          color: 'white',
                          mb: 2,
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: 'white', fontWeight: 700 }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Fade in timeout={2000}>
          <Box
            textAlign="center"
            py={8}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              mb: 6
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Ready to get started?
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 4 }}
            >
              Join hundreds of teams documenting their data with AI
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/signup")}
              sx={{
                px: 6,
                py: 2.5,
                fontSize: '1.2rem',
                background: 'white',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Start Free Trial
            </Button>
          </Box>
        </Fade>
      </Container>
      <FloatingAIChatbot />
    </Box>
  );
}

export default Home;

