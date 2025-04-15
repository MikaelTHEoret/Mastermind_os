from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import Qdrant
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import sqlite3

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

# FastAPI server
app = FastAPI()
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

print("✅ Vector Codex stitched. Vector DB always-on. LLM optional. SQL memory enabled. Plugin-ready.")
