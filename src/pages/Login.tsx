import React from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loginUser, setAuthenticated } from "../utils/auth.ts";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const success = loginUser(email, password);
    if (success) {
      setAuthenticated();
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={10}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5">Login</Typography>

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLogin}
          >
            Login
          </Button>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              New user?{" "}
              <Link component="button" onClick={() => navigate("/signup")}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
