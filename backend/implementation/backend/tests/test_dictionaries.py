"""
Tests for dictionary generation
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base, get_db

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def authenticated_client():
    """Create an authenticated client with token"""
    # Signup
    client.post(
        "/api/auth/signup",
        json={
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "password123"
        }
    )
    
    # Login
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123"
        }
    )
    
    token = login_response.json()["access_token"]
    
    return {
        "client": client,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }


@pytest.fixture
def mock_connection():
    """Create a mock database connection"""
    # First, create a connection
    connection_response = client.post(
        "/api/connections",
        headers=authenticated_client()["headers"],
        json={
            "name": "Test DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "testdb",
            "username": "testuser",
            "password": "testpass"
        }
    )
    
    return connection_response.json()["id"]


class TestDictionaryGeneration:
    """Tests for dictionary generation"""
    
    @patch('app.services.database_connector.DatabaseConnector')
    @patch('app.services.metadata_extractor.MetadataExtractor')
    @patch('app.services.ai_service.get_ai_service')
    def test_generate_dictionary_success(
        self, 
        mock_ai_service,
        mock_metadata_extractor,
        mock_db_connector,
        authenticated_client
    ):
        """Test successful dictionary generation"""
        # Setup mocks
        mock_extractor_instance = MagicMock()
        mock_extractor_instance.extract_metadata.return_value = {
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        {
                            "name": "id",
                            "data_type": "INTEGER",
                            "nullable": False,
                            "is_primary_key": True
                        },
                        {
                            "name": "email",
                            "data_type": "VARCHAR",
                            "nullable": False
                        }
                    ]
                }
            ]
        }
        mock_metadata_extractor.return_value = mock_extractor_instance
        
        mock_ai_instance = MagicMock()
        mock_ai_instance.generate_table_description.return_value = {
            "description": "Users table stores user information",
            "business_context": "Used for authentication and user management",
            "usage_notes": "Primary table for user data"
        }
        mock_ai_service.return_value = mock_ai_instance
        
        # Create connection first
        conn_response = client.post(
            "/api/connections",
            headers=authenticated_client["headers"],
            json={
                "name": "Test DB",
                "db_type": "postgresql",
                "host": "localhost",
                "port": 5432,
                "database_name": "testdb",
                "username": "testuser",
                "password": "testpass"
            }
        )
        connection_id = conn_response.json()["id"]
        
        # Generate dictionary
        response = client.post(
            "/api/dictionaries/generate",
            headers=authenticated_client["headers"],
            json={
                "connection_id": connection_id,
                "include_ai_descriptions": True,
                "include_quality_analysis": False,
                "include_sample_data": False
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["database_name"] == "testdb"
        assert "metadata" in data
    
    def test_generate_dictionary_unauthorized(self):
        """Test dictionary generation without auth fails"""
        response = client.post(
            "/api/dictionaries/generate",
            json={
                "connection_id": "test-id",
                "include_ai_descriptions": True
            }
        )
        
        assert response.status_code == 401
    
    def test_generate_dictionary_invalid_connection(self, authenticated_client):
        """Test dictionary generation with invalid connection ID"""
        response = client.post(
            "/api/dictionaries/generate",
            headers=authenticated_client["headers"],
            json={
                "connection_id": "nonexistent-id",
                "include_ai_descriptions": True
            }
        )
        
        assert response.status_code == 404


class TestDictionaryRetrieval:
    """Tests for retrieving dictionaries"""
    
    def test_list_dictionaries_empty(self, authenticated_client):
        """Test listing dictionaries when none exist"""
        response = client.get(
            "/api/dictionaries",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 200
        assert response.json() == []
    
    @patch('app.services.database_connector.DatabaseConnector')
    @patch('app.services.metadata_extractor.MetadataExtractor')
    def test_list_dictionaries_with_data(
        self,
        mock_metadata_extractor,
        mock_db_connector,
        authenticated_client
    ):
        """Test listing dictionaries with existing data"""
        # Setup mocks
        mock_extractor_instance = MagicMock()
        mock_extractor_instance.extract_metadata.return_value = {
            "tables": []
        }
        mock_metadata_extractor.return_value = mock_extractor_instance
        
        # Create connection
        conn_response = client.post(
            "/api/connections",
            headers=authenticated_client["headers"],
            json={
                "name": "Test DB",
                "db_type": "postgresql",
                "host": "localhost",
                "port": 5432,
                "database_name": "testdb",
                "username": "testuser",
                "password": "testpass"
            }
        )
        connection_id = conn_response.json()["id"]
        
        # Generate dictionary
        client.post(
            "/api/dictionaries/generate",
            headers=authenticated_client["headers"],
            json={
                "connection_id": connection_id,
                "include_ai_descriptions": False
            }
        )
        
        # List dictionaries
        response = client.get(
            "/api/dictionaries",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "database_name" in data[0]
    
    def test_get_dictionary_success(self, authenticated_client):
        """Test getting a specific dictionary"""
        # This would need a created dictionary first
        # Simplified for example
        pass
    
    def test_get_dictionary_not_found(self, authenticated_client):
        """Test getting non-existent dictionary"""
        response = client.get(
            "/api/dictionaries/nonexistent-id",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 404


class TestDictionaryDeletion:
    """Tests for deleting dictionaries"""
    
    def test_delete_dictionary_not_found(self, authenticated_client):
        """Test deleting non-existent dictionary"""
        response = client.delete(
            "/api/dictionaries/nonexistent-id",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 404
    
    def test_delete_dictionary_unauthorized(self):
        """Test deleting dictionary without auth"""
        response = client.delete("/api/dictionaries/some-id")
        
        assert response.status_code == 401


class TestDictionaryExport:
    """Tests for dictionary export"""
    
    def test_export_json_not_found(self, authenticated_client):
        """Test exporting non-existent dictionary as JSON"""
        response = client.get(
            "/api/dictionaries/nonexistent-id/export/json",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 404
    
    def test_export_markdown_not_found(self, authenticated_client):
        """Test exporting non-existent dictionary as Markdown"""
        response = client.get(
            "/api/dictionaries/nonexistent-id/export/markdown",
            headers=authenticated_client["headers"]
        )
        
        assert response.status_code == 404
