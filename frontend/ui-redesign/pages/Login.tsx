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
  Checkbox,
  FormControlLabel,
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
  ArrowForward
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { loginUser, setAuthenticated } from "../utils/auth.ts";

function Login() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      const success = loginUser(email, password);
      if (success) {
        setAuthenticated();
        navigate("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
      }
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
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
        overflow: 'hidden'
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
                Welcome Back
              </Typography>
            </Zoom>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              Log in to continue to your dashboard
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
            <Box mb={4}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Box>

            <Box mb={3}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Link
                component="button"
                variant="body2"
                onClick={() => alert('Password reset feature coming soon!')}
                sx={{ textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
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
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
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
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>

            <Box mt={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/signup")}
                  sx={{
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up for free
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
}

export default Login;
