import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import StorageIcon from "@mui/icons-material/Storage";
import TableChartIcon from "@mui/icons-material/TableChart";
import {
  dictionariesAPI,
  DictionaryListItem,
  DictionaryResponse,
} from "../services/api";

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

function DictionaryViewer() {
  const [dictionaries, setDictionaries] = useState<DictionaryListItem[]>([]);
  const [selectedDictId, setSelectedDictId] = useState<string>("");
  const [dictionaryData, setDictionaryData] = useState<DictionaryResponse | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingDict, setLoadingDict] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

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
      console.error("Failed to fetch dictionaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDictionary = async (dictId: string) => {
    setLoadingDict(true);
    try {
      const res = await dictionariesAPI.get(dictId);
      setDictionaryData(res.data);
      const meta = res.data.metadata as unknown as SchemaMetadata;
      const tableNames = meta?.tables ? Object.keys(meta.tables) : [];
      if (tableNames.length > 0) {
        setSelectedTable(tableNames[0]);
      }
    } catch (error) {
      console.error("Failed to load dictionary:", error);
      setSnackbar({ open: true, message: "Failed to load dictionary", severity: "error" });
    } finally {
      setLoadingDict(false);
    }
  };

  const handleDictChange = async (dictId: string) => {
    setSelectedDictId(dictId);
    await loadDictionary(dictId);
  };

  const getMetadata = (): SchemaMetadata | null => {
    if (!dictionaryData?.metadata) return null;
    return dictionaryData.metadata as unknown as SchemaMetadata;
  };

  const getTableMeta = (): TableMeta | null => {
    const meta = getMetadata();
    if (!meta || !selectedTable) return null;
    return meta.tables?.[selectedTable] || null;
  };

  const getAiDescription = (): string | null => {
    if (!dictionaryData?.ai_descriptions || !selectedTable) return null;
    const descs = dictionaryData.ai_descriptions as Record<string, any>;
    return descs[selectedTable]?.description || null;
  };

  const getColumnDescription = (colName: string): string => {
    if (!dictionaryData?.ai_descriptions || !selectedTable) return "";
    const descs = dictionaryData.ai_descriptions as Record<string, any>;
    const tableDescs = descs[selectedTable];
    if (!tableDescs?.column_descriptions) return "";
    return tableDescs.column_descriptions[colName] || "";
  };

  /* ---------- EXPORT HELPERS ---------- */
  const handleExportJson = async () => {
    if (!dictionaryData) return;
    try {
      const res = await dictionariesAPI.exportJson(dictionaryData.id);
      const blob = new Blob([res.data as any], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dictionaryData.database_name}_dictionary.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, message: "Export failed", severity: "error" });
    }
  };

  const handleExportMarkdown = async () => {
    if (!dictionaryData) return;
    try {
      const res = await dictionariesAPI.exportMarkdown(dictionaryData.id);
      const blob = new Blob([res.data as any], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dictionaryData.database_name}_dictionary.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSnackbar({ open: true, message: "Export failed", severity: "error" });
    }
  };

  const metadata = getMetadata();
  const tableMeta = getTableMeta();
  const tableNames = metadata?.tables ? Object.keys(metadata.tables) : [];
  const aiDescription = getAiDescription();

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
        <TableChartIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No data dictionaries yet
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Go to the Schema Explorer to generate a data dictionary for your connected database.
        </Typography>
        <Button variant="contained" href="/explorer">
          Go to Explorer
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* ===== HEADER ===== */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Data Dictionary
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
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportJson}
            disabled={!dictionaryData}
          >
            JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportMarkdown}
            disabled={!dictionaryData}
          >
            Markdown
          </Button>
        </Box>
      </Box>

      {/* Summary bar */}
      {dictionaryData && (
        <Paper sx={{ p: 2, mb: 3, display: "flex", gap: 3, alignItems: "center" }}>
          <StorageIcon color="primary" />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Database
            </Typography>
            <Typography fontWeight={600}>{dictionaryData.database_name}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Tables
            </Typography>
            <Typography fontWeight={600}>{dictionaryData.total_tables}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Columns
            </Typography>
            <Typography fontWeight={600}>{dictionaryData.total_columns}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Generated
            </Typography>
            <Typography fontWeight={600}>
              {new Date(dictionaryData.generated_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      )}

      {loadingDict ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* ===== LEFT: TABLE LIST ===== */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" mb={2}>
                Tables
              </Typography>

              <List>
                {tableNames.map((table) => (
                  <ListItemButton
                    key={table}
                    selected={selectedTable === table}
                    onClick={() => setSelectedTable(table)}
                    sx={{ borderRadius: 1, mb: 1 }}
                  >
                    <ListItemText
                      primary={table}
                      primaryTypographyProps={{
                        fontWeight: selectedTable === table ? "bold" : "normal",
                      }}
                      secondary={
                        metadata?.tables[table]?.row_count !== undefined
                          ? `${metadata.tables[table].row_count!.toLocaleString()} rows`
                          : undefined
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* ===== RIGHT: COLUMN DETAILS ===== */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {selectedTable}
              </Typography>

              {aiDescription && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {aiDescription}
                </Typography>
              )}

              <Divider sx={{ mb: 2 }} />

              {tableMeta && (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column</strong></TableCell>
                      <TableCell><strong>Data Type</strong></TableCell>
                      <TableCell><strong>Nullable</strong></TableCell>
                      <TableCell><strong>Keys</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {tableMeta.columns.map((col) => {
                      const isPK = tableMeta.primary_keys.includes(col.name);
                      const fk = tableMeta.foreign_keys.find((f) => f.column === col.name);
                      const desc = getColumnDescription(col.name);
                      return (
                        <TableRow key={col.name}>
                          <TableCell>
                            <Typography fontWeight={isPK ? "bold" : "normal"}>
                              {col.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={col.data_type} size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={col.nullable ? "Yes" : "No"}
                              size="small"
                              color={col.nullable ? "default" : "success"}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              {isPK && <Chip label="PK" size="small" color="primary" />}
                              {fk && (
                                <Chip
                                  label={`FK → ${fk.references_table}`}
                                  size="small"
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {desc || "-"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DictionaryViewer;
