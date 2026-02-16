"""
AI Service for generating data dictionary descriptions using Claude (Anthropic)
Handles API calls, retries, error handling, and response parsing
"""

import os
import time
import logging
from typing import Dict, List, Optional, Any
from anthropic import Anthropic, APIError, RateLimitError, APITimeoutError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

class AIService:
    """Service for AI-powered data dictionary generation using Claude"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI Service with Anthropic API key
        
        Args:
            api_key: Anthropic API key (defaults to environment variable)
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment or parameters")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"  # Latest Claude Sonnet
        self.max_tokens = 2000
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((RateLimitError, APITimeoutError)),
        reraise=True
    )
    def _call_claude(self, system_prompt: str, user_prompt: str) -> str:
        """
        Make API call to Claude with retry logic
        
        Args:
            system_prompt: System context/instructions
            user_prompt: User request/question
            
        Returns:
            Claude's response text
            
        Raises:
            APIError: If API call fails after retries
        """
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            # Extract text from response
            return response.content[0].text
            
        except RateLimitError as e:
            logger.warning(f"Rate limit hit, retrying... {e}")
            raise
        except APITimeoutError as e:
            logger.warning(f"API timeout, retrying... {e}")
            raise
        except APIError as e:
            logger.error(f"Claude API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling Claude: {e}")
            raise APIError(f"Failed to call Claude: {str(e)}")
    
    def generate_table_description(
        self, 
        table_name: str, 
        columns: List[Dict[str, Any]],
        sample_data: Optional[List[Dict]] = None
    ) -> Dict[str, str]:
        """
        Generate AI description for a database table
        
        Args:
            table_name: Name of the table
            columns: List of column metadata dicts with keys: name, data_type, nullable, etc.
            sample_data: Optional sample rows from the table
            
        Returns:
            Dict with keys: description, business_context, usage_notes
        """
        try:
            # Build column descriptions
            column_details = "\n".join([
                f"- {col.get('name')} ({col.get('data_type')})"
                f"{' - PRIMARY KEY' if col.get('is_primary_key') else ''}"
                f"{' - FOREIGN KEY' if col.get('is_foreign_key') else ''}"
                f"{' - NULLABLE' if col.get('nullable') else ''}"
                for col in columns
            ])
            
            # Build sample data section if available
            sample_section = ""
            if sample_data and len(sample_data) > 0:
                sample_section = "\n\nSample Data (first 3 rows):\n"
                for i, row in enumerate(sample_data[:3], 1):
                    sample_section += f"Row {i}: {row}\n"
            
            system_prompt = """You are a data analyst and technical writer specializing in database documentation. 
Your task is to generate clear, business-friendly descriptions for database tables based on their schema and sample data.
Focus on:
1. What the table represents in business terms
2. How it's typically used
3. Key relationships and patterns
4. Any notable constraints or business rules

Keep descriptions concise (2-3 sentences each) but informative."""

            user_prompt = f"""Analyze this database table and provide a comprehensive description:

Table Name: {table_name}

Columns:
{column_details}
{sample_section}

Please provide:
1. **Description**: A clear 2-3 sentence description of what this table stores and its purpose
2. **Business Context**: How this table is typically used in business operations (1-2 sentences)
3. **Usage Notes**: Any important considerations, relationships, or best practices (1-2 sentences)

Format your response exactly as:
DESCRIPTION: [your description]
BUSINESS_CONTEXT: [your context]
USAGE_NOTES: [your notes]
"""

            # Call Claude API
            response = self._call_claude(system_prompt, user_prompt)
            
            # Parse response
            return self._parse_table_response(response)
            
        except Exception as e:
            logger.error(f"Error generating table description for {table_name}: {e}")
            return {
                "description": f"Table: {table_name}",
                "business_context": "No AI description available",
                "usage_notes": f"Error generating description: {str(e)}"
            }
    
    def generate_column_description(
        self, 
        table_name: str,
        column_name: str,
        data_type: str,
        is_nullable: bool,
        is_primary_key: bool = False,
        is_foreign_key: bool = False,
        sample_values: Optional[List[Any]] = None
    ) -> str:
        """
        Generate AI description for a specific column
        
        Args:
            table_name: Parent table name
            column_name: Column name
            data_type: Data type
            is_nullable: Whether column allows NULL
            is_primary_key: Whether column is primary key
            is_foreign_key: Whether column is foreign key
            sample_values: Optional sample values from the column
            
        Returns:
            Column description string
        """
        try:
            # Build context
            constraints = []
            if is_primary_key:
                constraints.append("PRIMARY KEY")
            if is_foreign_key:
                constraints.append("FOREIGN KEY")
            if not is_nullable:
                constraints.append("NOT NULL")
            
            constraint_text = f" ({', '.join(constraints)})" if constraints else ""
            
            sample_text = ""
            if sample_values and len(sample_values) > 0:
                unique_samples = list(set(str(v) for v in sample_values if v is not None))[:5]
                sample_text = f"\nSample values: {', '.join(unique_samples)}"
            
            system_prompt = """You are a data analyst. Generate a single, concise sentence describing what this database column stores.
Focus on the business meaning and purpose of the data. Be specific and clear."""

            user_prompt = f"""Describe this database column in one clear sentence:

Table: {table_name}
Column: {column_name}
Type: {data_type}{constraint_text}
{sample_text}

Provide a single sentence description of what this column represents and stores."""

            response = self._call_claude(system_prompt, user_prompt)
            
            # Clean up response (remove any extra formatting)
            description = response.strip().replace('\n', ' ')
            
            # Ensure it's a single sentence
            if '.' in description:
                description = description.split('.')[0] + '.'
            
            return description
            
        except Exception as e:
            logger.error(f"Error generating column description for {table_name}.{column_name}: {e}")
            return f"Column {column_name} of type {data_type}"
    
    def generate_chat_response(
        self,
        question: str,
        dictionary_context: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate contextual response for chat queries about the database
        
        Args:
            question: User's question
            dictionary_context: Database schema context (tables, columns, etc.)
            conversation_history: Previous messages in conversation
            
        Returns:
            AI response string
        """
        try:
            # Build schema context
            schema_summary = self._build_schema_summary(dictionary_context)
            
            # Build conversation context
            conversation_context = ""
            if conversation_history:
                conversation_context = "\n\nPrevious conversation:\n"
                for msg in conversation_history[-5:]:  # Last 5 messages
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    conversation_context += f"{role.upper()}: {content}\n"
            
            system_prompt = f"""You are a helpful database assistant. You have access to the following database schema:

{schema_summary}

Your role is to:
1. Answer questions about the database structure
2. Explain what tables and columns contain
3. Suggest SQL queries when appropriate
4. Help users understand data relationships
5. Provide insights about data quality

Be concise, accurate, and helpful. If you don't know something, say so."""

            user_prompt = f"""{conversation_context}

USER: {question}

Provide a clear, helpful response based on the database schema above."""

            response = self._call_claude(system_prompt, user_prompt)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return f"I apologize, but I encountered an error processing your question: {str(e)}"
    
    def _parse_table_response(self, response: str) -> Dict[str, str]:
        """Parse Claude's response into structured dictionary"""
        result = {
            "description": "",
            "business_context": "",
            "usage_notes": ""
        }
        
        try:
            lines = response.strip().split('\n')
            current_key = None
            current_value = []
            
            for line in lines:
                line = line.strip()
                if line.startswith('DESCRIPTION:'):
                    if current_key and current_value:
                        result[current_key] = ' '.join(current_value).strip()
                    current_key = 'description'
                    current_value = [line.replace('DESCRIPTION:', '').strip()]
                elif line.startswith('BUSINESS_CONTEXT:'):
                    if current_key and current_value:
                        result[current_key] = ' '.join(current_value).strip()
                    current_key = 'business_context'
                    current_value = [line.replace('BUSINESS_CONTEXT:', '').strip()]
                elif line.startswith('USAGE_NOTES:'):
                    if current_key and current_value:
                        result[current_key] = ' '.join(current_value).strip()
                    current_key = 'usage_notes'
                    current_value = [line.replace('USAGE_NOTES:', '').strip()]
                elif line and current_key:
                    current_value.append(line)
            
            # Add the last section
            if current_key and current_value:
                result[current_key] = ' '.join(current_value).strip()
            
            # Ensure all fields have content
            for key in result:
                if not result[key]:
                    result[key] = "No description available"
                    
        except Exception as e:
            logger.error(f"Error parsing table response: {e}")
            result["description"] = response[:200]  # Use first 200 chars as fallback
            
        return result
    
    def _build_schema_summary(self, dictionary_context: Dict[str, Any]) -> str:
        """Build a concise schema summary for chat context"""
        summary_parts = []
        
        tables = dictionary_context.get('tables', [])
        
        for table in tables[:10]:  # Limit to 10 tables for context
            table_name = table.get('name', 'unknown')
            columns = table.get('columns', [])
            
            column_names = [col.get('name', '') for col in columns[:5]]  # First 5 columns
            column_list = ', '.join(column_names)
            if len(columns) > 5:
                column_list += f" ... ({len(columns)} total)"
            
            summary_parts.append(f"Table '{table_name}': {column_list}")
        
        if len(tables) > 10:
            summary_parts.append(f"... and {len(tables) - 10} more tables")
        
        return "\n".join(summary_parts)
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the AI service connection
        
        Returns:
            Dict with status, message, and model info
        """
        try:
            response = self._call_claude(
                system_prompt="You are a helpful assistant.",
                user_prompt="Respond with exactly: 'Connection successful'"
            )
            
            return {
                "status": "success",
                "message": "AI service connected successfully",
                "model": self.model,
                "response": response
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"AI service connection failed: {str(e)}",
                "model": self.model
            }


# Singleton instance
_ai_service_instance: Optional[AIService] = None

def get_ai_service(api_key: Optional[str] = None) -> AIService:
    """
    Get or create AI service singleton instance
    
    Args:
        api_key: Optional API key (uses environment variable if not provided)
        
    Returns:
        AIService instance
    """
    global _ai_service_instance
    
    if _ai_service_instance is None:
        _ai_service_instance = AIService(api_key=api_key)
    
    return _ai_service_instance
