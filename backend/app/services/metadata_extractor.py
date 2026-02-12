from typing import Dict, List, Any, Optional
from app.services.database_connector import DatabaseConnector
import re


class MetadataExtractor:
    """
    Extract comprehensive metadata from database schemas
    """
    
    def __init__(self, connector: DatabaseConnector):
        self.connector = connector
        self.db_type = connector.db_type
    
    def extract_full_schema(self) -> Dict[str, Any]:
        """
        Extract complete database schema including tables, columns, keys, relationships
        
        Returns:
            Dictionary containing complete schema metadata
        """
        if not self.connector.connection:
            self.connector.connect()
        
        tables = self.connector.get_tables()
        
        schema_data = {
            "database_name": self.connector.database,
            "database_type": self.db_type,
            "total_tables": len(tables),
            "tables": {}
        }
        
        for table_name in tables:
            table_metadata = self.extract_table_metadata(table_name)
            schema_data["tables"][table_name] = table_metadata
        
        # Extract relationships across tables
        schema_data["relationships"] = self.extract_relationships()
        
        return schema_data
    
    def extract_table_metadata(self, table_name: str) -> Dict[str, Any]:
        """
        Extract metadata for a specific table
        
        Args:
            table_name: Name of the table
        
        Returns:
            Dictionary containing table metadata
        """
        return {
            "name": table_name,
            "columns": self.get_columns(table_name),
            "primary_keys": self.get_primary_keys(table_name),
            "foreign_keys": self.get_foreign_keys(table_name),
            "indexes": self.get_indexes(table_name),
            "row_count": self.get_row_count(table_name),
            "sample_data": []  # Will be populated if requested
        }
    
    def get_columns(self, table_name: str) -> List[Dict[str, Any]]:
        """Get column information for a table"""
        cursor = self.connector.connection.cursor()
        
        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position;
                """
                cursor.execute(query, (table_name,))
            
            elif self.db_type == "mysql":
                query = """
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length
                    FROM information_schema.columns
                    WHERE table_schema = %s AND table_name = %s
                    ORDER BY ordinal_position;
                """
                cursor.execute(query, (self.connector.database, table_name))
            
            elif self.db_type in ["sqlserver", "snowflake"]:
                query = """
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length
                    FROM information_schema.columns
                    WHERE table_name = ?
                    ORDER BY ordinal_position;
                """
                cursor.execute(query, (table_name,))
            
            columns = []
            for row in cursor.fetchall():
                columns.append({
                    "name": row[0],
                    "data_type": row[1],
                    "nullable": row[2] == "YES",
                    "default": row[3],
                    "max_length": row[4]
                })
            
            return columns
        
        finally:
            cursor.close()
    
    def get_primary_keys(self, table_name: str) -> List[str]:
        """Get primary key columns for a table"""
        cursor = self.connector.connection.cursor()
        
        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT a.attname
                    FROM pg_index i
                    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                    WHERE i.indrelid = %s::regclass AND i.indisprimary;
                """
                cursor.execute(query, (table_name,))
            
            elif self.db_type == "mysql":
                query = """
                    SELECT column_name
                    FROM information_schema.key_column_usage
                    WHERE table_schema = %s 
                    AND table_name = %s 
                    AND constraint_name = 'PRIMARY';
                """
                cursor.execute(query, (self.connector.database, table_name))
            
            elif self.db_type in ["sqlserver", "snowflake"]:
                query = """
                    SELECT column_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = ? AND constraint_name LIKE 'PK%';
                """
                cursor.execute(query, (table_name,))
            
            return [row[0] for row in cursor.fetchall()]
        
        except:
            return []
        
        finally:
            cursor.close()
    
    def get_foreign_keys(self, table_name: str) -> List[Dict[str, str]]:
        """Get foreign key relationships for a table"""
        cursor = self.connector.connection.cursor()
        
        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT
                        kcu.column_name,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints AS tc
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_name = %s;
                """
                cursor.execute(query, (table_name,))
            
            elif self.db_type == "mysql":
                query = """
                    SELECT
                        column_name,
                        referenced_table_name,
                        referenced_column_name
                    FROM information_schema.key_column_usage
                    WHERE table_schema = %s
                    AND table_name = %s
                    AND referenced_table_name IS NOT NULL;
                """
                cursor.execute(query, (self.connector.database, table_name))
            
            else:
                return []
            
            foreign_keys = []
            for row in cursor.fetchall():
                foreign_keys.append({
                    "column": row[0],
                    "references_table": row[1],
                    "references_column": row[2]
                })
            
            return foreign_keys
        
        except:
            return []
        
        finally:
            cursor.close()
    
    def get_indexes(self, table_name: str) -> List[str]:
        """Get index information for a table"""
        # Simplified implementation
        return []
    
    def get_row_count(self, table_name: str) -> Optional[int]:
        """Get approximate row count for a table"""
        cursor = self.connector.connection.cursor()
        
        try:
            # Use COUNT(*) for accurate count (slower but reliable)
            query = f"SELECT COUNT(*) FROM {table_name}"
            cursor.execute(query)
            result = cursor.fetchone()
            return result[0] if result else 0
        
        except:
            return None
        
        finally:
            cursor.close()
    
    def extract_relationships(self) -> List[Dict[str, str]]:
        """Extract all foreign key relationships in the database"""
        relationships = []
        
        for table_name in self.connector.get_tables():
            foreign_keys = self.get_foreign_keys(table_name)
            
            for fk in foreign_keys:
                relationships.append({
                    "from_table": table_name,
                    "from_column": fk["column"],
                    "to_table": fk["references_table"],
                    "to_column": fk["references_column"]
                })
        
        return relationships
