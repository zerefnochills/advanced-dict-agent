import React from "react";
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cable as CableIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

interface Connection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlserver' | 'snowflake';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastConnected?: string;
  tables?: number;
}

interface ConnectionFormData {
  name: string;
  type: string;
  host: string;
  port: string;
  database: string;
  schema?: string;
  username: string;
  password: string;
  warehouse?: string;
  account?: string;
}

const dbTypeConfigs = {
  postgresql: { defaultPort: '5432', needsSchema: false, needsWarehouse: false },
  mysql: { defaultPort: '3306', needsSchema: false, needsWarehouse: false },
  sqlserver: { defaultPort: '1433', needsSchema: false, needsWarehouse: false },
  snowflake: { defaultPort: '', needsSchema: true, needsWarehouse: true },
};

function ConnectionManager() {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      name: 'Production DB',
      type: 'postgresql',
      host: 'prod.example.com',
      port: 5432,
      database: 'production',
      username: 'admin',
      status: 'connected',
      lastConnected: '5 minutes ago',
      tables: 84,
    },
    {
      id: '2',
      name: 'Analytics',
      type: 'snowflake',
      host: 'account.snowflakecomputing.com',
      port: 443,
      database: 'analytics',
      username: 'analyst',
      status: 'connected',
      lastConnected: '1 hour ago',
      tables: 32,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    type: 'postgresql',
    host: '',
    port: '5432',
    database: '',
    schema: '',
    username: '',
    password: '',
    warehouse: '',
    account: '',
  });

  const handleOpenDialog = (connection?: Connection) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        name: connection.name,
        type: connection.type,
        host: connection.host,
        port: connection.port.toString(),
        database: connection.database,
        username: connection.username,
        password: '',
        schema: '',
        warehouse: '',
        account: '',
      });
    } else {
      setEditingConnection(null);
      setFormData({
        name: '',
        type: 'postgresql',
        host: '',
        port: '5432',
        database: '',
        schema: '',
        username: '',
        password: '',
        warehouse: '',
        account: '',
      });
    }
    setTestResult(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConnection(null);
    setTestResult(null);
  };

  const handleTypeChange = (type: string) => {
    const config = dbTypeConfigs[type as keyof typeof dbTypeConfigs];
    setFormData({
      ...formData,
      type,
      port: config.defaultPort,
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResult({
        success,
        message: success
          ? 'Connection successful! All credentials are valid.'
          : 'Connection failed. Please check your credentials.',
      });
      setTesting(false);
    }, 2000);
  };

  const handleSaveConnection = () => {
    const newConnection: Connection = {
      id: editingConnection?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type as Connection['type'],
      host: formData.host,
      port: parseInt(formData.port),
      database: formData.database,
      username: formData.username,
      status: 'disconnected',
      lastConnected: 'Never',
    };

    if (editingConnection) {
      setConnections(connections.map((c) => (c.id === editingConnection.id ? newConnection : c)));
    } else {
      setConnections([...connections, newConnection]);
    }

    handleCloseDialog();
  };

  const handleDeleteConnection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      setConnections(connections.filter((c) => c.id !== id));
    }
  };

  const config = dbTypeConfigs[formData.type as keyof typeof dbTypeConfigs] || dbTypeConfigs.postgresql;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Database Connections
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Connection
        </Button>
      </Box>

      <Grid container spacing={3}>
        {connections.map((connection) => (
          <Grid item xs={12} md={6} lg={4} key={connection.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6">{connection.name}</Typography>
                  </Box>
                  <Chip
                    label={connection.status}
                    size="small"
                    color={connection.status === 'connected' ? 'success' : 'default'}
                    icon={connection.status === 'connected' ? <CheckCircleIcon /> : <ErrorIcon />}
                  />
                </Box>

                <Box mb={2}>
                  <Chip label={connection.type.toUpperCase()} size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Host:</strong> {connection.host}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Database:</strong> {connection.database}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Username:</strong> {connection.username}
                  </Typography>
                  {connection.tables && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Tables:</strong> {connection.tables}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last connected:</strong> {connection.lastConnected}
                  </Typography>
                </Box>

                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CableIcon />}
                    fullWidth
                    onClick={() => alert('Connecting to database...')}
                  >
                    {connection.status === 'connected' ? 'Reconnect' : 'Connect'}
                  </Button>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenDialog(connection)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDeleteConnection(connection.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {connections.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <StorageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No database connections yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Add your first database connection to get started
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add Connection
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Connection Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingConnection ? 'Edit Connection' : 'Add New Connection'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Connection Name"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production DB"
            />

            <TextField
              select
              label="Database Type"
              fullWidth
              margin="normal"
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <MenuItem value="postgresql">PostgreSQL</MenuItem>
              <MenuItem value="mysql">MySQL</MenuItem>
              <MenuItem value="sqlserver">SQL Server</MenuItem>
              <MenuItem value="snowflake">Snowflake</MenuItem>
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  label="Host"
                  fullWidth
                  margin="normal"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder={
                    formData.type === 'snowflake'
                      ? 'account.snowflakecomputing.com'
                      : 'localhost or IP address'
                  }
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Port"
                  fullWidth
                  margin="normal"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  disabled={formData.type === 'snowflake'}
                />
              </Grid>
            </Grid>

            <TextField
              label="Database Name"
              fullWidth
              margin="normal"
              value={formData.database}
              onChange={(e) => setFormData({ ...formData, database: e.target.value })}
            />

            {config.needsSchema && (
              <TextField
                label="Schema"
                fullWidth
                margin="normal"
                value={formData.schema}
                onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
                placeholder="public"
              />
            )}

            {config.needsWarehouse && (
              <>
                <TextField
                  label="Warehouse"
                  fullWidth
                  margin="normal"
                  value={formData.warehouse}
                  onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                  placeholder="COMPUTE_WH"
                />
                <TextField
                  label="Account"
                  fullWidth
                  margin="normal"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  placeholder="your-account-id"
                />
              </>
            )}

            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Box mt={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={handleTestConnection}
                disabled={testing || !formData.host || !formData.database || !formData.username}
                startIcon={testing ? <CircularProgress size={20} /> : <CableIcon />}
              >
                {testing ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </Box>

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                {testResult.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveConnection}
            disabled={!formData.name || !formData.host || !formData.database || !formData.username}
          >
            {editingConnection ? 'Save Changes' : 'Add Connection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ConnectionManager;