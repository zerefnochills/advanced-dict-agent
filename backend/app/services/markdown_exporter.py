from typing import Dict, Any


class MarkdownExporter:
    """
    Generate Markdown documentation for Data Dictionary
    """

    # ==========================================================
    # MAIN EXPORT FUNCTION
    # ==========================================================

    def generate(
        self,
        metadata: Dict[str, Any],
        dictionary: Dict[str, Any],
        quality: Dict[str, Any]
    ) -> str:

        markdown = ""

        # ======================================================
        # DATABASE OVERVIEW
        # ======================================================

        markdown += f"# 📘 Data Dictionary\n\n"
        markdown += f"**Database Name:** {metadata.get('database_name')}\n\n"
        markdown += f"**Database Type:** {metadata.get('database_type')}\n\n"
        markdown += f"**Total Tables:** {metadata.get('total_tables')}\n\n"
        markdown += "---\n\n"

        # ======================================================
        # TABLE DOCUMENTATION
        # ======================================================

        tables = metadata.get("tables", {})

        for table_name, table_data in tables.items():

            markdown += f"## 🗂 Table: `{table_name}`\n\n"

            # Table Description (AI Generated)
            table_desc = dictionary.get(table_name, {}).get(
                "table_description",
                "No description available."
            )

            markdown += f"### 📖 Description\n{table_desc}\n\n"

            # Row Count
            markdown += f"**Row Count:** {table_data.get('row_count', 'N/A')}\n\n"

            # ==================================================
            # COLUMN SECTION
            # ==================================================

            markdown += "### 🧱 Columns\n\n"
            markdown += "| Column Name | Data Type | Nullable | Default | Max Length |\n"
            markdown += "|-------------|----------|----------|----------|------------|\n"

            for col in table_data.get("columns", []):
                markdown += (
                    f"| {col.get('name')} "
                    f"| {col.get('data_type')} "
                    f"| {col.get('nullable')} "
                    f"| {col.get('default')} "
                    f"| {col.get('max_length')} |\n"
                )

            markdown += "\n"

            # ==================================================
            # PRIMARY KEYS
            # ==================================================

            if table_data.get("primary_keys"):
                markdown += "### 🔑 Primary Keys\n"
                for pk in table_data["primary_keys"]:
                    markdown += f"- `{pk}`\n"
                markdown += "\n"

            # ==================================================
            # FOREIGN KEYS
            # ==================================================

            if table_data.get("foreign_keys"):
                markdown += "### 🔗 Foreign Keys\n"
                for fk in table_data["foreign_keys"]:
                    markdown += (
                        f"- `{fk['column']}` → "
                        f"`{fk['references_table']}.{fk['references_column']}`\n"
                    )
                markdown += "\n"

            # ==================================================
            # INDEXES
            # ==================================================

            if table_data.get("indexes"):
                markdown += "### 📌 Indexes\n"
                for idx in table_data["indexes"]:
                    markdown += f"- `{idx}`\n"
                markdown += "\n"

            # ==================================================
            # QUALITY METRICS
            # ==================================================

            table_quality = quality.get(table_name)

            if table_quality:
                markdown += "### 📊 Data Quality\n\n"
                markdown += f"- **Overall Score:** {table_quality.get('overall_quality_score')}%\n"
                markdown += f"- **Completeness:** {table_quality.get('completeness_score')}%\n"
                markdown += f"- **Uniqueness:** {table_quality.get('uniqueness_score')}%\n"
                markdown += "\n"

                if table_quality.get("issues"):
                    markdown += "#### ⚠ Issues Detected\n"
                    for issue in table_quality["issues"]:
                        markdown += (
                            f"- **{issue['severity'].upper()}**: {issue['message']}\n"
                        )
                    markdown += "\n"

            markdown += "---\n\n"

        # ======================================================
        # RELATIONSHIPS SECTION
        # ======================================================

        relationships = metadata.get("relationships", [])

        if relationships:
            markdown += "## 🔄 Table Relationships\n\n"

            markdown += "| From Table | From Column | To Table | To Column |\n"
            markdown += "|------------|-------------|----------|-----------|\n"

            for rel in relationships:
                markdown += (
                    f"| {rel['from_table']} "
                    f"| {rel['from_column']} "
                    f"| {rel['to_table']} "
                    f"| {rel['to_column']} |\n"
                )

            markdown += "\n"

        markdown += "\n---\n"
        markdown += "_Generated by Intelligent Data Dictionary Agent_\n"

        return markdown
