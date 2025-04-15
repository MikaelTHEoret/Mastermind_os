"""
Neon Database API Routes for Mastermind Codex OS v2
This module provides FastAPI routes for Neon PostgreSQL database operations
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Union
import json

from .neon_database import db_manager

# Create router
router = APIRouter(prefix="/neon", tags=["neon"])

# Define models
class SQLQuery(BaseModel):
    query: str
    params: Optional[List[Any]] = None
    database: str = "mastermindDb"

class SQLTransaction(BaseModel):
    statements: List[str]
    params_list: Optional[List[List[Any]]] = None
    database: str = "mastermindDb"

class CrossDatabaseQuery(BaseModel):
    query: str
    databases: Optional[List[str]] = None

class VectorQuery(BaseModel):
    text: str
    metadata_filter: Optional[Dict[str, Any]] = None
    similarity_threshold: float = 0.7
    max_results: int = 10

class VectorItem(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = None

class ConnectionTest(BaseModel):
    source_db: str
    destination_db: str
    message: str

# Routes
@router.get("/status")
async def get_database_status():
    """Get the status of all database connections"""
    try:
        status = db_manager.check_all_connections()
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def execute_query(query_data: SQLQuery):
    """Execute a SQL query on a specific database"""
    try:
        result = db_manager.execute_query(
            query_data.database,
            query_data.query,
            tuple(query_data.params) if query_data.params else None
        )
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transaction")
async def execute_transaction(transaction_data: SQLTransaction):
    """Execute a SQL transaction on a specific database"""
    try:
        # Convert list of lists to list of tuples
        params_list = None
        if transaction_data.params_list:
            params_list = [tuple(params) for params in transaction_data.params_list]
        
        result = db_manager.execute_transaction(
            transaction_data.database,
            transaction_data.statements,
            params_list
        )
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cross-query")
async def execute_cross_database_query(query_data: CrossDatabaseQuery):
    """Execute a SQL query across multiple databases"""
    try:
        result = db_manager.cross_database_query(
            query_data.query,
            query_data.databases
        )
        return {"results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tables/{database}")
async def list_tables(database: str):
    """List all tables in a specific database"""
    try:
        tables = db_manager.list_tables(database)
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schema/{database}/{table}")
async def get_table_schema(database: str, table: str):
    """Get the schema of a specific table"""
    try:
        schema = db_manager.get_table_schema(database, table)
        return {"schema": schema}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vector/search")
async def search_vector_store(query: VectorQuery):
    """Search for similar texts in the vector store"""
    try:
        # First, get embedding for the query text using the mcp_integration
        from mcp_integration import mcp_integration
        
        # Get embedding for query text
        embedding_result = mcp_integration.execute_mcp_command(
            "database-mcp",
            {
                "tool_name": "ollama_get_embedding",
                "arguments": {
                    "text": query.text,
                    "model": "nomic-embed-text"
                }
            }
        )
        
        if "error" in embedding_result:
            return {"error": embedding_result["error"]}
        
        # Use embedding for search
        embedding = embedding_result["embedding"]
        
        # Execute vector search function
        search_sql = """
        SELECT * FROM vector_search(
            %s::vector,
            %s,
            %s
        )
        """
        
        if query.metadata_filter:
            # Add metadata filter
            search_sql = """
            SELECT vs.* FROM vector_search(
                %s::vector,
                %s,
                %s
            ) vs
            WHERE vs.metadata @> %s
            """
            
            results = db_manager.execute_query(
                "mastermindDb",
                search_sql,
                (
                    json.dumps(embedding),
                    query.similarity_threshold,
                    query.max_results,
                    json.dumps(query.metadata_filter)
                )
            )
        else:
            results = db_manager.execute_query(
                "mastermindDb",
                search_sql,
                (
                    json.dumps(embedding),
                    query.similarity_threshold,
                    query.max_results
                )
            )
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vector/add")
async def add_to_vector_store(item: VectorItem):
    """Add a text to the vector store"""
    try:
        # First, get embedding for the text using the mcp_integration
        from mcp_integration import mcp_integration
        
        # Get embedding for text
        embedding_result = mcp_integration.execute_mcp_command(
            "database-mcp",
            {
                "tool_name": "ollama_get_embedding",
                "arguments": {
                    "text": item.text,
                    "model": "nomic-embed-text"
                }
            }
        )
        
        if "error" in embedding_result:
            return {"error": embedding_result["error"]}
        
        # Use embedding for storage
        embedding = embedding_result["embedding"]
        
        # Store in PostgreSQL
        insert_sql = """
        INSERT INTO vector_store (text, embedding, metadata)
        VALUES (%s, %s, %s)
        RETURNING id
        """
        
        result = db_manager.execute_query(
            "mastermindDb",
            insert_sql,
            (
                item.text,
                json.dumps(embedding),
                json.dumps(item.metadata) if item.metadata else None
            )
        )
        
        return {"id": result[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/setup/system-tools")
async def setup_system_tools():
    """Set up the system_tools table and functions"""
    try:
        result = db_manager.setup_system_tools_table()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/setup/database-connections")
async def setup_database_connections():
    """Set up the database_connections table and functions"""
    try:
        result = db_manager.setup_database_connections_table()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/setup/vector-store")
async def setup_vector_store():
    """Set up the vector store tables and functions"""
    try:
        result = db_manager.setup_vector_store()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/connection-test")
async def test_connection(test_data: ConnectionTest):
    """Test a connection between two databases"""
    try:
        # Log the connection test in the communication_test table
        test_sql = """
        INSERT INTO communication_test (source_db, destination_db, status, message)
        VALUES (%s, %s, TRUE, %s)
        RETURNING id
        """
        
        result = db_manager.execute_query(
            "mastermindDb",
            test_sql,
            (
                test_data.source_db,
                test_data.destination_db,
                test_data.message
            )
        )
        
        return {"test_id": result[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add this router to the main FastAPI app in main.py
def setup_neon_routes(app):
    app.include_router(router)
