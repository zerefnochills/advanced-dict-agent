import requests
import os
from typing import Dict, Any

MODEL = "gemini-2.0-flash"
API_KEY = os.getenv("GEMINI_API_KEY")


class AIService:
    """
    Handles AI-based dictionary generation using Gemini API
    """

    def __init__(self):
        if not API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable not set")

    # ==========================================================
    # GENERIC GEMINI CALL
    # ==========================================================

    def call_gemini(self, prompt: str, system: str) -> str:

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system}]}
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()

            return data["candidates"][0]["content"]["parts"][0]["text"]

        except requests.exceptions.RequestException as e:
            return f"AI request failed: {str(e)}"

        except (KeyError, IndexError):
            return "AI response parsing error."

    # ==========================================================
    # DICTIONARY GENERATION
    # ==========================================================

    def generate_dictionary(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate business-friendly descriptions for tables and columns
        """

        dictionary = {}

        system_prompt = (
            "You are a data documentation assistant. "
            "Generate clear, concise business-friendly descriptions."
        )

        for table_name, table_data in schema.items():

            # Generate table description
            table_prompt = f"""
            Table Name: {table_name}
            Columns:
            {self._format_columns(table_data.get('columns', []))}
            
            Generate:
            1. A short business description of this table.
            2. Short descriptions for each column.
            """

            ai_response = self.call_gemini(table_prompt, system_prompt)

            dictionary[table_name] = {
                "table_description": ai_response,
                "columns": table_data.get("columns", [])
            }

        return dictionary

    # ==========================================================
    # HELPER FUNCTION
    # ==========================================================

    def _format_columns(self, columns):

        formatted = ""
        for col in columns:
            formatted += f"- {col['name']} ({col['data_type']})\n"

        return formatted
