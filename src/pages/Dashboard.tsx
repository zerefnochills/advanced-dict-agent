import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  TableChart as TableIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: JSX.Element;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
              p: 1.5,
              borderRadius: 2,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const navigate = useNavigate();

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => alert('Refreshing data...')}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/connections')}
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
            color="primary"
            subtitle="Active connections"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tables"
            value={stats.tables}
            icon={<TableIcon />}
            color="info"
            subtitle="Across all databases"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Data Quality Score"
            value={`${stats.quality}%`}
            icon={<CheckCircleIcon />}
            color="success"
            subtitle="Overall health"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Last Sync"
            value={stats.lastSync}
            icon={<RefreshIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Database Connections */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Database Connections
              </Typography>
              <Button size="small" onClick={() => navigate('/connections')}>
                View All
              </Button>
            </Box>
            <List>
              {connections.map((conn) => (
                <ListItem
                  key={conn.name}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    <StorageIcon color={conn.status === 'connected' ? 'primary' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={conn.name}
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
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity) => (
                <ListItem
                  key={activity.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
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
                    primary={activity.action}
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="caption" display="block">
                          {activity.database}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2 }}
                  onClick={() => navigate('/connections')}
                >
                  <Box textAlign="center">
                    <AddIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography>Add Connection</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2 }}
                  onClick={() => navigate('/explorer')}
                >
                  <Box textAlign="center">
                    <TableIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography>Explore Schema</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2 }}
                  onClick={() => navigate('/chat')}
                >
                  <Box textAlign="center">
                    <CheckCircleIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography>Ask AI Assistant</Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ py: 2 }}
                  onClick={() => navigate('/quality')}
                >
                  <Box textAlign="center">
                    <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography>Check Quality</Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;