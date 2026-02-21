import React, { useEffect } from "react";
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
  Snackbar,
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
import { connectionsAPI, ConnectionResponse, ConnectionCreate } from '../services/api';

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
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });
  const [connectionTables, setConnectionTables] = useState<Record<string, number>>({});

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

  // Fetch connections from the backend on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionsAPI.list();
      setConnections(response.data);
    } catch (error: any) {
      console.error('Failed to fetch connections:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to fetch connections',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (connection?: ConnectionResponse) => {
    if (connection) {
      setEditingConnection(connection);
      setFormData({
        name: connection.name,
        type: connection.db_type,
        host: connection.host || '',
        port: connection.port?.toString() || '',
        database: connection.database_name,
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

  const buildConnectionPayload = (): ConnectionCreate => {
    const payload: ConnectionCreate = {
      name: formData.name,
      db_type: formData.type as ConnectionCreate['db_type'],
      host: formData.host || undefined,
      port: formData.port ? parseInt(formData.port) : undefined,
      database_name: formData.database,
      username: formData.username,
      password: formData.password,
    };

    if (formData.type === 'snowflake') {
      payload.config = {
        warehouse: formData.warehouse,
        schema: formData.schema || 'PUBLIC',
      };
    }

    return payload;
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const payload = buildConnectionPayload();
      const response = await connectionsAPI.test(payload);
      setTestResult({
        success: response.data.success,
        message: response.data.message,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.detail || 'Connection test failed. Please check your credentials.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    try {
      const payload = buildConnectionPayload();
      await connectionsAPI.create(payload);
      setSnackbar({
        open: true,
        message: 'Connection created successfully!',
        severity: 'success',
      });
      handleCloseDialog();
      fetchConnections(); // Refresh the list
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save connection',
        severity: 'error',
      });
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      try {
        await connectionsAPI.delete(id);
        setSnackbar({
          open: true,
          message: 'Connection deleted successfully',
          severity: 'success',
        });
        fetchConnections(); // Refresh the list
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.detail || 'Failed to delete connection',
          severity: 'error',
        });
      }
    }
  };

  const handleConnect = async (connection: ConnectionResponse) => {
    setConnecting(connection.id);
    try {
      const response = await connectionsAPI.getTables(connection.id);
      const tableCount = response.data.tables.length;
      setConnectionTables((prev) => ({ ...prev, [connection.id]: tableCount }));
      setSnackbar({
        open: true,
        message: `Connected! Found ${tableCount} table(s) in ${connection.database_name}.`,
        severity: 'success',
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to connect to database',
        severity: 'error',
      });
    } finally {
      setConnecting(null);
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={8}>
          <CircularProgress />
        </Box>
      ) : (
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
                      label={connectionTables[connection.id] !== undefined ? 'connected' : 'disconnected'}
                      size="small"
                      color={connectionTables[connection.id] !== undefined ? 'success' : 'default'}
                      icon={connectionTables[connection.id] !== undefined ? <CheckCircleIcon /> : <ErrorIcon />}
                    />
                  </Box>

                  <Box mb={2}>
                    <Chip label={connection.db_type.toUpperCase()} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Host:</strong> {connection.host || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Database:</strong> {connection.database_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Username:</strong> {connection.username}
                    </Typography>
                    {connectionTables[connection.id] !== undefined && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Tables:</strong> {connectionTables[connection.id]}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Last connected:</strong>{' '}
                      {connection.last_tested
                        ? new Date(connection.last_tested).toLocaleString()
                        : 'Never'}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        connecting === connection.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <CableIcon />
                        )
                      }
                      fullWidth
                      disabled={connecting === connection.id}
                      onClick={() => handleConnect(connection)}
                    >
                      {connecting === connection.id
                        ? 'Connecting...'
                        : connectionTables[connection.id] !== undefined
                          ? 'Reconnect'
                          : 'Connect'}
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
      )}

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
                disabled={testing || !formData.host || !formData.database || !formData.username || !formData.password}
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
            disabled={!formData.name || !formData.host || !formData.database || !formData.username || !formData.password}
          >
            {editingConnection ? 'Save Changes' : 'Add Connection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ConnectionManager;