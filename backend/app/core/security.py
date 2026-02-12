from cryptography.fernet import Fernet
from .config import settings
import base64


class Encryption:
    """Handle encryption and decryption of sensitive data"""
    
    def __init__(self):
        # Ensure the key is properly formatted for Fernet
        key = settings.ENCRYPTION_KEY.encode()
        # Fernet requires a 32-byte URL-safe base64-encoded key
        if len(key) != 44:  # 32 bytes base64 encoded = 44 characters
            # Pad or hash the key to 32 bytes
            key = base64.urlsafe_b64encode(key.ljust(32)[:32])
        self.cipher = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string"""
        if not data:
            return ""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt a string"""
        if not encrypted_data:
            return ""
        return self.cipher.decrypt(encrypted_data.encode()).decode()


# Global encryption instance
encryption = Encryption()
