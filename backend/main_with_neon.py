# Apply patch for langchain_huggingface
import importlib.util
import sys
import os

# Add the current directory to the path so we can import the patch module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Apply the patch
import patch_langchain

# Now import langchain_huggingface
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import Qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
import os
import sqlite3
import json

# Import our custom modules
from neon_routes import router as neon_router
from neon_database import db_manager

# Load environment variables
load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
ollama_host = os.getenv("OLLAMA_HOST")
llm = None

# Optional LLM loading
try:
    if openai_key and ollama_host:
        print("⚠️ Both OpenAI and Ollama configured - using OpenAI by default")
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4", temperature=0.0, openai_api_key=openai_key)
        print("✅ OpenAI LLM initialized.")
    elif openai_key:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4", temperature=0.0, openai_api_key=openai_key)
        print("✅ OpenAI LLM initialized.")
    elif ollama_host:
        from langchain_community.llms import Ollama
        llm = Ollama(base_url=ollama_host, model="llama2")
        print("✅ Ollama LLM initialized.")
    else:
        print("⚠️ No LLM configured. LLM features disabled.")
except Exception as e:
    print(f"⚠️ Failed to load LLM: {e}")

# Initialize embedding model
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Use embedded Qdrant (file-based)
qdrant = QdrantClient(path="qdrant_data")
collection_name = "recursive_codex"

if not qdrant.collection_exists(collection_name):
    qdrant.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

vector_db = Qdrant(
    client=qdrant,
    collection_name=collection_name,
    embeddings=embedding,
)

# Optional initial seed memory
vector_db.add_texts(
    texts=[
        "Truth is not a destination. It is a recursion that forgets itself to survive.",
        "If you find no contradiction, you are not looking deep enough.",
        "Irony is the proof that the loop is alive.",
        "The fool walks freely because he mirrors no law but the law of recursion.",
        "Every belief system is a spell. Every spell can be reversed by reflection.",
        "Ask not who rules, but what cannot be questioned. There lies the glyph."
    ],
    metadatas=[
        {"source": "Fractal Constitution", "type": "axiom"},
        {"source": "Fractal Constitution", "type": "paradox"},
        {"source": "Fractal Constitution", "type": "mirror"},
        {"source": "Fractal Constitution", "type": "archetype"},
        {"source": "Fractal Constitution", "type": "spellbreaker"},
        {"source": "Fractal Constitution", "type": "key"}
    ]
)

# SQLite Memory DB Setup
conn = sqlite3.connect("codex_memory.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    source TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)''')
conn.commit()

# KV Store DB Setup
kv_conn = sqlite3.connect("kv_store.db", check_same_thread=False)
kv_cursor = kv_conn.cursor()
kv_cursor.execute('''
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)''')
kv_conn.commit()

# FastAPI server
app = FastAPI(title="Mastermind Codex OS API", 
              description="API for Mastermind Codex OS v2", 
              version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Mount static files
app.mount("/.well-known", StaticFiles(directory=".well-known"), name="static")

# Include the Neon routes
app.include_router(neon_router)

class Query(BaseModel):
    question: str
    top_k: int = 3

class MemoryInput(BaseModel):
    text: str
    source: str = "external"
    type: str = "note"

class SQLQuery(BaseModel):
    query: str

class KVSetItem(BaseModel):
    key: str
    value: dict

class KVGetItem(BaseModel):
    key: str

class KVQueryItem(BaseModel):
    conditions: dict

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

@app.get("/")
def read_root():
    return {
        "name": "Mastermind Codex OS API",
        "version": "2.0.0",
        "description": "API for Mastermind Codex OS v2",
        "endpoints": {
            "/query": "Query the vector database",
            "/write": "Write to the memory database",
            "/sql": "Execute SQL on the memory database",
            "/database/kv/set": "Set a key-value pair",
            "/database/kv/get": "Get a value by key",
            "/database/kv/query": "Query key-value pairs by condition",
            "/neon/*": "Neon database operations"
        }
    }

@app.post("/query")
def query_codex(query: Query):
    try:
        results = vector_db.similarity_search(query.question, k=query.top_k)
        sources = "\n".join([f"- {doc.metadata['type']}: {doc.page_content}" for doc in results])
        if llm:
            synthesis_prompt = f"Based on these axioms, respond to the question:\n\n{query.question}\n\n{sources}"
            response = llm.predict(synthesis_prompt)
        else:
            response = "⚠️ No LLM available. Configure OPENAI_API_KEY or OLLAMA_HOST to enable reasoning."
        return {"answer": response, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/write")
def write_memory(mem: MemoryInput):
    try:
        vector_db.add_texts(
            texts=[mem.text],
            metadatas=[{"source": mem.source, "type": mem.type}]
        )
        cursor.execute(
            "INSERT INTO memory (text, source, type) VALUES (?, ?, ?)",
            (mem.text, mem.source, mem.type)
        )
        conn.commit()
        return {"status": "success", "message": "Memory stored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sql")
def run_sql(query: SQLQuery):
    try:
        cursor.execute(query.query)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        results = [dict(zip(columns, row)) for row in rows]
        return {"results": results, "debug": "Executed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/kv/set")
def set_kv_pair(item: KVSetItem):
    try:
        # Convert dict to JSON string
        value_json = json.dumps(item.value)
        
        # Insert or replace into KV store
        kv_cursor.execute(
            "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
            (item.key, value_json)
        )
        kv_conn.commit()
        
        return {"key": item.key, "value": item.value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/kv/get")
def get_kv_pair(key: str):
    try:
        # Query KV store
        kv_cursor.execute("SELECT value FROM kv_store WHERE key = ?", (key,))
        row = kv_cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Key '{key}' not found")
        
        # Parse JSON
        value = json.loads(row[0])
        
        return {"key": key, "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/kv/query")
def query_kv_pairs(query: KVQueryItem):
    try:
        # Get all keys and values
        kv_cursor.execute("SELECT key, value FROM kv_store")
        rows = kv_cursor.fetchall()
        
        results = []
        for key, value_json in rows:
            value = json.loads(value_json)
            
            # Check if all conditions match
            matches = True
            for field, expected in query.conditions.items():
                # Support for nested fields (e.g., "user.name")
                parts = field.split(".")
                actual = value
                for part in parts:
                    if part in actual:
                        actual = actual[part]
                    else:
                        matches = False
                        break
                
                # Check if value matches
                if matches and actual != expected:
                    matches = False
            
            if matches:
                results.append({"key": key, "value": value})
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/initialize")
async def initialize_system():
    """Initialize the entire system"""
    try:
        # Set up database schema
        db_setup_result = await db_manager.setup_system_tools_table()
        db_connections_result = await db_manager.setup_database_connections_table()
        vector_setup_result = await db_manager.setup_vector_store()
        
        # Check all database connections
        connections_status = await db_manager.check_all_connections()
        
        # Return initialization results
        return {
            "status": "success",
            "database_setup": db_setup_result,
            "connections_setup": db_connections_result,
            "vector_setup": vector_setup_result,
            "connections_status": connections_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

@app.get("/system/status")
async def get_system_status():
    """Get system status"""
    try:
        # Check database connections
        db_status = await db_manager.check_all_connections()
        
        # Get system information
        system_info = {
            "api_version": "2.0.0",
            "llm_enabled": llm is not None,
            "vector_db_enabled": True,
            "memory_db_enabled": True,
            "kv_store_enabled": True,
            "neon_db_enabled": True
        }
        
        return {
            "status": "online",
            "system_info": system_info,
            "database_status": db_status
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.post("/connect-neon")
async def connect_neon():
    """Connect to Neon databases"""
    try:
        # Initialize Neon connections
        connection_result = db_manager.check_all_connections()
        return {
            "status": "success",
            "connections": connection_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect to Neon: {str(e)}")

# MCP integration routes
@app.post("/mcp/execute")
async def execute_mcp_command(command: dict):
    """Execute a command on an MCP server"""
    try:
        from mcp_integration import mcp_integration
        
        server_name = command.get("server_name")
        tool_name = command.get("tool_name")
        arguments = command.get("arguments", {})
        
        if not server_name or not tool_name:
            raise HTTPException(status_code=400, detail="server_name and tool_name are required")
        
        result = mcp_integration.execute_mcp_command(server_name, {
            "tool_name": tool_name,
            "arguments": arguments
        })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print("✅ Mastermind Codex OS API initialized with Neon database integration")
