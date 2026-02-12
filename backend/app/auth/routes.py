from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.base import get_db
from app.auth import schemas, models, utils
from app.auth.dependencies import get_current_user
from app.core.security import encryption

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.TokenResponse)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user
    
    Args:
        user_data: User signup data (email, full_name, password)
        db: Database session
    
    Returns:
        TokenResponse with access token and user data
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = models.User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=utils.hash_password(user_data.password),
        last_login=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token, expires_at = utils.create_access_token(new_user.id, remember_me=False)
    
    # Create session record
    session = models.Session(
        id=str(utils.uuid.uuid4()),
        user_id=new_user.id,
        token=access_token,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    
    # Calculate expires_in (in seconds)
    expires_in = int((expires_at - datetime.utcnow()).total_seconds())
    
    return schemas.TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=schemas.UserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            created_at=new_user.created_at,
            has_api_key=bool(new_user.api_key_encrypted)
        )
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token
    
    Args:
        credentials: User login credentials (email, password)
        db: Database session
    
    Returns:
        TokenResponse with access token and user data
    """
    # Find user by email
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()
    
    if not user or not utils.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token, expires_at = utils.create_access_token(
        user.id,
        remember_me=credentials.remember_me
    )
    
    # Create session record
    session = models.Session(
        id=str(utils.uuid.uuid4()),
        user_id=user.id,
        token=access_token,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    
    # Calculate expires_in
    expires_in = int((expires_at - datetime.utcnow()).total_seconds())
    
    return schemas.TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=schemas.UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at,
            has_api_key=bool(user.api_key_encrypted)
        )
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user (from dependency)
    
    Returns:
        UserResponse with user data
    """
    return schemas.UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at,
        has_api_key=bool(current_user.api_key_encrypted)
    )


@router.post("/logout")
def logout(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by invalidating current session
    
    Args:
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # In a production app, you'd invalidate the specific session token
    # For simplicity, we're just returning success
    return {"message": "Successfully logged out"}


@router.put("/api-key")
def update_api_key(
    api_key_data: schemas.ApiKeyUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's Anthropic API key
    
    Args:
        api_key_data: API key to store
        current_user: Current authenticated user
        db: Database session
    
    Returns:
        Success message
    """
    # Encrypt and store API key
    encrypted_key = encryption.encrypt(api_key_data.api_key)
    current_user.api_key_encrypted = encrypted_key
    db.commit()
    
    return {"message": "API key updated successfully"}
