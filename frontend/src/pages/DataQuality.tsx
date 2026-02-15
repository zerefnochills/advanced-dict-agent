import React from "react";
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
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface QualityMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface TableQuality {
  tableName: string;
  completeness: number;
  freshness: string;
  uniqueness: number;
  issues: number;
  status: 'good' | 'warning' | 'critical';
}

const COLORS = ['#4caf50', '#ff9800', '#f44336'];

function DataQuality() {
  const overallScore = 87;

  const metrics: QualityMetric[] = [
    { name: 'Completeness', score: 94, status: 'excellent', trend: 'up' },
    { name: 'Freshness', score: 78, status: 'good', trend: 'stable' },
    { name: 'Uniqueness', score: 92, status: 'excellent', trend: 'up' },
    { name: 'Consistency', score: 85, status: 'good', trend: 'down' },
    { name: 'Validity', score: 88, status: 'good', trend: 'stable' },
    { name: 'Accuracy', score: 81, status: 'good', trend: 'up' },
  ];

  const tableQuality: TableQuality[] = [
    { tableName: 'customers', completeness: 98, freshness: '1 hour ago', uniqueness: 100, issues: 2, status: 'good' },
    { tableName: 'orders', completeness: 95, freshness: '30 min ago', uniqueness: 99, issues: 5, status: 'good' },
    { tableName: 'products', completeness: 88, freshness: '2 days ago', uniqueness: 98, issues: 12, status: 'warning' },
    { tableName: 'inventory', completeness: 72, freshness: '1 week ago', uniqueness: 95, issues: 28, status: 'critical' },
    { tableName: 'transactions', completeness: 91, freshness: '5 min ago', uniqueness: 100, issues: 7, status: 'good' },
  ];

  const issueDistribution = [
    { name: 'Null Values', value: 45, color: '#4caf50' },
    { name: 'Duplicates', value: 20, color: '#ff9800' },
    { name: 'Outliers', value: 15, color: '#f44336' },
    { name: 'Invalid Format', value: 12, color: '#2196f3' },
    { name: 'Inconsistencies', value: 8, color: '#9c27b0' },
  ];

  const qualityTrend = [
    { month: 'Jan', score: 82 },
    { month: 'Feb', score: 84 },
    { month: 'Mar', score: 83 },
    { month: 'Apr', score: 86 },
    { month: 'May', score: 87 },
  ];

  const columnIssues = [
    { column: 'customers.email', issue: 'Invalid format', count: 234, severity: 'warning' },
    { column: 'orders.discount', issue: 'Null values', count: 1205, severity: 'critical' },
    { column: 'products.price', issue: 'Outliers', count: 45, severity: 'warning' },
    { column: 'inventory.stock', issue: 'Negative values', count: 12, severity: 'critical' },
    { column: 'transactions.amount', issue: 'Missing', count: 89, severity: 'warning' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Data Quality Dashboard
        </Typography>
        <Tooltip title="Refresh metrics">
          <IconButton>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overall Score */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Grid container alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="white" gutterBottom>
                Overall Data Quality Score
              </Typography>
              <Typography variant="h2" color="white" fontWeight="bold">
                {overallScore}%
              </Typography>
              <Typography variant="body2" color="white" sx={{ opacity: 0.9, mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                +3% from last month
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { value: overallScore },
                        { value: 100 - overallScore },
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

      {/* Quality Metrics */}
      <Grid container spacing={3} mb={3}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.name}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">{metric.name}</Typography>
                  {metric.trend === 'up' && <TrendingUpIcon color="success" />}
                  {metric.trend === 'down' && <TrendingDownIcon color="error" />}
                </Box>
                <Typography variant="h3" fontWeight="bold" color={getScoreColor(metric.score)}>
                  {metric.score}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.score}
                  sx={{
                    mt: 2,
                    height: 8,
                    borderRadius: 1,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getScoreColor(metric.score),
                    },
                  }}
                />
                <Box mt={1}>
                  <Chip label={metric.status} size="small" color={getStatusColor(metric.status)} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Issue Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issue Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quality Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quality Score Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#667eea" strokeWidth={3} name="Quality Score" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Table Quality Overview */}
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
                    <TableCell align="center">Completeness</TableCell>
                    <TableCell align="center">Freshness</TableCell>
                    <TableCell align="center">Uniqueness</TableCell>
                    <TableCell align="center">Issues</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableQuality.map((table) => (
                    <TableRow key={table.tableName}>
                      <TableCell>
                        <Typography fontWeight="bold">{table.tableName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <Typography>{table.completeness}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={table.completeness}
                            sx={{ width: 60, height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{table.freshness}</Typography>
                      </TableCell>
                      <TableCell align="center">{table.uniqueness}%</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={table.issues}
                          size="small"
                          color={table.issues > 20 ? 'error' : table.issues > 10 ? 'warning' : 'success'}
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

        {/* Critical Issues */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Issues Requiring Attention
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Found {columnIssues.length} data quality issues across your tables. Review and fix critical issues
                first.
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
                  {columnIssues.map((issue, index) => (
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
      </Grid>
    </Box>
  );
}

export default DataQuality;