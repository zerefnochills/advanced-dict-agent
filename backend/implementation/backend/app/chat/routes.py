"""
Chat routes for context-aware conversations about database schemas
Integrates with AI service and data dictionary
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.database.base import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.dictionaries.models import Dictionary
from app.services.ai_service import get_ai_service
from app.chat.schemas import (
    ChatQuery,
    ChatResponse,
    ChatMessage,
    SuggestedQuestion
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    query: ChatQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a chat query about a specific data dictionary
    
    Args:
        query: Chat query with dictionary_id, question, and conversation history
        db: Database session
        current_user: Authenticated user
        
    Returns:
        ChatResponse with AI answer and suggested follow-up questions
        
    Raises:
        404: Dictionary not found
        500: AI service error
    """
    try:
        # Get dictionary
        dictionary = db.query(Dictionary).filter(
            Dictionary.id == query.dictionary_id,
            Dictionary.user_id == current_user.id
        ).first()
        
        if not dictionary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dictionary not found"
            )
        
        # Parse dictionary metadata for context
        metadata = dictionary.metadata or {}
        
        # Build dictionary context
        dictionary_context = {
            "database_name": dictionary.database_name,
            "database_type": dictionary.database_type,
            "tables": metadata.get("tables", []),
            "total_tables": len(metadata.get("tables", [])),
            "total_columns": sum(len(t.get("columns", [])) for t in metadata.get("tables", [])),
        }
        
        # Get AI service
        ai_service = get_ai_service(api_key=current_user.anthropic_api_key)
        
        # Convert conversation history to format expected by AI service
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in query.conversation_history
        ]
        
        # Generate AI response
        answer = ai_service.generate_chat_response(
            question=query.question,
            dictionary_context=dictionary_context,
            conversation_history=conversation_history
        )
        
        # Generate suggested follow-up questions
        suggested_questions = _generate_suggested_questions(
            query.question,
            dictionary_context
        )
        
        return ChatResponse(
            answer=answer,
            suggested_questions=suggested_questions,
            context_used=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat query: {str(e)}"
        )


@router.get("/suggestions/{dictionary_id}", response_model=List[SuggestedQuestion])
async def get_suggested_questions(
    dictionary_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get suggested questions for a dictionary
    
    Args:
        dictionary_id: Dictionary ID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of suggested questions
        
    Raises:
        404: Dictionary not found
    """
    try:
        # Get dictionary
        dictionary = db.query(Dictionary).filter(
            Dictionary.id == dictionary_id,
            Dictionary.user_id == current_user.id
        ).first()
        
        if not dictionary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dictionary not found"
            )
        
        # Parse metadata
        metadata = dictionary.metadata or {}
        tables = metadata.get("tables", [])
        
        # Generate contextual suggestions
        suggestions = []
        
        if tables:
            # Questions about tables
            table_names = [t.get("name") for t in tables[:3]]
            suggestions.extend([
                SuggestedQuestion(
                    question=f"What does the {table_names[0]} table contain?",
                    category="schema"
                ) if len(table_names) > 0 else None,
                SuggestedQuestion(
                    question=f"How are {table_names[0]} and {table_names[1]} related?",
                    category="relationships"
                ) if len(table_names) > 1 else None,
            ])
            
            # Questions about data quality
            suggestions.append(
                SuggestedQuestion(
                    question="What are the data quality issues in this database?",
                    category="quality"
                )
            )
            
            # Questions about usage
            suggestions.append(
                SuggestedQuestion(
                    question="Show me tables with the most columns",
                    category="analysis"
                )
            )
            
            suggestions.append(
                SuggestedQuestion(
                    question="Which tables have foreign key relationships?",
                    category="relationships"
                )
            )
            
        # General questions
        suggestions.extend([
            SuggestedQuestion(
                question="Give me an overview of this database",
                category="general"
            ),
            SuggestedQuestion(
                question="What are the primary key columns?",
                category="schema"
            ),
        ])
        
        # Filter out None values
        suggestions = [s for s in suggestions if s is not None]
        
        return suggestions[:6]  # Return top 6
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting suggested questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )


def _generate_suggested_questions(
    current_question: str,
    dictionary_context: Dict[str, Any]
) -> List[SuggestedQuestion]:
    """
    Generate contextual follow-up questions based on current question
    
    Args:
        current_question: User's current question
        dictionary_context: Database schema context
        
    Returns:
        List of suggested follow-up questions
    """
    suggestions = []
    tables = dictionary_context.get("tables", [])
    
    # Analyze current question to determine context
    question_lower = current_question.lower()
    
    if "quality" in question_lower or "issue" in question_lower:
        suggestions = [
            SuggestedQuestion(
                question="How can I improve data quality?",
                category="quality"
            ),
            SuggestedQuestion(
                question="Which columns have null values?",
                category="quality"
            ),
            SuggestedQuestion(
                question="Show me completeness metrics",
                category="quality"
            ),
        ]
    elif "relationship" in question_lower or "join" in question_lower:
        suggestions = [
            SuggestedQuestion(
                question="What are all the foreign key relationships?",
                category="relationships"
            ),
            SuggestedQuestion(
                question="Show me the entity relationship diagram",
                category="relationships"
            ),
        ]
    elif "table" in question_lower and tables:
        # Questions about specific tables
        table_names = [t.get("name") for t in tables[:3]]
        suggestions = [
            SuggestedQuestion(
                question=f"What columns are in {table_names[0]}?",
                category="schema"
            ) if len(table_names) > 0 else None,
            SuggestedQuestion(
                question="How many rows are in each table?",
                category="analysis"
            ),
        ]
    else:
        # Generic follow-ups
        suggestions = [
            SuggestedQuestion(
                question="Tell me about the data quality",
                category="quality"
            ),
            SuggestedQuestion(
                question="What are the key tables in this database?",
                category="schema"
            ),
            SuggestedQuestion(
                question="Show me table relationships",
                category="relationships"
            ),
        ]
    
    # Filter out None values
    suggestions = [s for s in suggestions if s is not None]
    
    return suggestions[:3]  # Return top 3
