from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database.base import Base


class Dictionary(Base):
    """Data dictionary model"""
    __tablename__ = "dictionaries"
    
    id = Column(String(255), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    connection_id = Column(String(255), ForeignKey("connections.id"), nullable=False)
    database_name = Column(String(255), nullable=False)
    metadata_json = Column(Text, nullable=False)  # Complete metadata
    ai_descriptions_json = Column(Text, nullable=True)  # AI-generated content
    quality_metrics_json = Column(Text, nullable=True)  # Quality analysis
    total_tables = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
