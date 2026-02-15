from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class ChatMessage(BaseModel):
    """Schema for a chat message"""
    role: str  # "user" or "assistant"
    content: str


class ChatQuery(BaseModel):
    """Schema for chat query request"""
    dictionary_id: str
    question: str
    conversation_history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    """Schema for chat response"""
    answer: str
    suggestions: List[str] = []
