"""
Simplified backend for Mastermind Codex OS v2
This version avoids using HuggingFaceEmbeddings to work around compatibility issues
"""
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import sqlite3
import uvicorn
from mcp_integration import mcp_integration

# Load environment variables
load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
ollama_host = os.getenv("OLLAMA_HOST")
ollama_model = os.getenv("OLLAMA_MODEL", "nous-hermes")
llm = None
ollama_instance = None

# Optional LLM loading
try:
    if openai_key:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4", temperature=0.0, openai_api_key=openai_key)
        print("✅ OpenAI LLM initialized.")
    
    if ollama_host:
        try:
            from langchain_ollama import OllamaLLM
            # Try to connect to existing Ollama instance
            import requests
            # Test if Ollama is running by making a simple request
            try:
                response = requests.get(f"{ollama_host}/api/tags")
                if response.status_code == 200:
                    # Ollama is running, connect to it
                    ollama_instance = OllamaLLM(base_url=ollama_host, model=ollama_model)
                    if not llm:
                        llm = ollama_instance
                    print(f"✅ Ollama LLM initialized with model: {ollama_model}")
            except requests.exceptions.ConnectionError:
                print(f"⚠️ Ollama not running at {ollama_host}. LLM features may be limited.")
        except Exception as ollama_error:
            print(f"⚠️ Failed to initialize Ollama: {ollama_error}")
    
    if not llm and not ollama_instance:
        print("⚠️ No LLM configured. LLM features disabled.")
except Exception as e:
    print(f"⚠️ Failed to load LLM: {e}")

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

# Create collections table
cursor.execute('''
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)''')

# Create collection_items table
cursor.execute('''
CREATE TABLE IF NOT EXISTS collection_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    item_data TEXT NOT NULL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections (id)
)''')

conn.commit()

# FastAPI server
app = FastAPI(title="Mastermind Codex OS v2 API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Create .well-known directory if it doesn't exist
if not os.path.exists(".well-known"):
    os.makedirs(".well-known")

app.mount("/.well-known", StaticFiles(directory=".well-known"), name="static")

class Query(BaseModel):
    question: str
    top_k: int = 3

class MemoryInput(BaseModel):
    text: str
    source: str = "external"
    type: str = "note"

class SQLQuery(BaseModel):
    query: str

class CollectionCreate(BaseModel):
    name: str
    metadata: dict = None
    get_or_create: bool = True

class CollectionItem(BaseModel):
    collection_name: str
    documents: list[str]
    metadatas: list[dict] = None
    ids: list[str] = None
    embeddings: list[list[float]] = None

class CollectionQuery(BaseModel):
    collection_name: str
    query_texts: list[str] = None
    query_embeddings: list[list[float]] = None
    n_results: int = 10
    where: dict = None
    where_document: dict = None
    include: list[str] = None

@app.get("/")
def read_root():
    return {"message": "Mastermind Codex OS v2 API is running"}

@app.post("/query")
def query_codex(query: Query):
    try:
        # In this simplified version, we don't use vector search
        # Instead, we just return a simple response
        if llm:
            response = llm.predict(f"Respond to this question: {query.question}")
        else:
            response = "⚠️ No LLM available. Configure OPENAI_API_KEY or OLLAMA_HOST to enable reasoning."
        return {"answer": response, "sources": "No vector search in simplified version"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/write")
def write_memory(mem: MemoryInput):
    try:
        # Only store in SQLite, not in vector DB
        cursor.execute(
            "INSERT INTO memory (text, source, type) VALUES (?, ?, ?)",
            (mem.text, mem.source, mem.type)
        )
        conn.commit()
        return {"status": "success", "message": "Memory stored in SQLite (vector storage disabled in simplified version)"}
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

# Collection management endpoints
@app.post("/collections/create")
def create_collection(collection: CollectionCreate):
    try:
        import json
        metadata_json = json.dumps(collection.metadata) if collection.metadata else None
        
        # Check if collection exists
        cursor.execute("SELECT id FROM collections WHERE name = ?", (collection.name,))
        result = cursor.fetchone()
        
        if result and collection.get_or_create:
            # Collection exists and get_or_create is True, return existing collection
            return {
                "id": result[0],
                "name": collection.name,
                "metadata": collection.metadata
            }
        elif result:
            # Collection exists but get_or_create is False
            raise HTTPException(status_code=400, detail=f"Collection with name '{collection.name}' already exists")
        
        # Create new collection
        cursor.execute(
            "INSERT INTO collections (name, description) VALUES (?, ?)",
            (collection.name, metadata_json)
        )
        conn.commit()
        collection_id = cursor.lastrowid
        
        return {
            "id": collection_id,
            "name": collection.name,
            "metadata": collection.metadata
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Legacy endpoint for compatibility
class LegacyCollectionItem(BaseModel):
    collection_id: int = None
    collection_name: str = None
    item_data: str = None
    metadata: dict = None

@app.post("/collections/add")
def add_to_collection(item: CollectionItem):
    try:
        import json
        
        # Get collection_id from name
        cursor.execute("SELECT id FROM collections WHERE name = ?", (item.collection_name,))
        result = cursor.fetchone()
        if not result:
            # Create collection if it doesn't exist
            cursor.execute(
                "INSERT INTO collections (name, description) VALUES (?, ?)",
                (item.collection_name, None)
            )
            conn.commit()
            collection_id = cursor.lastrowid
        else:
            collection_id = result[0]
        
        # Process each document
        ids = item.ids or [f"doc_{i}" for i in range(len(item.documents))]
        metadatas = item.metadatas or [None] * len(item.documents)
        
        # Ensure lists are of the same length
        if len(ids) != len(item.documents) or len(metadatas) != len(item.documents):
            raise HTTPException(status_code=400, detail="ids, documents, and metadatas must have the same length")
        
        # Insert each document
        for i, (doc, doc_id, metadata) in enumerate(zip(item.documents, ids, metadatas)):
            metadata_json = json.dumps(metadata) if metadata else None
            
            cursor.execute(
                "INSERT INTO collection_items (collection_id, item_data, metadata) VALUES (?, ?, ?)",
                (collection_id, doc, metadata_json)
            )
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Added {len(item.documents)} documents to collection '{item.collection_name}'",
            "collection_name": item.collection_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for ChromaDB-style add operation
@app.post("/chromadb/collections/add")
def add_to_collection_chromadb(item: CollectionItem):
    try:
        import json
        
        # Get collection_id from name
        cursor.execute("SELECT id FROM collections WHERE name = ?", (item.collection_name,))
        result = cursor.fetchone()
        if not result:
            # Create collection if it doesn't exist
            cursor.execute(
                "INSERT INTO collections (name, description) VALUES (?, ?)",
                (item.collection_name, None)
            )
            conn.commit()
            collection_id = cursor.lastrowid
        else:
            collection_id = result[0]
        
        # Process each document
        ids = item.ids or [f"doc_{i}" for i in range(len(item.documents))]
        metadatas = item.metadatas or [None] * len(item.documents)
        
        # Ensure lists are of the same length
        if len(ids) != len(item.documents) or len(metadatas) != len(item.documents):
            raise HTTPException(status_code=400, detail="ids, documents, and metadatas must have the same length")
        
        # Insert each document
        for i, (doc, doc_id, metadata) in enumerate(zip(item.documents, ids, metadatas)):
            metadata_json = json.dumps(metadata) if metadata else None
            
            cursor.execute(
                "INSERT INTO collection_items (collection_id, item_data, metadata) VALUES (?, ?, ?)",
                (collection_id, doc, metadata_json)
            )
        
        conn.commit()
        
        return {
            "success": True,
            "message": f"Added {len(item.documents)} documents to collection '{item.collection_name}'",
            "collection_name": item.collection_name
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collections/query")
def query_collection(query: CollectionQuery):
    try:
        import json
        
        # Get collection_id from name
        cursor.execute("SELECT id FROM collections WHERE name = ?", (query.collection_name,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail=f"Collection '{query.collection_name}' not found")
        
        collection_id = result[0]
        
        # Query the collection
        if query.query_texts and len(query.query_texts) > 0:
            # Simple text search (in a real implementation, this would use embeddings)
            query_text = query.query_texts[0]
            cursor.execute(
                "SELECT * FROM collection_items WHERE collection_id = ? AND item_data LIKE ? LIMIT ?",
                (collection_id, f"%{query_text}%", query.n_results)
            )
        else:
            # Return all items in the collection
            cursor.execute(
                "SELECT * FROM collection_items WHERE collection_id = ? LIMIT ?",
                (collection_id, query.n_results)
            )
        
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        
        # Format results to match ChromaDB's response format
        documents = []
        metadatas = []
        ids = []
        distances = []
        
        for row in rows:
            row_dict = dict(zip(columns, row))
            documents.append(row_dict.get('item_data'))
            
            # Parse metadata if it exists
            metadata = None
            if row_dict.get('metadata'):
                try:
                    metadata = json.loads(row_dict.get('metadata'))
                except:
                    metadata = {}
            else:
                metadata = {}
            
            metadatas.append(metadata)
            ids.append(str(row_dict.get('id')))
            distances.append(0.0)  # Placeholder for distance
        
        return {
            "ids": ids,
            "documents": documents,
            "metadatas": metadatas,
            "distances": distances
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collections/list")
def list_collections():
    try:
        cursor.execute("SELECT * FROM collections")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        collections = [dict(zip(columns, row)) for row in rows]
        
        return {
            "status": "success",
            "count": len(collections),
            "collections": collections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OllamaRequest(BaseModel):
    message: str
    model: str = None

@app.post("/ollama/chat")
def ollama_chat(request: OllamaRequest):
    try:
        if not ollama_instance:
            raise HTTPException(status_code=500, detail="Ollama is not configured or initialized")
        
        # Use the specified model or default to the one from environment
        model = request.model or ollama_model
        
        # Create a new Ollama instance if the model is different
        from langchain_ollama import OllamaLLM
        current_ollama = ollama_instance
        if model != ollama_model:
            current_ollama = OllamaLLM(base_url=ollama_host, model=model)
        
        # Get response from Ollama
        response = current_ollama.predict(request.message)
        
        return {
            "response": response,
            "model": model
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ollama/models")
def ollama_models():
    try:
        if not ollama_host:
            raise HTTPException(status_code=500, detail="Ollama is not configured")
        
        import requests
        response = requests.get(f"{ollama_host}/api/tags")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch Ollama models")
        
        models = response.json().get("models", [])
        return {
            "models": [model.get("name") for model in models]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PowerShellCommand(BaseModel):
    command: str

@app.post("/execute-powershell")
def execute_powershell(command: PowerShellCommand):
    try:
        import subprocess
        import sys
        
        # Execute PowerShell command
        process = subprocess.Popen(
            ["powershell", "-Command", command.command],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            return {
                "success": False,
                "output": stderr,
                "return_code": process.returncode
            }
        
        return {
            "success": True,
            "output": stdout,
            "return_code": process.returncode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# MCP Integration endpoints
class McpCommand(BaseModel):
    server_name: str
    tool_name: str
    toolArgs: dict

@app.post("/mcp/execute")
def execute_mcp_command(command: McpCommand):
    try:
        result = mcp_integration.execute_mcp_command(command.server_name, {
            "tool_name": command.tool_name,
            "arguments": command.toolArgs
        })
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/servers")
def list_mcp_servers():
    try:
        servers = mcp_integration.list_servers()
        return {
            "servers": servers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/server/{server_name}")
def get_mcp_server_info(server_name: str):
    try:
        server_info = mcp_integration.get_server_info(server_name)
        if not server_info:
            raise HTTPException(status_code=404, detail=f"MCP server '{server_name}' not found")
        
        return {
            "server_name": server_name,
            "info": server_info
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Database operations endpoints
@app.post("/database/vector/add")
def add_to_vector_db(item: dict):
    try:
        result = mcp_integration._vector_store_add(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/vector/search")
def search_vector_db(query: dict):
    try:
        result = mcp_integration._vector_store_search(query)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/vector/delete")
def delete_from_vector_db(item: dict):
    try:
        result = mcp_integration._vector_store_delete(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/kv/set")
def set_kv_pair(item: dict):
    try:
        result = mcp_integration._kv_store_set(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/database/kv/get")
def get_kv_pair(key: str):
    try:
        result = mcp_integration._kv_store_get({"key": key})
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/kv/query")
def query_kv_db(query: dict):
    try:
        result = mcp_integration._kv_store_query(query)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/kv/delete")
def delete_kv_pair(item: dict):
    try:
        result = mcp_integration._kv_store_delete(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# File operations endpoints
@app.post("/file/create")
def create_file(item: dict):
    try:
        result = mcp_integration._file_create(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/read")
def read_file(item: dict):
    try:
        result = mcp_integration._file_read(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/update")
def update_file(item: dict):
    try:
        result = mcp_integration._file_update(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/delete")
def delete_file(item: dict):
    try:
        result = mcp_integration._file_delete(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/list")
def list_files(item: dict):
    try:
        result = mcp_integration._file_list(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/search")
def search_files(item: dict):
    try:
        result = mcp_integration._file_search(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Browser operations endpoints
@app.post("/browser/open")
def open_browser(item: dict):
    try:
        result = mcp_integration._open_browser(item)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print("✅ Simplified Codex backend started. Vector search disabled. SQLite memory enabled.")

if __name__ == "__main__":
    # Try to use port 8001, but fall back to 8002 or 8003 if there's a conflict
    try:
        uvicorn.run(app, host="0.0.0.0", port=8001)
    except OSError:
        try:
            print("Port 8001 is in use, trying port 8002...")
            uvicorn.run(app, host="0.0.0.0", port=8002)
        except OSError:
            print("Port 8002 is also in use, trying port 8003...")
            uvicorn.run(app, host="0.0.0.0", port=8003)
