from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class DatabaseType(str, Enum):
    """Supported database types"""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLSERVER = "sqlserver"
    SNOWFLAKE = "snowflake"


class ConnectionCreate(BaseModel):
    """Schema for creating a database connection"""
    name: str = Field(..., min_length=1, max_length=255)
    db_type: DatabaseType
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    config: Optional[Dict[str, Any]] = None  # Additional config


class ConnectionTest(BaseModel):
    """Schema for testing a database connection"""
    db_type: DatabaseType
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: str
    username: str
    password: str
    config: Optional[Dict[str, Any]] = None


class ConnectionResponse(BaseModel):
    """Schema for connection data in responses"""
    id: str
    name: str
    db_type: str
    host: Optional[str]
    port: Optional[int]
    database_name: str
    username: str
    is_active: bool
    last_tested: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConnectionUpdate(BaseModel):
    """Schema for updating a connection"""
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class TestConnectionResponse(BaseModel):
    """Schema for connection test result"""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
