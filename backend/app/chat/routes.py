from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from app.database.base import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.chat import schemas
from app.dictionaries.models import Dictionary
from app.services.ai_service import AIService
from app.core.security import encryption

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/query", response_model=schemas.ChatResponse)
def chat_query(
    query: schemas.ChatQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Answer a natural language question about a database schema
    
    Args:
        query: Chat query with question and conversation history
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        AI-generated answer with suggestions
    """
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
    
    # Get API key
    api_key = None
    if current_user.api_key_encrypted:
        api_key = encryption.decrypt(current_user.api_key_encrypted)
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key not configured. Please set your Anthropic API key in settings."
        )
    
    try:
        # Parse schema context
        schema_context = json.loads(dictionary.metadata_json)
        
        # Convert conversation history to dict format
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in query.conversation_history
        ]
        
        # Initialize AI service
        ai_service = AIService(api_key=api_key)
        
        # Get answer
        answer = ai_service.answer_schema_question(
            question=query.question,
            schema_context=schema_context,
            conversation_history=conversation_history
        )
        
        # Generate suggestions based on context
        suggestions = [
            "Show me tables with customer data",
            "What's the schema of the orders table?",
            "Which tables have quality issues?"
        ]
        
        return schemas.ChatResponse(
            answer=answer,
            suggestions=suggestions
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}"
        )
