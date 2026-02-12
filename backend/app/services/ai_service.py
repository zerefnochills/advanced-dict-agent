from typing import Dict, List, Any, Optional
import json
from anthropic import Anthropic
from app.core.config import settings


class AIService:
    """
    Service for AI-powered description generation using Claude API
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI service
        
        Args:
            api_key: Anthropic API key (uses settings if not provided)
        """
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        if not self.api_key:
            raise ValueError("Anthropic API key not configured")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
    
    def generate_table_description(
        self, 
        table_name: str, 
        columns: List[Dict[str, Any]],
        foreign_keys: List[Dict[str, str]],
        row_count: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-powered description for a database table
        
        Args:
            table_name: Name of the table
            columns: List of column metadata
            foreign_keys: List of foreign key relationships
            row_count: Number of rows in the table
        
        Returns:
            Dictionary containing AI-generated descriptions
        """
        # Build context for Claude
        column_details = "\n".join([
            f"- {col['name']} ({col['data_type']}, {'nullable' if col.get('nullable') else 'not null'})"
            for col in columns
        ])
        
        fk_details = "\n".join([
            f"- {fk['column']} references {fk['references_table']}.{fk['references_column']}"
            for fk in foreign_keys
        ]) if foreign_keys else "None"
        
        prompt = f"""Analyze this database table and provide business-friendly descriptions.

Table: {table_name}
Row Count: {row_count if row_count is not None else 'Unknown'}

Columns:
{column_details}

Foreign Key Relationships:
{fk_details}

Provide your response as a JSON object with the following structure:
{{
  "description": "1-2 sentence business-friendly description of the table's purpose",
  "business_context": "Explanation of why this data exists and its business value",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "usage_recommendations": "How data analysts and business users should use this table",
  "data_governance_notes": "Any compliance, privacy, or sensitivity considerations"
}}

Focus on making it understandable for business users, not just technical users."""
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract text from response
            response_text = response.content[0].text
            
            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0].strip()
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0].strip()
                
                descriptions = json.loads(response_text)
                return descriptions
            
            except json.JSONDecodeError:
                # If JSON parsing fails, return the raw text
                return {
                    "description": response_text[:200],
                    "business_context": "",
                    "key_insights": [],
                    "usage_recommendations": "",
                    "data_governance_notes": ""
                }
        
        except Exception as e:
            # Return fallback description if AI generation fails
            return {
                "description": f"Table storing {table_name} data",
                "business_context": f"Contains {len(columns)} columns with {row_count or 'unknown'} rows",
                "key_insights": [],
                "usage_recommendations": "Review column definitions before use",
                "data_governance_notes": "Contact data team for governance policies",
                "error": str(e)
            }
    
    def generate_column_description(
        self,
        table_name: str,
        column_name: str,
        data_type: str,
        is_nullable: bool,
        is_primary_key: bool = False,
        is_foreign_key: bool = False
    ) -> str:
        """
        Generate AI-powered description for a database column
        
        Args:
            table_name: Name of the table
            column_name: Name of the column
            data_type: Data type of the column
            is_nullable: Whether column accepts null values
            is_primary_key: Whether column is a primary key
            is_foreign_key: Whether column is a foreign key
        
        Returns:
            Human-readable description of the column
        """
        prompt = f"""Provide a concise, business-friendly description for this database column.

Table: {table_name}
Column: {column_name}
Data Type: {data_type}
Nullable: {is_nullable}
Primary Key: {is_primary_key}
Foreign Key: {is_foreign_key}

Provide a single sentence (maximum 20 words) describing what this column represents and its purpose.
Focus on business meaning, not technical details."""
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=100,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.content[0].text.strip()
        
        except:
            # Fallback description
            if is_primary_key:
                return f"Unique identifier for {table_name} records"
            elif is_foreign_key:
                return f"Reference to related record in another table"
            else:
                return f"{column_name} data ({data_type})"
    
    def answer_schema_question(
        self,
        question: str,
        schema_context: Dict[str, Any],
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Answer a natural language question about the database schema
        
        Args:
            question: User's question
            schema_context: Database schema information
            conversation_history: Previous conversation messages
        
        Returns:
            AI-generated answer
        """
        # Build context from schema
        tables_summary = []
        for table_name, table_data in schema_context.get("tables", {}).items():
            tables_summary.append(
                f"- {table_name}: {table_data.get('row_count', 0)} rows, "
                f"{len(table_data.get('columns', []))} columns"
            )
        
        context = f"""Database: {schema_context.get('database_name', 'Unknown')}
Type: {schema_context.get('database_type', 'Unknown')}
Total Tables: {schema_context.get('total_tables', 0)}

Tables:
{chr(10).join(tables_summary[:20])}  # Limit to first 20 tables
"""
        
        # Build messages with conversation history
        messages = []
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current question with schema context
        messages.append({
            "role": "user",
            "content": f"""{context}

User Question: {question}

Please answer the question based on the database schema provided above. Be concise and helpful."""
        })
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=messages
            )
            
            return response.content[0].text
        
        except Exception as e:
            return f"I'm sorry, I encountered an error while processing your question: {str(e)}"
