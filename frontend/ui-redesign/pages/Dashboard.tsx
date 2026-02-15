import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
  alpha,
  Fade,
  Zoom
} from '@mui/material';
import {
  Storage as StorageIcon,
  TableChart as TableIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  Speed
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WelcomeWizard from '../components/WelcomeWizard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: JSX.Element;
  gradient: string;
  subtitle?: string;
  trend?: string;
  delay?: number;
}

function StatCard({ title, value, icon, gradient, subtitle, trend, delay = 0 }: StatCardProps) {
  return (
    <Zoom in timeout={600 + delay}>
      <Card 
        sx={{ 
          height: '100%',
          background: gradient,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            opacity: 0.2,
            fontSize: 120
          }}
        >
          {icon}
        </Box>
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: 700 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <TrendingUp sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Zoom>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if this is a first-time user
    const shouldShow = localStorage.getItem('showWelcomeWizard') === 'true';
    if (shouldShow) {
      setTimeout(() => setShowWelcome(true), 500);
    }
  }, []);

  // Mock data - replace with real data from backend
  const stats = {
    databases: 3,
    tables: 127,
    lastSync: '2 hours ago',
    quality: 87,
  };

  const recentActivity = [
    { id: 1, action: 'Dictionary generated', database: 'production_db', time: '10 minutes ago', status: 'success' },
    { id: 2, action: 'Connection added', database: 'analytics_db', time: '1 hour ago', status: 'success' },
    { id: 3, action: 'Quality check completed', database: 'staging_db', time: '2 hours ago', status: 'warning' },
    { id: 4, action: 'Schema extracted', database: 'production_db', time: '3 hours ago', status: 'success' },
  ];

  const connections = [
    { name: 'production_db', type: 'PostgreSQL', status: 'connected', tables: 84 },
    { name: 'analytics_db', type: 'Snowflake', status: 'connected', tables: 32 },
    { name: 'staging_db', type: 'MySQL', status: 'disconnected', tables: 11 },
  ];

  const quickActions = [
    { label: 'New Connection', icon: <AddIcon />, path: '/connections' },
    { label: 'Explore Schema', icon: <TableIcon />, path: '/explorer' },
    { label: 'AI Assistant', icon: <CheckCircleIcon />, path: '/chat' },
    { label: 'Data Quality', icon: <WarningIcon />, path: '/quality' },
  ];

  return (
    <Box>
      <Fade in timeout={400}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Welcome Back! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Here's what's happening with your databases
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => alert('Refreshing data...')}
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/connections')}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                  }
                }}
              >
                New Connection
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Connected Databases"
                value={stats.databases}
                icon={<StorageIcon />}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                subtitle="Active connections"
                trend="+1 this week"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Tables"
                value={stats.tables}
                icon={<TableIcon />}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                subtitle="Across all databases"
                trend="+12 this month"
                delay={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Quality Score"
                value={`${stats.quality}%`}
                icon={<CheckCircleIcon />}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                subtitle="Overall health"
                trend="+3% this week"
                delay={200}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Last Sync"
                value={stats.lastSync}
                icon={<Speed />}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                subtitle="All systems"
                delay={300}
              />
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Fade in timeout={800}>
            <Paper 
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 3,
                background: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 3,
                        borderRadius: 2,
                        borderWidth: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                    >
                      <Box textAlign="center">
                        <Box sx={{ fontSize: 40, mb: 1, color: 'primary.main' }}>
                          {action.icon}
                        </Box>
                        <Typography fontWeight={600}>
                          {action.label}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>

          <Grid container spacing={3}>
            {/* Database Connections */}
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={700}>
                      Database Connections
                    </Typography>
                    <Button size="small" onClick={() => navigate('/connections')}>
                      View All
                    </Button>
                  </Box>
                  <List>
                    {connections.map((conn, index) => (
                      <Zoom in timeout={1200 + index * 100} key={conn.name}>
                        <ListItem
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1.5,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'translateX(4px)',
                              boxShadow: 2
                            }
                          }}
                        >
                          <ListItemIcon>
                            <StorageIcon color={conn.status === 'connected' ? 'primary' : 'disabled'} />
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography fontWeight={600}>{conn.name}</Typography>}
                            secondary={
                              <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                                <Chip label={conn.type} size="small" variant="outlined" />
                                <Typography variant="caption">
                                  {conn.tables} tables
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={conn.status}
                            size="small"
                            color={conn.status === 'connected' ? 'success' : 'error'}
                            sx={{ fontWeight: 600 }}
                          />
                        </ListItem>
                      </Zoom>
                    ))}
                  </List>
                </Paper>
              </Fade>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>
                    Recent Activity
                  </Typography>
                  <List>
                    {recentActivity.map((activity, index) => (
                      <Zoom in timeout={1200 + index * 100} key={activity.id}>
                        <ListItem
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1.5,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'translateX(4px)',
                              boxShadow: 2
                            }
                          }}
                        >
                          <ListItemIcon>
                            {activity.status === 'success' ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <WarningIcon color="warning" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={<Typography fontWeight={600}>{activity.action}</Typography>}
                            secondary={
                              <Box mt={0.5}>
                                <Typography variant="caption" display="block" color="primary.main">
                                  {activity.database}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.time}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </Zoom>
                    ))}
                  </List>
                </Paper>
              </Fade>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Welcome Wizard */}
      <WelcomeWizard
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
      />
    </Box>
  );
}

export default Dashboard;
