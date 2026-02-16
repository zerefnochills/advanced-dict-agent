"""
Tests for dictionary generation and retrieval
Uses shared fixtures from conftest.py
"""

import pytest
from tests.conftest import client


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
    
    def test_list_dictionaries_unauthorized(self):
        """Test listing dictionaries without auth fails"""
        response = client.get("/api/dictionaries")
        assert response.status_code == 401
    
    def test_get_dictionary_not_found(self, authenticated_client):
        """Test getting non-existent dictionary"""
        response = client.get(
            "/api/dictionaries/nonexistent-id",
            headers=authenticated_client["headers"]
        )
        assert response.status_code == 404


class TestDictionaryGeneration:
    """Tests for dictionary generation"""
    
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
