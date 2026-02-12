from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
import io

from app.database.base import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.dictionaries import schemas, models
from app.connections.models import Connection
from app.core.security import encryption
from app.services.database_connector import DatabaseConnector
from app.services.metadata_extractor import MetadataExtractor
from app.services.quality_analyzer import QualityAnalyzer
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/dictionaries", tags=["Dictionaries"])


@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_dictionary(
    generation_data: schemas.DictionaryGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a data dictionary for a database connection
    
    Args:
        generation_data: Generation options
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Dictionary ID and status
    """
    # Get connection
    connection = db.query(Connection).filter(
        Connection.id == generation_data.connection_id,
        Connection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    try:
        # Decrypt password
        password = encryption.decrypt(connection.password_encrypted)
        config = json.loads(connection.config_json) if connection.config_json else {}
        
        # Create database connector
        connector = DatabaseConnector(
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            database=connection.database_name,
            username=connection.username,
            password=password,
            config=config
        )
        
        # Extract metadata
        extractor = MetadataExtractor(connector)
        metadata = extractor.extract_full_schema()
        
        # Initialize storage for AI descriptions and quality metrics
        ai_descriptions = {}
        quality_metrics = {}
        
        # Analyze quality if requested
        if generation_data.include_quality_analysis:
            analyzer = QualityAnalyzer(connector)
            
            for table_name, table_data in metadata["tables"].items():
                quality = analyzer.analyze_table(table_name, table_data["columns"])
                quality_metrics[table_name] = quality
        
        # Generate AI descriptions if requested
        if generation_data.include_ai_descriptions:
            # Get API key from user or settings
            api_key = None
            if current_user.api_key_encrypted:
                api_key = encryption.decrypt(current_user.api_key_encrypted)
            
            if api_key:
                try:
                    ai_service = AIService(api_key=api_key)
                    
                    for table_name, table_data in metadata["tables"].items():
                        descriptions = ai_service.generate_table_description(
                            table_name=table_name,
                            columns=table_data["columns"],
                            foreign_keys=table_data["foreign_keys"],
                            row_count=table_data.get("row_count")
                        )
                        ai_descriptions[table_name] = descriptions
                
                except Exception as e:
                    # Continue without AI descriptions if there's an error
                    print(f"AI description generation failed: {str(e)}")
        
        # Close connector
        connector.close()
        
        # Count total columns
        total_columns = sum(
            len(table_data["columns"]) 
            for table_data in metadata["tables"].values()
        )
        
        # Create dictionary record
        dictionary = models.Dictionary(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            connection_id=connection.id,
            database_name=connection.database_name,
            metadata_json=json.dumps(metadata),
            ai_descriptions_json=json.dumps(ai_descriptions) if ai_descriptions else None,
            quality_metrics_json=json.dumps(quality_metrics) if quality_metrics else None,
            total_tables=metadata["total_tables"],
            total_columns=total_columns
        )
        
        db.add(dictionary)
        db.commit()
        db.refresh(dictionary)
        
        return {
            "dictionary_id": dictionary.id,
            "status": "completed",
            "message": "Dictionary generated successfully"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dictionary: {str(e)}"
        )


@router.get("", response_model=List[schemas.DictionaryListItem])
def list_dictionaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all dictionaries for the current user
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        List of user's dictionaries
    """
    dictionaries = db.query(models.Dictionary).filter(
        models.Dictionary.user_id == current_user.id
    ).order_by(models.Dictionary.generated_at.desc()).all()
    
    return dictionaries


@router.get("/{dictionary_id}", response_model=schemas.DictionaryResponse)
def get_dictionary(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific dictionary by ID
    
    Args:
        dictionary_id: Dictionary ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Complete dictionary data
    """
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()
    
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Parse JSON fields
    metadata = json.loads(dictionary.metadata_json)
    ai_descriptions = json.loads(dictionary.ai_descriptions_json) if dictionary.ai_descriptions_json else None
    quality_metrics = json.loads(dictionary.quality_metrics_json) if dictionary.quality_metrics_json else None
    
    return schemas.DictionaryResponse(
        id=dictionary.id,
        connection_id=dictionary.connection_id,
        database_name=dictionary.database_name,
        total_tables=dictionary.total_tables,
        total_columns=dictionary.total_columns,
        generated_at=dictionary.generated_at,
        metadata=metadata,
        ai_descriptions=ai_descriptions,
        quality_metrics=quality_metrics
    )


@router.delete("/{dictionary_id}")
def delete_dictionary(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a dictionary
    
    Args:
        dictionary_id: Dictionary ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()
    
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    db.delete(dictionary)
    db.commit()
    
    return {"message": "Dictionary deleted successfully"}


@router.get("/{dictionary_id}/export/json")
def export_json(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export dictionary as JSON file
    
    Args:
        dictionary_id: Dictionary ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        JSON file download
    """
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()
    
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Build export data
    export_data = {
        "database": {
            "name": dictionary.database_name,
            "generated_at": dictionary.generated_at.isoformat()
        },
        "summary": {
            "total_tables": dictionary.total_tables,
            "total_columns": dictionary.total_columns
        },
        "metadata": json.loads(dictionary.metadata_json),
        "ai_descriptions": json.loads(dictionary.ai_descriptions_json) if dictionary.ai_descriptions_json else None,
        "quality_metrics": json.loads(dictionary.quality_metrics_json) if dictionary.quality_metrics_json else None
    }
    
    # Create JSON response
    json_str = json.dumps(export_data, indent=2)
    
    return Response(
        content=json_str,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={dictionary.database_name}_dictionary.json"
        }
    )


@router.get("/{dictionary_id}/export/markdown")
def export_markdown(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export dictionary as Markdown file
    
    Args:
        dictionary_id: Dictionary ID
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Markdown file download
    """
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()
    
    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )
    
    # Parse data
    metadata = json.loads(dictionary.metadata_json)
    ai_descriptions = json.loads(dictionary.ai_descriptions_json) if dictionary.ai_descriptions_json else {}
    quality_metrics = json.loads(dictionary.quality_metrics_json) if dictionary.quality_metrics_json else {}
    
    # Build markdown content
    md_content = f"""# Data Dictionary: {dictionary.database_name}

**Generated:** {dictionary.generated_at.strftime("%B %d, %Y")}
**Total Tables:** {dictionary.total_tables}
**Total Columns:** {dictionary.total_columns}

---

"""
    
    # Add table documentation
    for table_name, table_data in metadata["tables"].items():
        quality = quality_metrics.get(table_name, {})
        ai_desc = ai_descriptions.get(table_name, {})
        
        md_content += f"## {table_name}\n\n"
        md_content += f"**Row Count:** {table_data.get('row_count', 'Unknown')}\n"
        
        if quality.get("overall_quality_score"):
            md_content += f"**Quality Score:** {quality['overall_quality_score']}/100\n\n"
        
        if ai_desc.get("description"):
            md_content += f"**Description:** {ai_desc['description']}\n\n"
        
        # Add columns table
        md_content += "### Columns\n\n"
        md_content += "| Column | Type | Nullable | Keys | Description |\n"
        md_content += "|--------|------|----------|------|-------------|\n"
        
        primary_keys = table_data.get("primary_keys", [])
        foreign_keys = {fk["column"]: f"FK → {fk['references_table']}" for fk in table_data.get("foreign_keys", [])}
        
        for column in table_data.get("columns", []):
            col_name = column["name"]
            col_type = column["data_type"]
            nullable = "Yes" if column.get("nullable") else "No"
            
            keys = []
            if col_name in primary_keys:
                keys.append("PK")
            if col_name in foreign_keys:
                keys.append(foreign_keys[col_name])
            keys_str = ", ".join(keys) if keys else "-"
            
            md_content += f"| {col_name} | {col_type} | {nullable} | {keys_str} | |\n"
        
        md_content += "\n---\n\n"
    
    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename={dictionary.database_name}_dictionary.md"
        }
    )
