from typing import Dict, List, Any, Optional
from app.services.database_connector import DatabaseConnector


class MetadataExtractor:
    """
    Extract comprehensive metadata from database schemas
    """

    def __init__(self, connector: DatabaseConnector):
        self.connector = connector
        self.db_type = connector.db_type

    # ==========================================================
    # MAIN ENTRY
    # ==========================================================

    def extract_full_schema(self) -> Dict[str, Any]:
        """
        Extract full database schema with relationships
        """

        if not self.connector.connection:
            self.connector.connect()

        tables = self.connector.get_tables()

        schema_data = {
            "database_name": self.connector.database,
            "database_type": self.db_type,
            "total_tables": len(tables),
            "tables": {},
            "relationships": []
        }

        for table_name in tables:
            schema_data["tables"][table_name] = self.extract_table_metadata(table_name)

        schema_data["relationships"] = self.extract_relationships()

        return schema_data

    # ==========================================================
    # TABLE METADATA
    # ==========================================================

    def extract_table_metadata(self, table_name: str) -> Dict[str, Any]:
        return {
            "name": table_name,
            "columns": self.get_columns(table_name),
            "primary_keys": self.get_primary_keys(table_name),
            "foreign_keys": self.get_foreign_keys(table_name),
            "indexes": self.get_indexes(table_name),
            "row_count": self.get_row_count(table_name)
        }

    # ==========================================================
    # COLUMN INFO
    # ==========================================================

    def get_columns(self, table_name: str) -> List[Dict[str, Any]]:

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
                    WHERE table_schema = 'public'
                    AND table_name = %s
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
                    WHERE table_schema = %s
                    AND table_name = %s
                    ORDER BY ordinal_position;
                """
                cursor.execute(query, (self.connector.database, table_name))

            else:
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
                    "nullable": str(row[2]).upper() == "YES",
                    "default": row[3],
                    "max_length": row[4]
                })

            return columns

        finally:
            cursor.close()

    # ==========================================================
    # PRIMARY KEYS
    # ==========================================================

    def get_primary_keys(self, table_name: str) -> List[str]:

        cursor = self.connector.connection.cursor()

        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT a.attname
                    FROM pg_index i
                    JOIN pg_attribute a 
                    ON a.attrelid = i.indrelid 
                    AND a.attnum = ANY(i.indkey)
                    WHERE i.indrelid = %s::regclass
                    AND i.indisprimary;
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

            else:
                query = """
                    SELECT column_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = ?
                    AND constraint_name LIKE 'PK%';
                """
                cursor.execute(query, (table_name,))

            return [row[0] for row in cursor.fetchall()]

        except Exception:
            return []

        finally:
            cursor.close()

    # ==========================================================
    # FOREIGN KEYS
    # ==========================================================

    def get_foreign_keys(self, table_name: str) -> List[Dict[str, str]]:

        cursor = self.connector.connection.cursor()

        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT
                        kcu.column_name,
                        ccu.table_name,
                        ccu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage ccu
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

        except Exception:
            return []

        finally:
            cursor.close()

    # ==========================================================
    # INDEXES
    # ==========================================================

    def get_indexes(self, table_name: str) -> List[str]:

        cursor = self.connector.connection.cursor()

        try:
            if self.db_type == "postgresql":
                query = """
                    SELECT indexname
                    FROM pg_indexes
                    WHERE tablename = %s;
                """
                cursor.execute(query, (table_name,))
                return [row[0] for row in cursor.fetchall()]

            elif self.db_type == "mysql":
                query = f"SHOW INDEX FROM {table_name};"
                cursor.execute(query)
                return list({row[2] for row in cursor.fetchall()})

            else:
                return []

        except Exception:
            return []

        finally:
            cursor.close()

    # ==========================================================
    # ROW COUNT
    # ==========================================================

    def get_row_count(self, table_name: str) -> Optional[int]:

        cursor = self.connector.connection.cursor()

        try:
            query = f"SELECT COUNT(*) FROM {table_name}"
            cursor.execute(query)
            result = cursor.fetchone()
            return result[0] if result else 0

        except Exception:
            return None

        finally:
            cursor.close()

    # ==========================================================
    # RELATIONSHIPS ACROSS DATABASE
    # ==========================================================

    def extract_relationships(self) -> List[Dict[str, str]]:

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
