"""
Tests for authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base, get_db
from app.auth.utils import hash_password

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


class TestAuthSignup:
    """Tests for user signup"""
    
    def test_signup_success(self):
        """Test successful user registration"""
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
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data
        assert "password" not in data
    
    def test_signup_duplicate_email(self):
        """Test signup with duplicate email fails"""
        user_data = {
            "email": "duplicate@example.com",
            "full_name": "Test User",
            "password": "password123"
        }
        
        # First signup should succeed
        response1 = client.post("/api/auth/signup", json=user_data)
        assert response1.status_code == 200
        
        # Second signup with same email should fail
        response2 = client.post("/api/auth/signup", json=user_data)
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"].lower()
    
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
        
        assert response.status_code == 422  # Validation error
    
    def test_signup_weak_password(self):
        """Test signup with weak password"""
        response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "123"  # Too short
            }
        )
        
        assert response.status_code == 422


class TestAuthLogin:
    """Tests for user login"""
    
    def test_login_success(self):
        """Test successful login"""
        # Create user first
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        
        # Now login
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
        # Create user
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "correctpassword"
            }
        )
        
        # Try login with wrong password
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
        # Signup
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        
        # Login to get token
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Get current user
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
        # Create user and login
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Set API key
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
        # Create user and login
        client.post(
            "/api/auth/signup",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "password123"
            }
        )
        
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Logout
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"
