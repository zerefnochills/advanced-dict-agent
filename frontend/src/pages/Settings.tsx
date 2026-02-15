import React, { useState } from 'react';
import { useThemeMode } from '../context/ThemeContext';

import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

function Settings() {
  /* ✅ GLOBAL THEME MODE */
  const { mode, setMode } = useThemeMode();

  /* Profile */
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    organization: 'Acme Corp',
  });

  /* Preferences (theme REMOVED from here) */
  const [preferences, setPreferences] = useState({
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    exportFormat: 'json',
  });

  /* Notifications */
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    qualityAlerts: true,
    schemaChanges: false,
    weeklyReports: true,
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Settings
      </Typography>

      <Grid container spacing={3}>

        {/* ================= PROFILE ================= */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <PersonIcon color="primary" />
              <Typography variant="h6">Profile Information</Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Button variant="outlined" size="small" startIcon={<EditIcon />}>
                Change Photo
              </Button>
            </Box>

            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />

            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />

            <TextField
              label="Organization"
              fullWidth
              margin="normal"
              value={profile.organization}
              onChange={(e) =>
                setProfile({ ...profile, organization: e.target.value })
              }
            />

            <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 2 }}>
              Save Profile
            </Button>
          </Paper>
        </Grid>

        {/* ================= PREFERENCES ================= */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <PaletteIcon color="primary" />
              <Typography variant="h6">Preferences</Typography>
            </Box>

            {/* ✅ WORKING THEME DROPDOWN */}
            <TextField
              select
              label="Theme"
              fullWidth
              margin="normal"
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as 'light' | 'dark' | 'auto')
              }
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="auto">Auto (System)</MenuItem>
            </TextField>

            <TextField
              select
              label="Language"
              fullWidth
              margin="normal"
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
            </TextField>

            <TextField
              select
              label="Date Format"
              fullWidth
              margin="normal"
              value={preferences.dateFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, dateFormat: e.target.value })
              }
            >
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
            </TextField>

            <TextField
              select
              label="Default Export Format"
              fullWidth
              margin="normal"
              value={preferences.exportFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, exportFormat: e.target.value })
              }
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </TextField>

            <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 2 }}>
              Save Preferences
            </Button>
          </Paper>
        </Grid>

        {/* ================= NOTIFICATIONS ================= */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6">Notifications</Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.emailNotifications}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: e.target.checked,
                    })
                  }
                />
              }
              label="Email Notifications"
            />

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.qualityAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      qualityAlerts: e.target.checked,
                    })
                  }
                />
              }
              label="Data Quality Alerts"
            />

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.schemaChanges}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      schemaChanges: e.target.checked,
                    })
                  }
                />
              }
              label="Schema Change Notifications"
            />

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={notifications.weeklyReports}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      weeklyReports: e.target.checked,
                    })
                  }
                />
              }
              label="Weekly Summary Reports"
            />
          </Paper>
        </Grid>

        {/* ================= SECURITY ================= */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">Security</Typography>
            </Box>

            <TextField label="Current Password" type="password" fullWidth margin="normal" />
            <TextField label="New Password" type="password" fullWidth margin="normal" />
            <TextField label="Confirm New Password" type="password" fullWidth margin="normal" />

            <Button variant="contained" sx={{ mt: 2 }}>
              Change Password
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
