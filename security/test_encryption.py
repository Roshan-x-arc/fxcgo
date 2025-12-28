# tests/test_encryption.py

import os
import pytest
from security import EncryptionManager


def setup_module():
    # Generate a test key and inject into env
    key = EncryptionManager.generate_key()
    os.environ["APP_ENCRYPTION_KEY"] = key.decode()


def test_encrypt_decrypt_success():
    manager = EncryptionManager()
    original_text = "Protect export profits"

    encrypted = manager.encrypt(original_text)
    assert encrypted != original_text.encode()

    decrypted = manager.decrypt(encrypted)
    assert decrypted == original_text


def test_encrypt_invalid_type():
    manager = EncryptionManager()
    with pytest.raises(TypeError):
        manager.encrypt(12345)


def test_decrypt_invalid_type():
    manager = EncryptionManager()
    with pytest.raises(TypeError):
        manager.decrypt("not-bytes")


def test_decrypt_tampered_data():
    manager = EncryptionManager()
    encrypted = manager.encrypt("FX risk")

    tampered = encrypted[:-1] + b"0"
    with pytest.raises(ValueError):
        manager.decrypt(tampered)