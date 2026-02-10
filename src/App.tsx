import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeModeProvider } from './context/ThemeContext.tsx';
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";




import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ConnectionManager from "./components/ConnectionManager.tsx";
import SchemaExplorer from "./components/SchemaExplorer.tsx";
import ChatInterface from "./components/ChatInterface.tsx";
import DataQuality from "./pages/DataQuality.tsx";
import DictionaryViewer from "./components/DictionaryViewer.tsx";
import Settings from "./pages/Settings.tsx";
import MainLayout from "./pages/MainLayout.tsx";
import { isAuthenticated } from "./utils/auth.ts";


const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#9fa8f5',
      lighter: '#e8ebfc',
    },
    secondary: {
      main: '#764ba2',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
}


function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ConnectionManager />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/dictionary"
  element={
    <ProtectedRoute>
      <MainLayout>
        <DictionaryViewer />
      </MainLayout>
    </ProtectedRoute>
  }
/>


          <Route
            path="/explorer"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SchemaExplorer />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ChatInterface />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quality"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DataQuality />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeModeProvider>
  );
}


export default App;