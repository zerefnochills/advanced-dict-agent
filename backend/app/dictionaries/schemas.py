from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List


class DictionaryGenerate(BaseModel):
    """Schema for generating a data dictionary"""
    connection_id: str
    include_ai_descriptions: bool = True
    include_quality_analysis: bool = True
    include_sample_data: bool = False


class DictionaryResponse(BaseModel):
    """Schema for dictionary data in responses"""
    id: str
    connection_id: str
    database_name: str
    total_tables: int
    total_columns: int
    generated_at: datetime
    metadata: Optional[Dict[str, Any]] = None
    ai_descriptions: Optional[Dict[str, Any]] = None
    quality_metrics: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class DictionaryListItem(BaseModel):
    """Schema for dictionary in list view"""
    id: str
    connection_id: str
    database_name: str
    total_tables: int
    total_columns: int
    generated_at: datetime
    
    class Config:
        from_attributes = True


class GenerationStatus(BaseModel):
    """Schema for dictionary generation status"""
    status: str  # "processing", "completed", "failed"
    progress: int  # 0-100
    current_step: str
    message: str
