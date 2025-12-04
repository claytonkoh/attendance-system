import pymongo
import dns.resolver
import socket

# Test DNS resolution
print("Testing DNS resolution...")
try:
    cluster_host = "cluster0.exvhydh.mongodb.net"
    answers = dns.resolver.resolve(cluster_host, 'A')
    print(f"✓ DNS resolved: {cluster_host}")
    for rdata in answers:
        print(f"  IP: {rdata}")
except Exception as e:
    print(f"✗ DNS resolution failed: {e}")

# Test basic connectivity
print("\nTesting basic connectivity...")
try:
    connection_string = "mongodb+srv://claytonkoh:claytonkoh7@cluster0.exvhydh.mongodb.net/?retryWrites=true&w=majority"
    client = pymongo.MongoClient(
        connection_string,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000
    )
    # Force connection
    client.admin.command('ping')
    print("✓ MongoDB connection successful!")
    client.close()
except pymongo.errors.ServerSelectionTimeoutError as e:
    print(f"✗ Connection timeout: {e}")
except pymongo.errors.ConfigurationError as e:
    print(f"✗ Configuration error: {e}")
except Exception as e:
    print(f"✗ Connection failed: {e}")
