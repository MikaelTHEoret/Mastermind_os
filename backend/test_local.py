from backend.mcp_integration import mcp_integration

def test_database_connection():
    try:
        # Initialize Neon DB connection
        conn_status = mcp_integration.db_init()
        print("Database connection status:", conn_status)
        
        # Test basic query if connection succeeded
        if not conn_status.get("error"):
            version = mcp_integration.check_db_version()
            print("PostgreSQL version:", version)
            return True
        return False
    except Exception as e:
        print(f"Database test failed: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    try:
        success = test_database_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Critical error: {str(e)}")
        sys.exit(1)
