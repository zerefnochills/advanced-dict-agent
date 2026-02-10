import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Intelligent Data Dictionary Agent
          </Typography>
          <Button color="inherit" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button color="inherit" onClick={() => navigate("/signup")}>
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Box mt={10} textAlign="center">
          <Typography variant="h3" gutterBottom>
            AI-Powered Database Documentation
          </Typography>

          <Typography variant="h6" color="text.secondary" paragraph>
            Automatically generate data dictionaries, analyze data quality,
            and query your database using natural language.
          </Typography>

          <Box mt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
}

export default Home;
