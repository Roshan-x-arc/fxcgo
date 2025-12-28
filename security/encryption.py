# security/encryption.py

from cryptography.fernet import Fernet, InvalidToken
import os


class EncryptionManager:
    """
    Handles symmetric encryption and decryption using Fernet (AES).
    """

    def __init__(self, key: bytes | None = None):
        if key is None:
            key = os.environ.get("APP_ENCRYPTION_KEY")

        if not key:
            raise ValueError(
                "Encryption key not provided. "
                "Set APP_ENCRYPTION_KEY environment variable."
            )

        if isinstance(key, str):
            key = key.encode()

        self.fernet = Fernet(key)

    @staticmethod
    def generate_key() -> bytes:
        """
        Generate a new encryption key.
        Store this securely. NEVER hardcode in production.
        """
        return Fernet.generate_key()

    def encrypt(self, data: str) -> bytes:
        if not isinstance(data, str):
            raise TypeError("Data to encrypt must be a string")

        return self.fernet.encrypt(data.encode())

    def decrypt(self, token: bytes) -> str:
        if not isinstance(token, (bytes, bytearray)):
            raise TypeError("Encrypted data must be bytes")

        try:
            return self.fernet.decrypt(token).decode()
        except InvalidToken:
            raise ValueError("Invalid or corrupted encryption token")