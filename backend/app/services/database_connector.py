import psycopg2
import mysql.connector
import pyodbc
from typing import Dict, Any, Optional, List
import json


class DatabaseConnector:
    """
    Universal database connector supporting multiple database types
    + Metadata Extraction
    + Data Quality Analysis
    """

    def __init__(self, db_type: str, host: str, port: int, database: str,
                 username: str, password: str, config: Optional[Dict[str, Any]] = None):
        self.db_type = db_type.lower()
        self.host = host
        self.port = port
        self.database = database
        self.username = username
        self.password = password
        self.config = config or {}
        self.connection = None

    # ==========================
    # CONNECTION
    # ==========================

    def connect(self):
        try:
            if self.db_type == "postgresql":
                self.connection = psycopg2.connect(
                    host=self.host,
                    port=self.port or 5432,
                    database=self.database,
                    user=self.username,
                    password=self.password,
                     sslmode="prefer"
                )

            elif self.db_type == "mysql":
                self.connection = mysql.connector.connect(
                    host=self.host,
                    port=self.port or 3306,
                    database=self.database,
                    user=self.username,
                    password=self.password
                )

            elif self.db_type == "sqlserver":
                conn_str = (
                    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                    f"SERVER={self.host},{self.port or 1433};"
                    f"DATABASE={self.database};"
                    f"UID={self.username};"
                    f"PWD={self.password}"
                )
                self.connection = pyodbc.connect(conn_str)

            elif self.db_type == "snowflake":
                import snowflake.connector
                self.connection = snowflake.connector.connect(
                    user=self.username,
                    password=self.password,
                    account=self.host,
                    database=self.database,
                    warehouse=self.config.get("warehouse"),
                    schema=self.config.get("schema", "PUBLIC")
                )

            else:
                raise ValueError(f"Unsupported database type: {self.db_type}")

            return True

        except Exception as e:
            raise Exception(f"Failed to connect to {self.db_type}: {str(e)}")

    def close(self):
        if self.connection:
            self.connection.close()
            self.connection = None

    def test_connection(self) -> Dict[str, Any]:
        """
        Test the database connection by connecting and running a simple query.

        Returns:
            Dict with keys: success (bool), message (str), details (dict or None)
        """
        try:
            self.connect()
            # Run a trivial query to confirm the connection works
            cursor = self.connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()

            tables = self.get_tables()
            self.close()

            return {
                "success": True,
                "message": f"Successfully connected to {self.db_type} database '{self.database}'",
                "details": {
                    "database": self.database,
                    "db_type": self.db_type,
                    "host": self.host,
                    "port": self.port,
                    "tables_found": len(tables),
                }
            }
        except Exception as e:
            self.close()
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "details": None,
            }

    # ==========================
    # BASIC UTILITIES
    # ==========================

    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()

        try:
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description]
            results = []

            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))

            return results

        finally:
            cursor.close()

    # ==========================
    # METADATA EXTRACTION
    # ==========================

    def get_tables(self) -> List[str]:
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()

        try:
            if self.db_type == "postgresql":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE';
                """)

            elif self.db_type == "mysql":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = %s
                    AND table_type = 'BASE TABLE';
                """, (self.database,))

            elif self.db_type == "sqlserver":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_type = 'BASE TABLE';
                """)

            elif self.db_type == "snowflake":
                schema = self.config.get("schema", "PUBLIC")
                cursor.execute(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = '{schema}'
                    AND table_type = 'BASE TABLE';
                """)

            return [row[0] for row in cursor.fetchall()]

        finally:
            cursor.close()

    def get_columns(self, table_name: str) -> List[Dict[str, Any]]:
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()

        try:
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table_name}';
            """)

            columns = []
            for row in cursor.fetchall():
                columns.append({
                    "column_name": row[0],
                    "data_type": row[1],
                    "is_nullable": row[2]
                })

            return columns

        finally:
            cursor.close()

    def get_primary_keys(self, table_name: str) -> List[str]:
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()

        try:
            cursor.execute(f"""
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = '{table_name}'
                AND tc.constraint_type = 'PRIMARY KEY';
            """)

            return [row[0] for row in cursor.fetchall()]

        finally:
            cursor.close()

    def get_foreign_keys(self, table_name: str) -> List[Dict[str, Any]]:
        if not self.connection:
            self.connect()

        cursor = self.connection.cursor()

        try:
            cursor.execute(f"""
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.table_name = '{table_name}'
                AND tc.constraint_type = 'FOREIGN KEY';
            """)

            fks = []
            for row in cursor.fetchall():
                fks.append({
                    "column": row[0],
                    "references_table": row[1],
                    "references_column": row[2]
                })

            return fks

        finally:
            cursor.close()

    def get_full_schema(self) -> Dict[str, Any]:
        schema = {}
        tables = self.get_tables()

        for table in tables:
            schema[table] = {
                "columns": self.get_columns(table),
                "primary_keys": self.get_primary_keys(table),
                "foreign_keys": self.get_foreign_keys(table)
            }

        return schema

    # ==========================
    # DATA QUALITY ANALYSIS
    # ==========================

    def analyze_table_quality(self, table_name: str) -> Dict[str, Any]:
        total_rows = self.execute_query(
            f"SELECT COUNT(*) as count FROM {table_name}"
        )[0]["count"]

        columns = self.get_columns(table_name)

        quality = {}

        for col in columns:
            col_name = col["column_name"]

            null_count = self.execute_query(
                f"SELECT COUNT(*) as count FROM {table_name} WHERE {col_name} IS NULL"
            )[0]["count"]

            distinct_count = self.execute_query(
                f"SELECT COUNT(DISTINCT {col_name}) as count FROM {table_name}"
            )[0]["count"]

            quality[col_name] = {
                "null_percentage": (null_count / total_rows) * 100 if total_rows else 0,
                "distinct_count": distinct_count
            }

        return {
            "total_rows": total_rows,
            "column_quality": quality
        }

    def analyze_database_quality(self) -> Dict[str, Any]:
        db_quality = {}
        tables = self.get_tables()

        for table in tables:
            db_quality[table] = self.analyze_table_quality(table)

        return db_quality

    # ==========================
    # EXPORT FUNCTIONS
    # ==========================

    def export_json(self, data: Dict[str, Any], filename: str = "data_dictionary.json"):
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)

