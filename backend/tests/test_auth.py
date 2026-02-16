"""
Tests for authentication endpoints
Uses shared fixtures from conftest.py
"""

import pytest
from tests.conftest import client


class TestAuthSignup:
    """Tests for user signup"""
    
    def test_signup_success(self):
        """Test successful user registration - returns TokenResponse"""
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "securepassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["full_name"] == "Test User"
        assert "id" in data["user"]
        assert "password" not in data
    
    def test_signup_duplicate_email(self):
        """Test signup with duplicate email fails"""
        user_data = {
            "email": "duplicate@example.com",
            "full_name": "Test User",
            "password": "password123"
        }
        
        response1 = client.post("/api/auth/signup", json=user_data)
        assert response1.status_code == 200
        
        response2 = client.post("/api/auth/signup", json=user_data)
        assert response2.status_code == 400
        assert "already" in response2.json()["detail"].lower()
    
    def test_signup_invalid_email(self):
        """Test signup with invalid email format"""
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "not-an-email",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        assert response.status_code == 422
    
    def test_signup_weak_password(self):
        """Test signup with weak password (less than 8 chars)"""
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "123"
            }
        )
        assert response.status_code == 422


class TestAuthLogin:
    """Tests for user login"""
    
    def test_login_success(self):
        """Test successful login"""
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
    
    def test_login_wrong_password(self):
        """Test login with incorrect password"""
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "correctpassword"
            }
        )
        
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401


class TestAuthMe:
    """Tests for getting current user info"""
    
    def test_get_current_user_success(self):
        """Test getting current user with valid token"""
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        token = signup_response.json()["access_token"]
        
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
    
    def test_get_current_user_no_token(self):
        """Test getting current user without token fails"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token fails"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401


class TestAuthAPIKey:
    """Tests for API key management"""
    
    def test_set_api_key_success(self):
        """Test setting API key successfully"""
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        token = signup_response.json()["access_token"]
        
        response = client.put(
            "/api/auth/api-key",
            headers={"Authorization": f"Bearer {token}"},
            json={"api_key": "sk-ant-test-key-123"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "API key updated successfully"
    
    def test_set_api_key_unauthorized(self):
        """Test setting API key without auth fails"""
        response = client.put(
            "/api/auth/api-key",
            json={"api_key": "sk-ant-test-key-123"}
        )
        assert response.status_code == 401


class TestAuthLogout:
    """Tests for user logout"""
    
    def test_logout_success(self):
        """Test successful logout"""
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        token = signup_response.json()["access_token"]
        
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"
