import React from "react";
import { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  TableChart as TableIcon,
  Key as KeyIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
}

interface Table {
  name: string;
  schema: string;
  rowCount: number;
  description?: string;
  columns: Column[];
}

interface Database {
  name: string;
  tables: Table[];
}

// Mock data
const mockDatabases: Database[] = [
  {
    name: 'production_db',
    tables: [
      {
        name: 'customers',
        schema: 'public',
        rowCount: 15000,
        description: 'Stores customer information including contact details and account status.',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: 'email', type: 'VARCHAR(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'name', type: 'VARCHAR(100)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false, defaultValue: 'NOW()' },
        ],
      },
      {
        name: 'orders',
        schema: 'public',
        rowCount: 45000,
        description: 'Contains order transaction records with customer relationships.',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: 'customer_id', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: true },
          { name: 'total', type: 'DECIMAL(10,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'status', type: 'VARCHAR(50)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'order_date', type: 'TIMESTAMP', nullable: false, isPrimaryKey: false, isForeignKey: false },
        ],
      },
      {
        name: 'products',
        schema: 'public',
        rowCount: 2500,
        description: 'Product catalog with pricing and inventory information.',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true, isForeignKey: false },
          { name: 'name', type: 'VARCHAR(200)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'price', type: 'DECIMAL(10,2)', nullable: false, isPrimaryKey: false, isForeignKey: false },
          { name: 'stock', type: 'INTEGER', nullable: false, isPrimaryKey: false, isForeignKey: false },
        ],
      },
    ],
  },
];

function SchemaExplorer() {
  const [selectedDb, setSelectedDb] = useState(mockDatabases[0]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(mockDatabases[0].tables[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredTables = selectedDb.tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setActiveTab(0);
  };

  const handleExport = (format: 'json' | 'markdown') => {
    alert(`Exporting ${selectedTable?.name} as ${format.toUpperCase()}...`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Schema Explorer
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />}>
            Refresh Schema
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            Export All
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Sidebar - Table List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {selectedDb.name}
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

            {filteredTables.map((table) => (
              <Box
                key={table.name}
                onClick={() => handleTableSelect(table)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: selectedTable?.name === table.name ? 'primary.lighter' : 'transparent',
                  border: 1,
                  borderColor: selectedTable?.name === table.name ? 'primary.main' : 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <TableIcon fontSize="small" color={selectedTable?.name === table.name ? 'primary' : 'action'} />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={selectedTable?.name === table.name ? 'bold' : 'normal'}>
                      {table.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {table.rowCount.toLocaleString()} rows
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}

            {filteredTables.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>
                No tables found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Right Content - Table Details */}
        <Grid item xs={12} md={9}>
          {selectedTable ? (
            <Paper>
              <Box p={3} borderBottom={1} borderColor="divider">
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {selectedTable.name}
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <Chip label={selectedTable.schema} size="small" />
                      <Chip label={`${selectedTable.rowCount.toLocaleString()} rows`} size="small" variant="outlined" />
                      <Chip label={`${selectedTable.columns.length} columns`} size="small" variant="outlined" />
                    </Box>
                    {selectedTable.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
                        {selectedTable.description}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Export as JSON">
                      <IconButton onClick={() => handleExport('json')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export as Markdown">
                      <IconButton onClick={() => handleExport('markdown')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Columns" />
                <Tab label="Data Quality" />
                <Tab label="Relationships" />
                <Tab label="Sample Data" />
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
                        {selectedTable.columns.map((column) => (
                          <TableRow key={column.name}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontWeight={column.isPrimaryKey ? 'bold' : 'normal'}>
                                  {column.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={column.type} size="small" variant="outlined" />
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
                                {column.defaultValue || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5}>
                                {column.isPrimaryKey && (
                                  <Tooltip title="Primary Key">
                                    <Chip icon={<KeyIcon />} label="PK" size="small" color="primary" />
                                  </Tooltip>
                                )}
                                {column.isForeignKey && (
                                  <Tooltip title="Foreign Key">
                                    <Chip icon={<LinkIcon />} label="FK" size="small" color="secondary" />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Data Quality Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Data Quality Metrics
                    </Typography>
                    <Grid container spacing={3} mt={1}>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Completeness
                            </Typography>
                            <Typography variant="h4">94%</Typography>
                            <LinearProgress variant="determinate" value={94} sx={{ mt: 2 }} />
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Freshness
                            </Typography>
                            <Typography variant="h4">Good</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              Last updated: 2 hours ago
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                              Uniqueness
                            </Typography>
                            <Typography variant="h4">99.8%</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              30 duplicate records
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box mt={4}>
                      <Typography variant="h6" gutterBottom>
                        Column-Level Quality
                      </Typography>
                      {selectedTable.columns.slice(0, 3).map((column) => (
                        <Accordion key={column.name}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{column.name}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                <strong>Null Count:</strong> {Math.floor(Math.random() * 100)}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Distinct Values:</strong> {Math.floor(Math.random() * 10000)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Data Distribution:</strong> Normal
                              </Typography>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Relationships Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Table Relationships
                    </Typography>
                    <Box mt={2}>
                      {selectedTable.name === 'orders' ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Relationship Type</TableCell>
                                <TableCell>Column</TableCell>
                                <TableCell>References</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  <Chip label="Foreign Key" size="small" color="secondary" />
                                </TableCell>
                                <TableCell>customer_id</TableCell>
                                <TableCell>customers.id</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box textAlign="center" py={4}>
                          <InfoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography color="text.secondary">
                            No relationships defined for this table
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Sample Data Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Sample Data (First 5 Rows)
                    </Typography>
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {selectedTable.columns.slice(0, 4).map((col) => (
                              <TableCell key={col.name}>{col.name}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[1, 2, 3, 4, 5].map((row) => (
                            <TableRow key={row}>
                              {selectedTable.columns.slice(0, 4).map((col) => (
                                <TableCell key={col.name}>
                                  {col.type.includes('INT') ? row * 100 : `Sample ${row}`}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
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
    </Box>
  );
}

export default SchemaExplorer;