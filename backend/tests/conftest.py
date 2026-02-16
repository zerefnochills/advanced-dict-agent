"""
Shared test fixtures for all test modules.
Provides a single test database engine and dependency override.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base, get_db

# Single shared test engine
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


# Apply override once globally
app.dependency_overrides[get_db] = override_get_db

# Single shared TestClient
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
    signup_response = client.post(
        "/api/auth/signup",
        json={
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "password123"
        }
    )
    token = signup_response.json()["access_token"]
    return {
        "client": client,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"}
    }
