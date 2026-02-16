"""
Pydantic schemas for chat API
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """Single message in conversation history"""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = Field(default=None, description="Message timestamp")


class ChatQuery(BaseModel):
    """Chat query request"""
    dictionary_id: str = Field(..., description="ID of the dictionary to query about")
    question: str = Field(..., description="User's question", min_length=1, max_length=1000)
    conversation_history: List[ChatMessage] = Field(
        default=[],
        description="Previous messages in the conversation"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "dictionary_id": "dict-123",
                "question": "What tables contain customer data?",
                "conversation_history": [
                    {
                        "role": "user",
                        "content": "Tell me about this database"
                    },
                    {
                        "role": "assistant",
                        "content": "This database contains sales and customer information..."
                    }
                ]
            }
        }


class SuggestedQuestion(BaseModel):
    """Suggested follow-up question"""
    question: str = Field(..., description="Suggested question text")
    category: str = Field(..., description="Question category: schema, quality, relationships, analysis, general")
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the data quality issues?",
                "category": "quality"
            }
        }


class ChatResponse(BaseModel):
    """Chat query response"""
    answer: str = Field(..., description="AI-generated answer")
    suggested_questions: List[SuggestedQuestion] = Field(
        default=[],
        description="Suggested follow-up questions"
    )
    context_used: bool = Field(
        default=True,
        description="Whether dictionary context was used in the response"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "answer": "The customers table contains customer information including...",
                "suggested_questions": [
                    {
                        "question": "How many customers are in the table?",
                        "category": "analysis"
                    },
                    {
                        "question": "What are the data quality issues?",
                        "category": "quality"
                    }
                ],
                "context_used": True
            }
        }
