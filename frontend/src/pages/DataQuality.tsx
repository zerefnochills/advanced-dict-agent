import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { dictionariesAPI, DictionaryListItem, DictionaryResponse } from '../services/api';

interface ColumnMetrics {
  null_count?: number;
  null_percentage?: number;
  distinct_count?: number;
  min_value?: any;
  max_value?: any;
}

interface TableQualityData {
  overall_quality_score?: number;
  completeness?: number;
  total_rows?: number;
  column_metrics?: Record<string, ColumnMetrics>;
  [key: string]: any;
}

interface SchemaMetadata {
  tables: Record<string, {
    columns: any[];
    primary_keys: string[];
    foreign_keys: any[];
    row_count?: number;
  }>;
  total_tables: number;
}

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#00bcd4'];

function DataQuality() {
  const [dictionaries, setDictionaries] = useState<DictionaryListItem[]>([]);
  const [selectedDictId, setSelectedDictId] = useState<string>('');
  const [dictionaryData, setDictionaryData] = useState<DictionaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDict, setLoadingDict] = useState(false);

  useEffect(() => {
    fetchDictionaries();
  }, []);

  const fetchDictionaries = async () => {
    setLoading(true);
    try {
      const res = await dictionariesAPI.list();
      setDictionaries(res.data);
      if (res.data.length > 0) {
        setSelectedDictId(res.data[0].id);
        await loadDictionary(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch dictionaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDictionary = async (dictId: string) => {
    setLoadingDict(true);
    try {
      const res = await dictionariesAPI.get(dictId);
      setDictionaryData(res.data);
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    } finally {
      setLoadingDict(false);
    }
  };

  const handleDictChange = async (dictId: string) => {
    setSelectedDictId(dictId);
    await loadDictionary(dictId);
  };

  const handleRefresh = async () => {
    if (selectedDictId) {
      await loadDictionary(selectedDictId);
    }
  };

  // ── Computed data from the dictionary ──────────────────────
  const qualityMetrics = dictionaryData?.quality_metrics as Record<string, TableQualityData> | null | undefined;
  const metadata = dictionaryData?.metadata as unknown as SchemaMetadata | null | undefined;

  // Compute overall score as average of all table scores
  const tableNames = qualityMetrics ? Object.keys(qualityMetrics) : [];
  const tableScores = tableNames.map((t) => qualityMetrics![t]?.overall_quality_score ?? null).filter((s) => s !== null) as number[];
  const overallScore = tableScores.length > 0 ? Math.round(tableScores.reduce((a, b) => a + b, 0) / tableScores.length) : null;

  // Compute completeness average
  const completenessValues = tableNames.map((t) => {
    const q = qualityMetrics![t];
    if (typeof q?.completeness === 'number') return q.completeness;
    return null;
  }).filter((v) => v !== null) as number[];
  const avgCompleteness = completenessValues.length > 0 ? Math.round(completenessValues.reduce((a, b) => a + b, 0) / completenessValues.length) : null;

  // Aggregate null issues across all tables
  const aggregateColumnIssues: { column: string; issue: string; count: number; severity: 'warning' | 'critical' }[] = [];
  let totalNulls = 0;
  let totalDistinctIssues = 0;

  if (qualityMetrics) {
    for (const [tableName, tq] of Object.entries(qualityMetrics)) {
      if (tq?.column_metrics) {
        for (const [colName, cm] of Object.entries(tq.column_metrics)) {
          if (cm.null_count && cm.null_count > 0) {
            totalNulls += cm.null_count;
            const severity: 'warning' | 'critical' = (cm.null_percentage ?? 0) > 50 ? 'critical' : 'warning';
            aggregateColumnIssues.push({
              column: `${tableName}.${colName}`,
              issue: `Null values (${cm.null_percentage?.toFixed(1)}%)`,
              count: cm.null_count,
              severity,
            });
          }
        }
      }
    }
  }
  // Sort by count descending, take top 10
  aggregateColumnIssues.sort((a, b) => b.count - a.count);
  const topIssues = aggregateColumnIssues.slice(0, 10);

  // Prepare table-level quality data for the table
  const tableQualityRows = tableNames.map((tableName) => {
    const tq = qualityMetrics![tableName];
    const tm = metadata?.tables?.[tableName];
    const colMetrics = tq?.column_metrics || {};
    const nullCols = Object.values(colMetrics).filter((c) => c.null_count && c.null_count > 0).length;

    return {
      tableName,
      score: tq?.overall_quality_score ?? null,
      completeness: tq?.completeness ?? null,
      totalRows: tq?.total_rows ?? tm?.row_count ?? null,
      columns: tm?.columns?.length ?? Object.keys(colMetrics).length,
      nullColumns: nullCols,
      status: (tq?.overall_quality_score ?? 100) >= 80 ? 'good' : (tq?.overall_quality_score ?? 100) >= 60 ? 'warning' : 'critical',
    };
  });

  // Prepare bar chart data for table quality comparison
  const barChartData = tableQualityRows.map((t) => ({
    name: t.tableName.length > 15 ? t.tableName.substring(0, 12) + '...' : t.tableName,
    score: t.score ?? 0,
  }));

  // Issue distribution by type
  const issueDistribution = totalNulls > 0
    ? [{ name: 'Null Values', value: totalNulls, color: '#ff9800' }]
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'critical':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  // ── Loading / Empty States ──────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (dictionaries.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <TableChartIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No data dictionaries yet
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Generate a data dictionary with quality analysis enabled to see quality metrics.
        </Typography>
        <Button variant="contained" href="/explorer">
          Go to Explorer
        </Button>
      </Box>
    );
  }

  const hasQualityData = qualityMetrics && tableNames.length > 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Data Quality Dashboard
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {dictionaries.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Dictionary</InputLabel>
              <Select
                value={selectedDictId}
                label="Dictionary"
                onChange={(e) => handleDictChange(e.target.value)}
              >
                {dictionaries.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.database_name} ({d.total_tables} tables)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Tooltip title="Refresh metrics">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loadingDict ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={48} />
        </Box>
      ) : !hasQualityData ? (
        <Box textAlign="center" py={8}>
          <InfoIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No quality metrics available
          </Typography>
          <Typography color="text.secondary" mb={3}>
            The selected dictionary "{dictionaryData?.database_name}" was generated without quality analysis.
            Generate a new dictionary with "Include Quality Analysis" enabled.
          </Typography>
          <Button variant="contained" href="/explorer">
            Go to Explorer
          </Button>
        </Box>
      ) : (
        <>
          {/* Overall Score */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Grid container alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" color="white" gutterBottom>
                    Overall Data Quality Score
                  </Typography>
                  <Typography variant="h2" color="white" fontWeight="bold">
                    {overallScore !== null ? `${overallScore}%` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="white" sx={{ opacity: 0.9, mt: 1 }}>
                    Based on {tableNames.length} table{tableNames.length !== 1 ? 's' : ''}
                    {avgCompleteness !== null && ` · Avg completeness: ${avgCompleteness}%`}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={[
                            { value: overallScore ?? 0 },
                            { value: 100 - (overallScore ?? 0) },
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={90}
                          endAngle={-270}
                          innerRadius={45}
                          outerRadius={60}
                          dataKey="value"
                        >
                          <Cell fill="white" />
                          <Cell fill="rgba(255,255,255,0.3)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            {/* Table Quality Comparison Bar Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quality by Table
                </Typography>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="score" name="Quality Score" fill="#667eea" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No per-table scores available
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Issue Distribution */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Issue Summary
                </Typography>
                {aggregateColumnIssues.length > 0 ? (
                  <Box>
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Total Issues</Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                              {aggregateColumnIssues.length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">Critical</Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                              {aggregateColumnIssues.filter((i) => i.severity === 'critical').length}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    <Typography variant="body2" color="text.secondary">
                      {totalNulls.toLocaleString()} total null values found across {aggregateColumnIssues.length} columns
                    </Typography>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4}>
                    <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
                    <Typography color="text.secondary">No data quality issues found!</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Table-Level Quality Overview */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Table-Level Quality
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Table Name</TableCell>
                        <TableCell align="center">Quality Score</TableCell>
                        <TableCell align="center">Completeness</TableCell>
                        <TableCell align="center">Rows</TableCell>
                        <TableCell align="center">Columns with Issues</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableQualityRows.map((table) => (
                        <TableRow key={table.tableName}>
                          <TableCell>
                            <Typography fontWeight="bold">{table.tableName}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            {table.score !== null ? (
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <Typography fontWeight="bold" color={getScoreColor(table.score)}>
                                  {table.score}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={table.score}
                                  sx={{
                                    width: 60, height: 6, borderRadius: 1,
                                    '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(table.score) },
                                  }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {table.completeness !== null
                              ? (typeof table.completeness === 'number'
                                ? `${table.completeness}%`
                                : table.completeness)
                              : '-'}
                          </TableCell>
                          <TableCell align="center">
                            {table.totalRows !== null ? table.totalRows.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={table.nullColumns}
                              size="small"
                              color={table.nullColumns > 5 ? 'error' : table.nullColumns > 2 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={table.status} size="small" color={getStatusColor(table.status)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Top Column Issues */}
            {topIssues.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Issues Requiring Attention
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Found {aggregateColumnIssues.length} data quality issues across your tables.
                      Review and fix critical issues first.
                    </Typography>
                  </Alert>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Column</TableCell>
                          <TableCell>Issue Type</TableCell>
                          <TableCell align="center">Affected Rows</TableCell>
                          <TableCell align="center">Severity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topIssues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography fontFamily="monospace" fontSize={14}>
                                {issue.column}
                              </Typography>
                            </TableCell>
                            <TableCell>{issue.issue}</TableCell>
                            <TableCell align="center">
                              <Typography fontWeight="bold">{issue.count.toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={issue.severity}
                                size="small"
                                color={issue.severity === 'critical' ? 'error' : 'warning'}
                                icon={issue.severity === 'critical' ? <ErrorIcon /> : <WarningIcon />}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
}

export default DataQuality;