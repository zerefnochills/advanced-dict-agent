from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import call_gemini

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    system: str

@router.post("/chat")
def chat(request: ChatRequest):
    reply = call_gemini(request.message, request.system)
    return {"response": reply}

@router.post("/translate-sql")
def translate_sql(request: ChatRequest):
    reply = call_gemini(request.message, request.system)
    return {"response": reply}

