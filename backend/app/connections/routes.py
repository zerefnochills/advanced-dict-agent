from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
from datetime import datetime

from app.database.base import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.connections import schemas, models
from app.core.security import encryption
from app.services.database_connector import DatabaseConnector

router = APIRouter(prefix="/api/connections", tags=["Connections"])


@router.post("/test", response_model=schemas.TestConnectionResponse)
def test_connection(
    connection_data: schemas.ConnectionTest,
    current_user: User = Depends(get_current_user)
):
    """
    Test a database connection without saving it
    
    Args:
        connection_data: Connection parameters to test
        current_user: Current authenticated user
    
    Returns:
        Test result with success status and details
    """
    try:
        connector = DatabaseConnector(
            db_type=connection_data.db_type,
            host=connection_data.host,
            port=connection_data.port,
            database=connection_data.database_name,
            username=connection_data.username,
            password=connection_data.password,
            config=connection_data.config
        )
        
        result = connector.test_connection()
        
        return schemas.TestConnectionResponse(
            success=result["success"],
            message=result["message"],
            details=result["details"]
        )
    
    except Exception as e:
        return schemas.TestConnectionResponse(
            success=False,
            message=f"Connection test failed: {str(e)}",
            details=None
        )


@router.post("", response_model=schemas.ConnectionResponse, status_code=status.HTTP_201_CREATED)
def create_connection(
    connection_data: schemas.ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new database connection
    
    Args:
        connection_data: Connection parameters
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Created connection data
    """
    # Test connection first
    try:
        connector = DatabaseConnector(
            db_type=connection_data.db_type,
            host=connection_data.host,
            port=connection_data.port,
            database=connection_data.database_name,
            username=connection_data.username,
            password=connection_data.password,
            config=connection_data.config
        )
        
        test_result = connector.test_connection()
        
        if not test_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection test failed: {test_result['message']}"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection test failed: {str(e)}"
        )
    
    # Encrypt password
    encrypted_password = encryption.encrypt(connection_data.password)
    
    # Create connection record
    new_connection = models.Connection(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=connection_data.name,
        db_type=connection_data.db_type,
        host=connection_data.host,
        port=connection_data.port,
        database_name=connection_data.database_name,
        username=connection_data.username,
        password_encrypted=encrypted_password,
        config_json=json.dumps(connection_data.config) if connection_data.config else None,
        last_tested=datetime.utcnow(),
        is_active=True
    )
    
    db.add(new_connection)
    db.commit()
    db.refresh(new_connection)
    
    return new_connection


@router.get("", response_model=List[schemas.ConnectionResponse])
def list_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all connections for the current user
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of user's connections
    """
    connections = db.query(models.Connection).filter(
        models.Connection.user_id == current_user.id,
        models.Connection.is_active == True
    ).all()
    
    return connections


@router.get("/{connection_id}", response_model=schemas.ConnectionResponse)
def get_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific connection by ID
    
    Args:
        connection_id: Connection ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Connection data
    """
    connection = db.query(models.Connection).filter(
        models.Connection.id == connection_id,
        models.Connection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    return connection


@router.delete("/{connection_id}")
def delete_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a connection (soft delete by setting is_active=False)
    
    Args:
        connection_id: Connection ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    connection = db.query(models.Connection).filter(
        models.Connection.id == connection_id,
        models.Connection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    connection.is_active = False
    db.commit()
    
    return {"message": "Connection deleted successfully"}


@router.get("/{connection_id}/tables")
def get_connection_tables(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of tables for a connection
    
    Args:
        connection_id: Connection ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of table names
    """
    connection = db.query(models.Connection).filter(
        models.Connection.id == connection_id,
        models.Connection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    try:
        # Decrypt password
        password = encryption.decrypt(connection.password_encrypted)
        
        # Parse config
        config = json.loads(connection.config_json) if connection.config_json else {}
        
        # Create connector
        connector = DatabaseConnector(
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            database=connection.database_name,
            username=connection.username,
            password=password,
            config=config
        )
        
        tables = connector.get_tables()
        connector.close()
        
        return {"tables": tables}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tables: {str(e)}"
        )
