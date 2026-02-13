import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Fade,
  Zoom
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowForward,
  CheckCircle
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { signupUser, setAuthenticated } from "../utils/auth.ts";

function Signup() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pass: string): number => {
    let strength = 0;
    if (pass.length >= 8) strength += 25;
    if (pass.length >= 12) strength += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pass)) strength += 10;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(password);
  
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return '';
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return theme.palette.error.main;
    if (strength < 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const handleSignup = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      signupUser({ name, email, password });
      setAuthenticated();
      // Instead of going straight to dashboard, we'll show welcome wizard
      localStorage.setItem('showWelcomeWizard', 'true');
      navigate("/dashboard");
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignup();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4
      }}
    >
      {/* Animated background */}
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
        }}
      />

      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <Box textAlign="center" mb={4}>
            <Zoom in timeout={800}>
              <Typography
                variant="h3"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  mb: 1
                }}
              >
                Create Account
              </Typography>
            </Zoom>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              Start documenting your databases with AI
            </Typography>
          </Box>
        </Fade>

        <Zoom in timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              p: 5,
              background: theme.palette.mode === 'dark'
                ? 'rgba(17, 24, 39, 0.8)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Box mb={3}>
              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box mb={2}>
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {password && (
                <Fade in>
                  <Box mt={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Password strength:
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getStrengthColor(passwordStrength),
                          fontWeight: 600
                        }}
                      >
                        {getStrengthLabel(passwordStrength)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      sx={{
                        height: 6,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.common.black, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getStrengthColor(passwordStrength),
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Box>
                </Fade>
              )}
            </Box>

            <Box mb={3}>
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                error={confirmPassword !== '' && password !== confirmPassword}
                helperText={
                  confirmPassword !== '' && password !== confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {confirmPassword !== '' && password === confirmPassword ? (
                        <CheckCircle color="success" />
                      ) : (
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {error && (
              <Fade in>
                <Box
                  mb={3}
                  p={2}
                  sx={{
                    background: alpha(theme.palette.error.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Box>
              </Fade>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSignup}
              disabled={isLoading || !name || !email || !password || !confirmPassword}
              endIcon={<ArrowForward />}
              sx={{
                py: 1.75,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                  boxShadow: '0 6px 24px rgba(102, 126, 234, 0.5)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/login")}
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Log in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
}

export default Signup;
