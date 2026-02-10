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
import { signupUser, setAuthenticated } from "../utils/auth.ts";
import { useState } from "react";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    signupUser({ name, email, password });
    setAuthenticated();
    navigate("/dashboard");
  };

  return (
    <Container maxWidth="sm">
      <Box mt={10}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5">Create Account</Typography>

          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSignup}
          >
            Sign Up
          </Button>

          <Box mt={2} textAlign="center">
            <Typography variant="body2">
              Already a user?{" "}
              <Link component="button" onClick={() => navigate("/login")}>
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Signup;
