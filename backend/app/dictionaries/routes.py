from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
import uuid
import json

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
from app.services.markdown_exporter import MarkdownExporter

router = APIRouter(prefix="/api/dictionaries", tags=["Dictionaries"])


# ==========================================================
# GENERATE DICTIONARY
# ==========================================================

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_dictionary(
    generation_data: schemas.DictionaryGenerate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a full data dictionary
    """

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

        # Create DB connector
        connector = DatabaseConnector(
            db_type=connection.db_type,
            host=connection.host,
            port=connection.port,
            database=connection.database_name,
            username=connection.username,
            password=password,
            config=config
        )

        connector.connect()

        # =============================
        # METADATA EXTRACTION
        # =============================

        extractor = MetadataExtractor(connector)
        metadata = extractor.extract_full_schema()

        ai_descriptions = {}
        quality_metrics = {}

        # =============================
        # QUALITY ANALYSIS
        # =============================

        if generation_data.include_quality_analysis:
            analyzer = QualityAnalyzer(connector)

            for table_name, table_data in metadata["tables"].items():
                quality = analyzer.analyze_table(
                    table_name,
                    table_data["columns"]
                )
                quality_metrics[table_name] = quality

        # =============================
        # AI DESCRIPTIONS
        # =============================

        if generation_data.include_ai_descriptions:

            api_key = None
            if current_user.api_key_encrypted:
                api_key = encryption.decrypt(current_user.api_key_encrypted)

            if api_key:
                try:
                    ai_service = AIService(api_key=api_key)

                    for table_name, table_data in metadata["tables"].items():
                        desc = ai_service.generate_table_description(
                            table_name=table_name,
                            columns=table_data["columns"],
                            foreign_keys=table_data["foreign_keys"],
                            row_count=table_data.get("row_count")
                        )
                        ai_descriptions[table_name] = desc

                except Exception as e:
                    print(f"AI description generation failed: {str(e)}")

        connector.close()

        # =============================
        # STORE IN DATABASE
        # =============================

        total_columns = sum(
            len(table_data["columns"])
            for table_data in metadata["tables"].values()
        )

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


# ==========================================================
# LIST DICTIONARIES
# ==========================================================

@router.get("", response_model=List[schemas.DictionaryListItem])
def list_dictionaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Dictionary).filter(
        models.Dictionary.user_id == current_user.id
    ).order_by(models.Dictionary.generated_at.desc()).all()


# ==========================================================
# GET SINGLE DICTIONARY
# ==========================================================

@router.get("/{dictionary_id}", response_model=schemas.DictionaryResponse)
def get_dictionary(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()

    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )

    return schemas.DictionaryResponse(
        id=dictionary.id,
        connection_id=dictionary.connection_id,
        database_name=dictionary.database_name,
        total_tables=dictionary.total_tables,
        total_columns=dictionary.total_columns,
        generated_at=dictionary.generated_at,
        metadata=json.loads(dictionary.metadata_json),
        ai_descriptions=json.loads(dictionary.ai_descriptions_json)
        if dictionary.ai_descriptions_json else None,
        quality_metrics=json.loads(dictionary.quality_metrics_json)
        if dictionary.quality_metrics_json else None
    )


# ==========================================================
# DELETE DICTIONARY
# ==========================================================

@router.delete("/{dictionary_id}")
def delete_dictionary(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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


# ==========================================================
# EXPORT JSON
# ==========================================================

@router.get("/{dictionary_id}/export/json")
def export_json(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()

    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )

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
        "ai_descriptions": json.loads(dictionary.ai_descriptions_json)
        if dictionary.ai_descriptions_json else None,
        "quality_metrics": json.loads(dictionary.quality_metrics_json)
        if dictionary.quality_metrics_json else None
    }

    return Response(
        content=json.dumps(export_data, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition":
            f"attachment; filename={dictionary.database_name}_dictionary.json"
        }
    )


# ==========================================================
# EXPORT MARKDOWN
# ==========================================================

@router.get("/{dictionary_id}/export/markdown")
def export_markdown(
    dictionary_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dictionary = db.query(models.Dictionary).filter(
        models.Dictionary.id == dictionary_id,
        models.Dictionary.user_id == current_user.id
    ).first()

    if not dictionary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dictionary not found"
        )

    metadata = json.loads(dictionary.metadata_json)
    ai_descriptions = json.loads(dictionary.ai_descriptions_json) if dictionary.ai_descriptions_json else {}
    quality_metrics = json.loads(dictionary.quality_metrics_json) if dictionary.quality_metrics_json else {}

    exporter = MarkdownExporter()

    markdown_content = exporter.generate(
        metadata=metadata,
        dictionary=ai_descriptions,
        quality=quality_metrics
    )

    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition":
            f"attachment; filename={dictionary.database_name}_dictionary.md"
        }
    )
