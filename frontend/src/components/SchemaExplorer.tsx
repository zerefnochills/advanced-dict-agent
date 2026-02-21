import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Button,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  TableChart as TableIcon,
  Key as KeyIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { connectionsAPI, dictionariesAPI, ConnectionResponse, DictionaryResponse } from '../services/api';

interface ColumnMeta {
  name: string;
  data_type: string;
  nullable: boolean;
  default_value?: string;
}

interface ForeignKey {
  column: string;
  references_table: string;
  references_column: string;
}

interface TableMeta {
  columns: ColumnMeta[];
  primary_keys: string[];
  foreign_keys: ForeignKey[];
  row_count?: number;
}

interface SchemaMetadata {
  tables: Record<string, TableMeta>;
  total_tables: number;
}

function SchemaExplorer() {
  const [connections, setConnections] = useState<ConnectionResponse[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Dictionary data (full metadata from generated dictionary)
  const [dictionaryData, setDictionaryData] = useState<DictionaryResponse | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await connectionsAPI.list();
      setConnections(res.data);
      if (res.data.length > 0) {
        setSelectedConnectionId(res.data[0].id);
        await loadConnectionSchema(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionSchema = async (connectionId: string) => {
    setLoadingSchema(true);
    setDictionaryData(null);
    setQualityMetrics(null);
    setSelectedTableName('');
    try {
      // First, get table names from the connection
      const tablesRes = await connectionsAPI.getTables(connectionId);
      setTableNames(tablesRes.data.tables);

      if (tablesRes.data.tables.length > 0) {
        setSelectedTableName(tablesRes.data.tables[0]);
      }

      // Try to find an existing dictionary for this connection
      try {
        const dictsRes = await dictionariesAPI.list();
        const dict = dictsRes.data.find((d) => d.connection_id === connectionId);
        if (dict) {
          const fullDict = await dictionariesAPI.get(dict.id);
          setDictionaryData(fullDict.data);
          if (fullDict.data.quality_metrics) {
            setQualityMetrics(fullDict.data.quality_metrics as Record<string, any>);
          }
        }
      } catch {
        // No dictionary yet, that's fine
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
      setSnackbar({ open: true, message: 'Failed to load schema', severity: 'error' });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleConnectionChange = async (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    await loadConnectionSchema(connectionId);
  };

  const handleRefresh = async () => {
    if (selectedConnectionId) {
      await loadConnectionSchema(selectedConnectionId);
      setSnackbar({ open: true, message: 'Schema refreshed', severity: 'success' });
    }
  };

  const handleGenerateDictionary = async () => {
    if (!selectedConnectionId) return;
    setLoadingSchema(true);
    try {
      await dictionariesAPI.generate({
        connection_id: selectedConnectionId,
        include_ai_descriptions: true,
        include_quality_analysis: true,
      });
      await loadConnectionSchema(selectedConnectionId);
      setSnackbar({ open: true, message: 'Dictionary generated successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Dictionary generation failed: ${error.response?.data?.detail || error.message}`,
        severity: 'error',
      });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleExportJson = async () => {
    if (!dictionaryData) return;
    try {
      const res = await dictionariesAPI.exportJson(dictionaryData.id);
      const blob = new Blob([res.data as any], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dictionaryData.database_name}_dictionary.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const getTableMeta = (): TableMeta | null => {
    if (!dictionaryData?.metadata || !selectedTableName) return null;
    const meta = dictionaryData.metadata as unknown as SchemaMetadata;
    return meta.tables?.[selectedTableName] || null;
  };

  const getTableQuality = (): any => {
    if (!qualityMetrics || !selectedTableName) return null;
    return qualityMetrics[selectedTableName] || null;
  };

  const filteredTableNames = tableNames.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableMeta = getTableMeta();
  const tableQuality = getTableQuality();
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (connections.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <StorageIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No database connections
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Add a database connection first to explore its schema.
        </Typography>
        <Button variant="contained" href="/connections">
          Go to Connections
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Schema Explorer
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Connection</InputLabel>
            <Select
              value={selectedConnectionId}
              label="Connection"
              onChange={(e) => handleConnectionChange(e.target.value)}
            >
              {connections.map((conn) => (
                <MenuItem key={conn.id} value={conn.id}>
                  {conn.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            Refresh
          </Button>
          {!dictionaryData && (
            <Button
              variant="contained"
              onClick={handleGenerateDictionary}
              disabled={loadingSchema}
            >
              Generate Dictionary
            </Button>
          )}
          {dictionaryData && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportJson}>
              Export
            </Button>
          )}
        </Box>
      </Box>

      {loadingSchema ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <Box textAlign="center">
            <CircularProgress size={48} />
            <Typography color="text.secondary" mt={2}>
              Loading schema...
            </Typography>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left Sidebar - Table List */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {selectedConnection?.database_name || 'Tables'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {tableNames.length} tables
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {filteredTableNames.map((tableName) => {
                const meta = dictionaryData?.metadata
                  ? (dictionaryData.metadata as unknown as SchemaMetadata).tables?.[tableName]
                  : null;
                return (
                  <Box
                    key={tableName}
                    onClick={() => {
                      setSelectedTableName(tableName);
                      setActiveTab(0);
                    }}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      cursor: 'pointer',
                      bgcolor: selectedTableName === tableName ? 'primary.lighter' : 'transparent',
                      border: 1,
                      borderColor: selectedTableName === tableName ? 'primary.main' : 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <TableIcon
                        fontSize="small"
                        color={selectedTableName === tableName ? 'primary' : 'action'}
                      />
                      <Box flex={1}>
                        <Typography
                          variant="body2"
                          fontWeight={selectedTableName === tableName ? 'bold' : 'normal'}
                        >
                          {tableName}
                        </Typography>
                        {meta?.row_count !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            {meta.row_count.toLocaleString()} rows
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}

              {filteredTableNames.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
                  No tables found
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right Content - Table Details */}
          <Grid item xs={12} md={9}>
            {selectedTableName && tableMeta ? (
              <Paper>
                <Box p={3} borderBottom={1} borderColor="divider">
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {selectedTableName}
                      </Typography>
                      <Box display="flex" gap={1} mb={2}>
                        {tableMeta.row_count !== undefined && (
                          <Chip
                            label={`${tableMeta.row_count.toLocaleString()} rows`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={`${tableMeta.columns.length} columns`}
                          size="small"
                          variant="outlined"
                        />
                        {tableMeta.primary_keys.length > 0 && (
                          <Chip
                            label={`${tableMeta.primary_keys.length} PK`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {tableMeta.foreign_keys.length > 0 && (
                          <Chip
                            label={`${tableMeta.foreign_keys.length} FK`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Columns" />
                  <Tab label="Data Quality" />
                  <Tab label="Relationships" />
                </Tabs>

                <Box p={3}>
                  {/* Columns Tab */}
                  {activeTab === 0 && (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Column Name</TableCell>
                            <TableCell>Data Type</TableCell>
                            <TableCell>Nullable</TableCell>
                            <TableCell>Default</TableCell>
                            <TableCell>Constraints</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableMeta.columns.map((column) => {
                            const isPK = tableMeta.primary_keys.includes(column.name);
                            const fk = tableMeta.foreign_keys.find((f) => f.column === column.name);
                            return (
                              <TableRow key={column.name}>
                                <TableCell>
                                  <Typography fontWeight={isPK ? 'bold' : 'normal'}>
                                    {column.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={column.data_type} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={column.nullable ? 'Yes' : 'No'}
                                    size="small"
                                    color={column.nullable ? 'default' : 'success'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {column.default_value || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" gap={0.5}>
                                    {isPK && (
                                      <Tooltip title="Primary Key">
                                        <Chip icon={<KeyIcon />} label="PK" size="small" color="primary" />
                                      </Tooltip>
                                    )}
                                    {fk && (
                                      <Tooltip title={`FK → ${fk.references_table}.${fk.references_column}`}>
                                        <Chip icon={<LinkIcon />} label="FK" size="small" color="secondary" />
                                      </Tooltip>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Data Quality Tab */}
                  {activeTab === 1 && (
                    <Box>
                      {tableQuality ? (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Data Quality Metrics
                          </Typography>
                          <Grid container spacing={3} mt={1}>
                            {tableQuality.overall_quality_score !== undefined && (
                              <Grid item xs={12} md={4}>
                                <Card>
                                  <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                      Quality Score
                                    </Typography>
                                    <Typography variant="h4">
                                      {tableQuality.overall_quality_score}%
                                    </Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={tableQuality.overall_quality_score}
                                      sx={{ mt: 2 }}
                                    />
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {tableQuality.completeness !== undefined && (
                              <Grid item xs={12} md={4}>
                                <Card>
                                  <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                      Completeness
                                    </Typography>
                                    <Typography variant="h4">
                                      {typeof tableQuality.completeness === 'number'
                                        ? `${tableQuality.completeness}%`
                                        : tableQuality.completeness}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            {tableQuality.total_rows !== undefined && (
                              <Grid item xs={12} md={4}>
                                <Card>
                                  <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                      Total Rows
                                    </Typography>
                                    <Typography variant="h4">
                                      {tableQuality.total_rows.toLocaleString()}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                          </Grid>

                          {/* Column-level quality */}
                          {tableQuality.column_metrics && (
                            <Box mt={4}>
                              <Typography variant="h6" gutterBottom>
                                Column-Level Quality
                              </Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Column</TableCell>
                                      <TableCell>Null Count</TableCell>
                                      <TableCell>Null %</TableCell>
                                      <TableCell>Distinct Values</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {Object.entries(tableQuality.column_metrics).map(
                                      ([colName, metrics]: [string, any]) => (
                                        <TableRow key={colName}>
                                          <TableCell>{colName}</TableCell>
                                          <TableCell>{metrics.null_count ?? '-'}</TableCell>
                                          <TableCell>
                                            {metrics.null_percentage !== undefined
                                              ? `${metrics.null_percentage.toFixed(1)}%`
                                              : '-'}
                                          </TableCell>
                                          <TableCell>{metrics.distinct_count ?? '-'}</TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box textAlign="center" py={4}>
                          <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography color="text.secondary" gutterBottom>
                            No quality metrics available
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Generate a dictionary with quality analysis enabled to see metrics.
                          </Typography>
                          <Button variant="outlined" onClick={handleGenerateDictionary}>
                            Generate Dictionary
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Relationships Tab */}
                  {activeTab === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Table Relationships
                      </Typography>
                      <Box mt={2}>
                        {tableMeta.foreign_keys.length > 0 ? (
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Column</TableCell>
                                  <TableCell>References</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {tableMeta.foreign_keys.map((fk, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Chip label="Foreign Key" size="small" color="secondary" />
                                    </TableCell>
                                    <TableCell>{fk.column}</TableCell>
                                    <TableCell>
                                      {fk.references_table}.{fk.references_column}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Box textAlign="center" py={4}>
                            <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                              No foreign key relationships for this table
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            ) : selectedTableName && !tableMeta ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No metadata available for "{selectedTableName}"
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Generate a dictionary to see column details, relationships, and quality metrics.
                </Typography>
                <Button variant="contained" onClick={handleGenerateDictionary}>
                  Generate Dictionary
                </Button>
              </Paper>
            ) : (
              <Paper sx={{ p: 8, textAlign: 'center' }}>
                <TableIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a table to view details
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SchemaExplorer;