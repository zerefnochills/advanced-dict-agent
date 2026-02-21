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
  Zoom,
  CircularProgress,
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
import { connectionsAPI, ConnectionResponse, dictionariesAPI, DictionaryListItem } from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [dictionaries, setDictionaries] = useState<DictionaryListItem[]>([]);
  const [connectionTableCounts, setConnectionTableCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const shouldShow = localStorage.getItem('showWelcomeWizard') === 'true';
    if (shouldShow) {
      setTimeout(() => setShowWelcome(true), 500);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [connRes, dictRes] = await Promise.all([
        connectionsAPI.list(),
        dictionariesAPI.list().catch(() => ({ data: [] as DictionaryListItem[] })),
      ]);
      setConnections(connRes.data);
      setDictionaries(dictRes.data);

      // Fetch table counts for each connection
      const tableCounts: Record<string, number> = {};
      await Promise.all(
        connRes.data.map(async (conn) => {
          try {
            const tablesRes = await connectionsAPI.getTables(conn.id);
            tableCounts[conn.id] = tablesRes.data.tables.length;
          } catch {
            tableCounts[conn.id] = 0;
          }
        })
      );
      setConnectionTableCounts(tableCounts);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTables = Object.values(connectionTableCounts).reduce((sum, count) => sum + count, 0);

  const quickActions = [
    { label: 'New Connection', icon: <AddIcon />, path: '/connections' },
    { label: 'Explore Schema', icon: <TableIcon />, path: '/explorer' },
    { label: 'AI Assistant', icon: <CheckCircleIcon />, path: '/chat' },
    { label: 'Data Quality', icon: <WarningIcon />, path: '/quality' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Find the most recent last_tested date across all connections
  const lastSyncDate = connections.reduce((latest, conn) => {
    if (conn.last_tested && (!latest || new Date(conn.last_tested) > new Date(latest))) {
      return conn.last_tested;
    }
    return latest;
  }, '' as string);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

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
                onClick={fetchDashboardData}
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
                value={connections.length}
                icon={<StorageIcon />}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                subtitle="Active connections"
                delay={0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Tables"
                value={totalTables}
                icon={<TableIcon />}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                subtitle="Across all databases"
                delay={100}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Dictionaries"
                value={dictionaries.length}
                icon={<CheckCircleIcon />}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                subtitle="Generated reports"
                delay={200}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Last Sync"
                value={lastSyncDate ? formatDate(lastSyncDate) : 'N/A'}
                icon={<Speed />}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                subtitle="Most recent test"
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
                  {connections.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No connections yet</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/connections')}
                      >
                        Add Connection
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {connections.map((conn, index) => (
                        <Zoom in timeout={1200 + index * 100} key={conn.id}>
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
                              <StorageIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography fontWeight={600}>{conn.name}</Typography>}
                              secondary={
                                <Box display="flex" gap={1} alignItems="center" mt={0.5}>
                                  <Chip label={conn.db_type.toUpperCase()} size="small" variant="outlined" />
                                  <Typography variant="caption">
                                    {connectionTableCounts[conn.id] !== undefined
                                      ? `${connectionTableCounts[conn.id]} tables`
                                      : conn.database_name}
                                  </Typography>
                                </Box>
                              }
                            />
                            <Chip
                              label="connected"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                          </ListItem>
                        </Zoom>
                      ))}
                    </List>
                  )}
                </Paper>
              </Fade>
            </Grid>

            {/* Dictionaries */}
            <Grid item xs={12} md={6}>
              <Fade in timeout={1000}>
                <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>
                    Generated Dictionaries
                  </Typography>
                  {dictionaries.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <TableIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No dictionaries generated yet</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Go to Explorer to generate a data dictionary
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {dictionaries.map((dict, index) => (
                        <Zoom in timeout={1200 + index * 100} key={dict.id}>
                          <ListItem
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 2,
                              mb: 1.5,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateX(4px)',
                                boxShadow: 2
                              }
                            }}
                            onClick={() => navigate(`/explorer`)}
                          >
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography fontWeight={600}>
                                  {dict.database_name}
                                </Typography>
                              }
                              secondary={
                                <Box mt={0.5}>
                                  <Typography variant="caption" display="block" color="primary.main">
                                    {dict.total_tables} tables · {dict.total_columns} columns
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Generated {formatDate(dict.generated_at)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        </Zoom>
                      ))}
                    </List>
                  )}
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
