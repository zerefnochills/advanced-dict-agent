from typing import Dict, List, Any
from app.services.database_connector import DatabaseConnector


class QualityAnalyzer:
    """
    Analyze data quality metrics for database tables
    """

    def __init__(self, connector: DatabaseConnector):
        self.connector = connector

    # ==========================================================
    # MAIN TABLE ANALYSIS
    # ==========================================================

    def analyze_table(self, table_name: str, columns: List[Dict[str, Any]]) -> Dict[str, Any]:

        if not self.connector.connection:
            self.connector.connect()

        metrics = {
            "table_name": table_name,
            "total_rows": 0,
            "completeness_score": 100,
            "uniqueness_score": 100,
            "freshness": None,
            "overall_quality_score": 100,
            "column_metrics": [],
            "issues": []
        }

        cursor = self.connector.connection.cursor()

        try:
            # Get total row count ONCE (optimization)
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_rows = cursor.fetchone()[0]
            metrics["total_rows"] = total_rows

            if total_rows == 0:
                return metrics

            total_completeness = 0

            for column in columns:
                col_metrics = self.analyze_column(
                    table_name,
                    column,
                    total_rows
                )

                metrics["column_metrics"].append(col_metrics)
                total_completeness += col_metrics["completeness"]

            # Average completeness
            metrics["completeness_score"] = round(
                total_completeness / len(columns), 2
            )

            # Table uniqueness (row-level)
            metrics["uniqueness_score"] = self.calculate_table_uniqueness(
                table_name,
                total_rows
            )

            # Freshness detection (if timestamp column exists)
            metrics["freshness"] = self.detect_freshness(table_name, columns)

            # Weighted score
            metrics["overall_quality_score"] = round(
                (metrics["completeness_score"] * 0.5) +
                (metrics["uniqueness_score"] * 0.3) +
                (metrics["freshness"] * 0.2 if metrics["freshness"] else 0),
                2
            )

            metrics["issues"] = self.identify_issues(metrics)

            return metrics

        finally:
            cursor.close()

    # ==========================================================
    # COLUMN ANALYSIS
    # ==========================================================

    def analyze_column(self, table_name: str, column: Dict[str, Any], total_rows: int) -> Dict[str, Any]:

        column_name = column["name"]
        cursor = self.connector.connection.cursor()

        try:
            # NULL count
            cursor.execute(
                f"SELECT COUNT(*) FROM {table_name} WHERE {column_name} IS NULL"
            )
            null_count = cursor.fetchone()[0]

            # Distinct count
            cursor.execute(
                f"SELECT COUNT(DISTINCT {column_name}) FROM {table_name}"
            )
            distinct_count = cursor.fetchone()[0]

            null_percentage = round((null_count / total_rows) * 100, 2)
            completeness = round(100 - null_percentage, 2)

            uniqueness = round((distinct_count / total_rows) * 100, 2)

            return {
                "column_name": column_name,
                "null_count": null_count,
                "null_percentage": null_percentage,
                "distinct_count": distinct_count,
                "completeness": completeness,
                "uniqueness": uniqueness
            }

        except Exception as e:
            return {
                "column_name": column_name,
                "error": str(e),
                "completeness": 100,
                "null_count": 0,
                "null_percentage": 0,
                "distinct_count": 0,
                "uniqueness": 100
            }

        finally:
            cursor.close()

    # ==========================================================
    # TABLE UNIQUENESS
    # ==========================================================

    def calculate_table_uniqueness(self, table_name: str, total_rows: int) -> float:

        try:
            cursor = self.connector.connection.cursor()

            # Simplified row uniqueness check
            cursor.execute(f"SELECT COUNT(DISTINCT *) FROM {table_name}")
            distinct_rows = cursor.fetchone()[0]

            cursor.close()

            return round((distinct_rows / total_rows) * 100, 2)

        except:
            # Fallback
            return 95.0

    # ==========================================================
    # FRESHNESS CHECK
    # ==========================================================

    def detect_freshness(self, table_name: str, columns: List[Dict[str, Any]]) -> float:

        timestamp_columns = [
            col["name"]
            for col in columns
            if "date" in col["name"].lower()
            or "time" in col["name"].lower()
        ]

        if not timestamp_columns:
            return 100.0  # assume fresh if no timestamp

        try:
            cursor = self.connector.connection.cursor()

            column = timestamp_columns[0]

            cursor.execute(f"SELECT MAX({column}) FROM {table_name}")
            result = cursor.fetchone()[0]

            cursor.close()

            if result:
                return 100.0  # simplistic freshness score
            else:
                return 50.0

        except:
            return 80.0

    # ==========================================================
    # ISSUE DETECTION
    # ==========================================================

    def identify_issues(self, metrics: Dict[str, Any]) -> List[Dict[str, str]]:

        issues = []

        if metrics["completeness_score"] < 70:
            issues.append({
                "severity": "high",
                "type": "completeness",
                "message": f"Low completeness score: {metrics['completeness_score']}%"
            })

        if metrics["uniqueness_score"] < 70:
            issues.append({
                "severity": "medium",
                "type": "duplicates",
                "message": f"Low uniqueness score: {metrics['uniqueness_score']}%"
            })

        for col in metrics["column_metrics"]:
            if col.get("null_percentage", 0) > 40:
                issues.append({
                    "severity": "high",
                    "type": "null_values",
                    "message": f"{col['column_name']} has {col['null_percentage']}% null values"
                })

        return issues
