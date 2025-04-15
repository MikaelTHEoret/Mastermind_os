"""
Neon Database Integration for Mastermind Codex OS v2
This module provides integration with Neon PostgreSQL databases
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional, Union

# Load environment variables
load_dotenv()

class NeonDatabaseManager:
    def __init__(self):
        self.connections = {}
        self.config = self._load_database_config()
    
    def _load_database_config(self) -> Dict[str, Dict[str, Any]]:
        """Load database configuration from file or environment variables"""
        config_path = os.path.join(os.path.dirname(__file__), '../mastermind/config.js')
        
        # If config file exists, parse it
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    content = f.read()
                    # Extract JSON-like object from JS module.exports
                    json_str = content.split('module.exports = ')[1].split(';')[0]
                    # Process JS to valid JSON (replace single quotes, remove trailing commas)
                    json_str = json_str.replace("'", '"').replace(",\n}", "\n}")
                    config = json.loads(json_str)
                    return config
            except Exception as e:
                print(f"Error loading config from file: {e}")
        
        # Fallback to environment variables
        return {
            "mastermindDb": {
                "projectId": os.getenv("MASTERMIND_PROJECT_ID"),
                "databaseName": os.getenv("MASTERMIND_DATABASE", "neondb"),
                "connectionString": os.getenv("MASTERMIND_CONNECTION_STRING")
            },
            "neuralDbApp": {
                "projectId": os.getenv("NEURAL_DB_PROJECT_ID"),
                "databaseName": os.getenv("NEURAL_DB_DATABASE", "neondb"),
                "connectionString": os.getenv("NEURAL_DB_CONNECTION_STRING")
            },
            "codexDocDb": {
                "projectId": os.getenv("CODEX_DOC_PROJECT_ID"),
                "databaseName": os.getenv("CODEX_DOC_DATABASE", "neondb"),
                "connectionString": os.getenv("CODEX_DOC_CONNECTION_STRING")
            },
            "codexMemoryDb": {
                "projectId": os.getenv("CODEX_MEMORY_PROJECT_ID"),
                "databaseName": os.getenv("CODEX_MEMORY_DATABASE", "neondb"),
                "connectionString": os.getenv("CODEX_MEMORY_CONNECTION_STRING")
            }
        }
    
    def connect(self, db_name: str) -> Optional[psycopg2.extensions.connection]:
        """Connect to a specific database"""
        if db_name in self.connections and self.connections[db_name] and not self.connections[db_name].closed:
            return self.connections[db_name]
        
        db_config = self.config.get(db_name)
        if not db_config:
            print(f"Database configuration for {db_name} not found")
            return None
        
        connection_string = db_config.get("connectionString")
        if not connection_string:
            print(f"Connection string for {db_name} not found")
            return None
        
        try:
            conn = psycopg2.connect(connection_string)
            conn.autocommit = True
            self.connections[db_name] = conn
            return conn
        except Exception as e:
            print(f"Error connecting to {db_name}: {e}")
            return None
    
    def disconnect(self, db_name: str = None) -> None:
        """Disconnect from a specific database or all databases"""
        if db_name:
            if db_name in self.connections and self.connections[db_name]:
                self.connections[db_name].close()
                del self.connections[db_name]
        else:
            # Disconnect from all databases
            for db, conn in list(self.connections.items()):
                if conn:
                    conn.close()
            self.connections = {}
    
    def execute_query(self, db_name: str, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Execute a query on a specific database"""
        conn = self.connect(db_name)
        if not conn:
            return [{"error": f"Failed to connect to {db_name}"}]
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params or ())
                if query.strip().upper().startswith(("SELECT", "SHOW", "WITH", "EXPLAIN")):
                    return cursor.fetchall()
                else:
                    return [{"rowcount": cursor.rowcount}]
        except Exception as e:
            return [{"error": str(e)}]
    
    def execute_transaction(self, db_name: str, statements: List[str], params_list: List[tuple] = None) -> List[Dict[str, Any]]:
        """Execute a transaction on a specific database"""
        conn = self.connect(db_name)
        if not conn:
            return [{"error": f"Failed to connect to {db_name}"}]
        
        if params_list is None:
            params_list = [()] * len(statements)
        
        if len(statements) != len(params_list):
            return [{"error": "Number of statements must match number of parameter sets"}]
        
        results = []
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Start transaction
                conn.autocommit = False
                
                for i, (statement, params) in enumerate(zip(statements, params_list)):
                    cursor.execute(statement, params)
                    if statement.strip().upper().startswith(("SELECT", "SHOW", "WITH", "EXPLAIN")):
                        results.append(cursor.fetchall())
                    else:
                        results.append([{"rowcount": cursor.rowcount}])
                
                # Commit transaction
                conn.commit()
                
                # Restore autocommit
                conn.autocommit = True
                
                return results
        except Exception as e:
            conn.rollback()
            conn.autocommit = True
            return [{"error": str(e), "transaction_rolled_back": True}]
    
    def cross_database_query(self, query: str, databases: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Execute the same query across multiple databases"""
        if databases is None:
            databases = list(self.config.keys())
        
        results = {}
        for db_name in databases:
            results[db_name] = self.execute_query(db_name, query)
        
        return results
    
    def get_table_schema(self, db_name: str, table_name: str) -> List[Dict[str, Any]]:
        """Get the schema of a specific table"""
        query = """
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default
        FROM 
            information_schema.columns
        WHERE 
            table_name = %s
        ORDER BY 
            ordinal_position
        """
        return self.execute_query(db_name, query, (table_name,))
    
    def list_tables(self, db_name: str) -> List[Dict[str, Any]]:
        """List all tables in a specific database"""
        query = """
        SELECT 
            table_name, 
            table_type
        FROM 
            information_schema.tables
        WHERE 
            table_schema = 'public'
        ORDER BY 
            table_name
        """
        return self.execute_query(db_name, query)
    
    def setup_system_tools_table(self) -> Dict[str, Any]:
        """Set up the system_tools table in the Mastermind database"""
        conn = self.connect("mastermindDb")
        if not conn:
            return {"error": "Failed to connect to mastermindDb"}
        
        try:
            with conn.cursor() as cursor:
                # Create system_tools table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS system_tools (
                    id SERIAL PRIMARY KEY,
                    tool_name VARCHAR(255) NOT NULL,
                    server_source VARCHAR(100) NOT NULL,
                    description TEXT,
                    template TEXT,
                    parameters JSONB,
                    example_usage TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create indexes
                cursor.execute("CREATE INDEX IF NOT EXISTS system_tools_name_idx ON system_tools (tool_name)")
                
                # Create tool_usage_logs table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS tool_usage_logs (
                    id SERIAL PRIMARY KEY,
                    tool_name VARCHAR(255) NOT NULL,
                    parameters JSONB,
                    success BOOLEAN,
                    error_message TEXT,
                    execution_time_ms INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create log_tool_usage function
                cursor.execute("""
                CREATE OR REPLACE FUNCTION log_tool_usage(
                    p_tool_name VARCHAR, 
                    p_parameters JSONB, 
                    p_success BOOLEAN, 
                    p_error_message TEXT, 
                    p_execution_time_ms INTEGER
                ) RETURNS INTEGER AS $$
                DECLARE 
                    new_id INTEGER;
                BEGIN
                    INSERT INTO tool_usage_logs (
                        tool_name, 
                        parameters, 
                        success, 
                        error_message, 
                        execution_time_ms
                    ) VALUES (
                        p_tool_name, 
                        p_parameters, 
                        p_success, 
                        p_error_message, 
                        p_execution_time_ms
                    ) RETURNING id INTO new_id;
                    
                    RETURN new_id;
                END;
                $$ LANGUAGE plpgsql;
                """)
                
                # Create get_tool_template function
                cursor.execute("""
                CREATE OR REPLACE FUNCTION get_tool_template(p_tool_name VARCHAR) 
                RETURNS TABLE(
                    tool_name VARCHAR, 
                    server_source VARCHAR, 
                    description TEXT, 
                    template TEXT, 
                    parameters JSONB
                ) AS $$
                BEGIN
                    RETURN QUERY SELECT 
                        st.tool_name, 
                        st.server_source, 
                        st.description, 
                        st.template, 
                        st.parameters 
                    FROM 
                        system_tools st 
                    WHERE 
                        st.tool_name = p_tool_name;
                END;
                $$ LANGUAGE plpgsql;
                """)
                
                # Create view for available tools
                cursor.execute("""
                CREATE OR REPLACE VIEW available_tools AS 
                SELECT 
                    tool_name, 
                    server_source, 
                    description, 
                    parameters 
                FROM 
                    system_tools 
                ORDER BY 
                    server_source, tool_name;
                """)
                
                return {"success": True, "message": "System tools table and functions created"}
        except Exception as e:
            return {"error": str(e)}
    
    def setup_database_connections_table(self) -> Dict[str, Any]:
        """Set up the database_connections table in the Mastermind database"""
        conn = self.connect("mastermindDb")
        if not conn:
            return {"error": "Failed to connect to mastermindDb"}
        
        try:
            with conn.cursor() as cursor:
                # Create database_connections table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS database_connections (
                    id SERIAL PRIMARY KEY,
                    database_name VARCHAR(255) NOT NULL,
                    project_id VARCHAR(255) NOT NULL,
                    connection_status BOOLEAN DEFAULT TRUE,
                    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    connection_string TEXT
                )
                """)
                
                # Create update_connection_status function
                cursor.execute("""
                CREATE OR REPLACE FUNCTION update_connection_status(
                    db_name VARCHAR, 
                    status BOOLEAN
                ) RETURNS VOID AS $$
                BEGIN
                    UPDATE database_connections 
                    SET 
                        connection_status = status, 
                        last_checked = CURRENT_TIMESTAMP 
                    WHERE 
                        database_name = db_name;
                END;
                $$ LANGUAGE plpgsql;
                """)
                
                # Create communication_test table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS communication_test (
                    id SERIAL PRIMARY KEY,
                    source_db VARCHAR(255),
                    destination_db VARCHAR(255),
                    status BOOLEAN,
                    message TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create communication_bridge table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS communication_bridge (
                    id SERIAL PRIMARY KEY,
                    source_db VARCHAR(255),
                    destination_db VARCHAR(255),
                    query_type VARCHAR(100),
                    query_text TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    result TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    executed_at TIMESTAMP
                )
                """)
                
                # Create log_cross_db_query function
                cursor.execute("""
                CREATE OR REPLACE FUNCTION log_cross_db_query(
                    src VARCHAR, 
                    dest VARCHAR, 
                    q_type VARCHAR, 
                    q_text TEXT
                ) RETURNS INTEGER AS $$
                DECLARE 
                    new_id INTEGER;
                BEGIN
                    INSERT INTO communication_bridge (
                        source_db, 
                        destination_db, 
                        query_type, 
                        query_text
                    ) VALUES (
                        src, 
                        dest, 
                        q_type, 
                        q_text
                    ) RETURNING id INTO new_id;
                    
                    RETURN new_id;
                END;
                $$ LANGUAGE plpgsql;
                """)
                
                # Insert connection records if they don't exist
                for db_name, db_config in self.config.items():
                    cursor.execute(
                        """
                        INSERT INTO database_connections (
                            database_name, 
                            project_id, 
                            connection_string
                        )
                        SELECT %s, %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM database_connections WHERE database_name = %s
                        )
                        """,
                        (
                            db_name, 
                            db_config.get("projectId", ""), 
                            db_config.get("connectionString", ""),
                            db_name
                        )
                    )
                
                return {"success": True, "message": "Database connections tables and functions created"}
        except Exception as e:
            return {"error": str(e)}
    
    def setup_vector_store(self) -> Dict[str, Any]:
        """Set up the vector store tables in the Mastermind database"""
        conn = self.connect("mastermindDb")
        if not conn:
            return {"error": "Failed to connect to mastermindDb"}
        
        try:
            with conn.cursor() as cursor:
                # Create vector_store table with pgvector extension
                cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
                
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS vector_store (
                    id SERIAL PRIMARY KEY,
                    text TEXT NOT NULL,
                    embedding vector(384),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create index for vector similarity search
                cursor.execute("""
                CREATE INDEX IF NOT EXISTS vector_store_embedding_idx 
                ON vector_store 
                USING ivfflat(embedding vector_cosine_ops)
                """)
                
                # Create vector_search function
                cursor.execute("""
                CREATE OR REPLACE FUNCTION vector_search(
                    query_embedding vector,
                    similarity_threshold FLOAT,
                    max_results INT
                )
                RETURNS TABLE (
                    id INT,
                    text TEXT,
                    metadata JSONB,
                    similarity FLOAT
                )
                AS $$
                BEGIN
                    RETURN QUERY
                    SELECT
                        vs.id,
                        vs.text,
                        vs.metadata,
                        1 - (vs.embedding <=> query_embedding) AS similarity
                    FROM
                        vector_store vs
                    WHERE
                        1 - (vs.embedding <=> query_embedding) > similarity_threshold
                    ORDER BY
                        vs.embedding <=> query_embedding
                    LIMIT max_results;
                END;
                $$ LANGUAGE plpgsql;
                """)
                
                return {"success": True, "message": "Vector store tables and functions created"}
        except Exception as e:
            return {"error": str(e)}
    
    def check_all_connections(self) -> Dict[str, Dict[str, Any]]:
        """Check the status of all database connections"""
        results = {}
        
        for db_name in self.config.keys():
            try:
                conn = self.connect(db_name)
                if conn and not conn.closed:
                    with conn.cursor() as cursor:
                        cursor.execute("SELECT version()")
                        version = cursor.fetchone()[0]
                    
                    results[db_name] = {
                        "connected": True,
                        "version": version
                    }
                    
                    # Update connection status in the database
                    self.execute_query(
                        "mastermindDb", 
                        "SELECT update_connection_status(%s, %s)",
                        (db_name, True)
                    )
                else:
                    results[db_name] = {
                        "connected": False,
                        "error": "Failed to connect"
                    }
                    
                    # Update connection status in the database
                    self.execute_query(
                        "mastermindDb", 
                        "SELECT update_connection_status(%s, %s)",
                        (db_name, False)
                    )
            except Exception as e:
                results[db_name] = {
                    "connected": False,
                    "error": str(e)
                }
                
                # Update connection status in the database
                try:
                    self.execute_query(
                        "mastermindDb", 
                        "SELECT update_connection_status(%s, %s)",
                        (db_name, False)
                    )
                except:
                    pass
        
        return results

# Create a singleton instance
db_manager = NeonDatabaseManager()
