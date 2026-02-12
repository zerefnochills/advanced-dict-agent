import psycopg2
import mysql.connector
import pyodbc
from typing import Dict, Any, Optional, List
import json


class DatabaseConnector:
    """
    Universal database connector supporting multiple database types
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
    
    def connect(self):
        """Establish database connection"""
        try:
            if self.db_type == "postgresql":
                self.connection = psycopg2.connect(
                    host=self.host,
                    port=self.port or 5432,
                    database=self.database,
                    user=self.username,
                    password=self.password
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
    
    def test_connection(self) -> Dict[str, Any]:
        """Test database connection"""
        try:
            self.connect()
            cursor = self.connection.cursor()
            
            # Execute a simple query to verify connection
            if self.db_type == "postgresql":
                cursor.execute("SELECT version();")
            elif self.db_type == "mysql":
                cursor.execute("SELECT VERSION();")
            elif self.db_type == "sqlserver":
                cursor.execute("SELECT @@VERSION;")
            elif self.db_type == "snowflake":
                cursor.execute("SELECT CURRENT_VERSION();")
            
            result = cursor.fetchone()
            cursor.close()
            
            # Get table count
            table_count = len(self.get_tables())
            
            return {
                "success": True,
                "message": f"Successfully connected to {self.database}",
                "details": {
                    "database_version": str(result[0]) if result else "Unknown",
                    "table_count": table_count
                }
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}",
                "details": None
            }
        
        finally:
            self.close()
    
    def get_tables(self) -> List[str]:
        """Get list of table names"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        
        try:
            if self.db_type == "postgresql":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """)
            
            elif self.db_type == "mysql":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = %s 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """, (self.database,))
            
            elif self.db_type == "sqlserver":
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """)
            
            elif self.db_type == "snowflake":
                schema = self.config.get("schema", "PUBLIC")
                cursor.execute(f"""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = '{schema}'
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name;
                """)
            
            tables = [row[0] for row in cursor.fetchall()]
            return tables
        
        finally:
            cursor.close()
    
    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute a query and return results"""
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
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
