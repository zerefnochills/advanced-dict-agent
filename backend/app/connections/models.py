from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from app.database.base import Base


class Connection(Base):
    """Database connection model"""
    __tablename__ = "connections"
    
    id = Column(String(255), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    db_type = Column(String(50), nullable=False)  # postgresql, mysql, sqlserver, snowflake
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    database_name = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    password_encrypted = Column(Text, nullable=False)
    config_json = Column(Text, nullable=True)  # Additional config (warehouse, schema, etc.)
    last_tested = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
