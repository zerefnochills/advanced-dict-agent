from passlib.context import CryptContext

# Test bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    # Test with a simple password
    password = "testpass123"
    print(f"Testing password hashing with: {password}")
    hashed = pwd_context.hash(password)
    print(f"Successfully hashed: {hashed[:50]}...")
    
    # Test verification
    is_valid = pwd_context.verify(password, hashed)
    print(f"Verification result: {is_valid}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
