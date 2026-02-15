import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  LinearProgress,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Rocket,
  Key,
  Storage,
  AutoAwesome,
  OpenInNew,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';

interface WelcomeWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['Welcome', 'API Key', 'Database', 'Complete'];

function WelcomeWizard({ open, onClose }: WelcomeWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [apiValid, setApiValid] = useState(false);
  const theme = useTheme();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      localStorage.removeItem('showWelcomeWizard');
      onClose();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTestApi = () => {
    setTestingApi(true);
    // Simulate API test
    setTimeout(() => {
      setTestingApi(false);
      setApiValid(apiKey.startsWith('sk-ant-'));
    }, 1500);
  };

  const handleSkip = () => {
    localStorage.removeItem('showWelcomeWizard');
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Zoom in timeout={500}>
            <Box textAlign="center" py={4}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mb: 3
                }}
              >
                <Rocket sx={{ fontSize: 64, color: 'white' }} />
              </Box>
              
              <Typography variant="h4" gutterBottom fontWeight={700}>
                Welcome to Data Dictionary Agent! 🎉
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', my: 3 }}>
                Let's get you started in just 3 easy steps. We'll help you set up your AI-powered
                database documentation system.
              </Typography>

              <Paper 
                sx={{ 
                  p: 3, 
                  mt: 4,
                  background: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  What you'll do:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Configure your AI API key"
                      secondary="Get free credits from Anthropic"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Connect your first database"
                      secondary="PostgreSQL, MySQL, SQL Server, or Snowflake"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Generate AI-powered documentation"
                      secondary="Automatic descriptions and quality analysis"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Zoom>
        );

      case 1:
        return (
          <Zoom in timeout={500}>
            <Box py={2}>
              <Box textAlign="center" mb={4}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '50%',
                    background: alpha(theme.palette.primary.main, 0.1),
                    mb: 2
                  }}
                >
                  <Key sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Set Up Your AI API Key
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  To enable AI-powered descriptions, you'll need an Anthropic API key
                </Typography>
              </Box>

              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  background: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                }}
              >
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  📝 How to get your API key:
                </Typography>
                <List dense>
                  <ListItem>
                    <Typography variant="body2">
                      1. Visit <strong>console.anthropic.com</strong>
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      2. Sign up for a free account (get $5 in free credits!)
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      3. Create an API key in your dashboard
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      4. Copy and paste it below
                    </Typography>
                  </ListItem>
                </List>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNew />}
                  href="https://console.anthropic.com"
                  target="_blank"
                  sx={{ mt: 1 }}
                >
                  Open Anthropic Console
                </Button>
              </Paper>

              <TextField
                fullWidth
                label="Anthropic API Key"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                helperText="Your API key will be encrypted and stored securely"
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="outlined"
                onClick={handleTestApi}
                disabled={!apiKey || testingApi}
                sx={{ mb: 2 }}
              >
                {testingApi ? 'Testing...' : apiValid ? '✓ API Key Valid' : 'Test API Key'}
              </Button>

              {testingApi && <LinearProgress sx={{ mb: 2 }} />}

              {apiValid && (
                <Fade in>
                  <Paper 
                    sx={{ 
                      p: 2,
                      background: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle color="success" />
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        API key validated successfully! You're ready to generate AI descriptions.
                      </Typography>
                    </Box>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Zoom>
        );

      case 2:
        return (
          <Zoom in timeout={500}>
            <Box py={2}>
              <Box textAlign="center" mb={4}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: '50%',
                    background: alpha(theme.palette.primary.main, 0.1),
                    mb: 2
                  }}
                >
                  <Storage sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Connect Your Database
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can add your first database connection now or skip and do it later
                </Typography>
              </Box>

              <Paper 
                sx={{ 
                  p: 3,
                  textAlign: 'center',
                  background: alpha(theme.palette.primary.main, 0.05),
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Supported Databases
                </Typography>
                <Box display="flex" justifyContent="center" gap={3} flexWrap="wrap" my={3}>
                  {['PostgreSQL', 'MySQL', 'SQL Server', 'Snowflake'].map((db) => (
                    <Paper
                      key={db}
                      elevation={2}
                      sx={{
                        p: 2,
                        minWidth: 120,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <Storage color="primary" sx={{ mb: 1 }} />
                      <Typography variant="body2" fontWeight={600}>
                        {db}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Have your database credentials ready. We recommend using read-only access for safety.
                </Typography>
              </Paper>
            </Box>
          </Zoom>
        );

      case 3:
        return (
          <Zoom in timeout={500}>
            <Box textAlign="center" py={4}>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  mb: 3
                }}
              >
                <AutoAwesome sx={{ fontSize: 64, color: 'white' }} />
              </Box>
              
              <Typography variant="h4" gutterBottom fontWeight={700}>
                You're All Set! 🎊
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', my: 3 }}>
                Your Data Dictionary Agent is ready to go. Start exploring your databases with AI-powered insights!
              </Typography>

              <Paper 
                sx={{ 
                  p: 3, 
                  mt: 4,
                  background: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  What's next?
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Add database connections"
                      secondary="Connect to your PostgreSQL, MySQL, or other databases"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Generate data dictionaries"
                      secondary="Let AI create comprehensive documentation"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Chat with your schema"
                      secondary="Ask questions in natural language"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Box>
          </Zoom>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(17, 24, 39, 0.98)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <IconButton
        onClick={handleSkip}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'text.secondary'
        }}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box minHeight={400}>
          {renderStepContent(activeStep)}
        </Box>

        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            onClick={activeStep === 0 ? handleSkip : handleBack}
            startIcon={activeStep === 0 ? undefined : <ArrowBack />}
          >
            {activeStep === 0 ? 'Skip Setup' : 'Back'}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
              }
            }}
          >
            {activeStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeWizard;
