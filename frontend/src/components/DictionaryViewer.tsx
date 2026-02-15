import React, { useState } from "react";
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
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

/* ---------- MOCK DICTIONARY DATA ---------- */
const dictionaryData: Record<
  string,
  {
    column: string;
    type: string;
    nullable: boolean;
    description: string;
  }[]
> = {
  customers: [
    {
      column: "id",
      type: "INTEGER",
      nullable: false,
      description: "Primary key for customers table",
    },
    {
      column: "name",
      type: "VARCHAR(100)",
      nullable: false,
      description: "Full name of the customer",
    },
    {
      column: "email",
      type: "VARCHAR(255)",
      nullable: false,
      description: "Customer email address",
    },
    {
      column: "created_at",
      type: "TIMESTAMP",
      nullable: false,
      description: "Account creation timestamp",
    },
  ],
  orders: [
    {
      column: "id",
      type: "INTEGER",
      nullable: false,
      description: "Primary key for orders",
    },
    {
      column: "customer_id",
      type: "INTEGER",
      nullable: false,
      description: "Foreign key referencing customers.id",
    },
    {
      column: "total_amount",
      type: "DECIMAL(10,2)",
      nullable: false,
      description: "Total order value",
    },
    {
      column: "status",
      type: "VARCHAR(50)",
      nullable: false,
      description: "Order status",
    },
  ],
};
/* ------------------------------------------ */

/* ---------- USER PREFERENCE (TEMP STORAGE) ---------- */
/**
 * Later this will come from backend
 * For now we read from localStorage
 */
const getUserPreferences = () => {
  return {
    exportFormat: localStorage.getItem("exportFormat") || "json",
  };
};
/* ---------------------------------------------------- */

/* ---------- EXPORT HELPERS ---------- */
const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportJSON = (data: any) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  download(blob, "data-dictionary.json");
};

const exportMarkdown = (data: any) => {
  let md = "# Data Dictionary\n\n";

  Object.entries(data).forEach(([table, columns]: any) => {
    md += `## ${table}\n\n`;
    md += "| Column | Type | Nullable | Description |\n";
    md += "|--------|------|----------|-------------|\n";

    columns.forEach((col: any) => {
      md += `| ${col.column} | ${col.type} | ${
        col.nullable ? "Yes" : "No"
      } | ${col.description} |\n`;
    });

    md += "\n";
  });

  const blob = new Blob([md], { type: "text/markdown" });
  download(blob, "data-dictionary.md");
};

const exportCSV = (data: any) => {
  let csv = "table,column,type,nullable,description\n";

  Object.entries(data).forEach(([table, columns]: any) => {
    columns.forEach((col: any) => {
      csv += `${table},${col.column},${col.type},${col.nullable},${col.description}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv" });
  download(blob, "data-dictionary.csv");
};
/* ----------------------------------- */

function DictionaryViewer() {
  const tables = Object.keys(dictionaryData);
  const [selectedTable, setSelectedTable] = useState(tables[0]);

  const handleExport = () => {
    const { exportFormat } = getUserPreferences();

    switch (exportFormat) {
      case "markdown":
        exportMarkdown(dictionaryData);
        break;
      case "csv":
        exportCSV(dictionaryData);
        break;
      case "json":
      default:
        exportJSON(dictionaryData);
    }
  };

  return (
    <Box>
      {/* ===== HEADER ===== */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold">
          Data Dictionary
        </Typography>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* ===== LEFT: TABLE LIST ===== */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Tables
            </Typography>

            <List>
              {tables.map((table) => (
                <ListItemButton
                  key={table}
                  selected={selectedTable === table}
                  onClick={() => setSelectedTable(table)}
                  sx={{ borderRadius: 1, mb: 1 }}
                >
                  <ListItemText
                    primary={table}
                    primaryTypographyProps={{
                      fontWeight:
                        selectedTable === table ? "bold" : "normal",
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* ===== RIGHT: COLUMN DETAILS ===== */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Table: {selectedTable}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Column</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Data Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Nullable</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {dictionaryData[selectedTable].map((col) => (
                  <TableRow key={col.column}>
                    <TableCell>{col.column}</TableCell>
                    <TableCell>
                      <Chip label={col.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={col.nullable ? "Yes" : "No"}
                        size="small"
                        color={col.nullable ? "default" : "success"}
                      />
                    </TableCell>
                    <TableCell>{col.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DictionaryViewer;
