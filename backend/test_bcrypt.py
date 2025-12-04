from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password hashing
test_password = "password123"
print(f"Testing password hashing with: '{test_password}'")

try:
    hashed = pwd_context.hash(test_password)
    print(f"✓ Hash successful: {hashed[:50]}...")
    
    # Test verification
    is_valid = pwd_context.verify(test_password, hashed)
    print(f"✓ Verification successful: {is_valid}")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
