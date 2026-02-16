
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeModeProvider } from './context/ThemeContext';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ConnectionManager from "./components/ConnectionManager";
import SchemaExplorer from "./components/SchemaExplorer";
import ChatInterface from "./components/ChatInterface";
import DataQuality from "./pages/DataQuality";
import DictionaryViewer from "./components/DictionaryViewer";
import Settings from "./pages/Settings";
import MainLayout from "./pages/MainLayout";
import { isAuthenticated } from "./utils/auth";



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