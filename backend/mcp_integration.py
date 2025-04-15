"""
MCP Integration for Mastermind Codex OS v2
This module provides integration with MCP servers for database, browser, and file operations
"""
import os
import json
import subprocess
import requests
from typing import Dict, Any, List, Optional, Union

class McpIntegration:
    def __init__(self):
        self.mcp_servers = self._load_mcp_servers()
        self.db_conn = None  # Add database connection handle

    def db_init(self):
        """Initialize Neon DB connection"""
        import psycopg2
        from dotenv import load_dotenv
        load_dotenv()
        
        try:
            self.db_conn = psycopg2.connect(
                dbname=os.getenv("NEON_DB_NAME"),
                user=os.getenv("NEON_DB_USER"),
                password=os.getenv("NEON_DB_PASSWORD"),
                host=os.getenv("NEON_DB_HOST"),
                port=os.getenv("NEON_DB_PORT", "5432")
            )
            return {"status": "connected", "version": self.check_db_version()}
        except Exception as e:
            return {"error": str(e)}
        
    def _load_mcp_servers(self) -> Dict[str, Dict[str, Any]]:
        """Load MCP server configurations from Claude desktop config"""
        try:
            config_path = os.path.expanduser("~/AppData/Roaming/Claude/claude_desktop_config.json")
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                return config.get("mcpServers", {})
            
            # Try VSCode config if Claude config doesn't exist
            vscode_config_path = os.path.expanduser("~/AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json")
            if os.path.exists(vscode_config_path):
                with open(vscode_config_path, 'r') as f:
                    config = json.load(f)
                return config.get("mcpServers", {})
            
            return {}
        except Exception as e:
            print(f"Error loading MCP servers: {e}")
            return {}
    
    def get_server_info(self, server_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific MCP server"""
        return self.mcp_servers.get(server_name)
    
    def list_servers(self) -> List[str]:
        """List all available MCP servers"""
        return list(self.mcp_servers.keys())
    
    def execute_mcp_command(self, server_name: str, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command on an MCP server"""
        server_info = self.get_server_info(server_name)
        if not server_info:
            return {"error": f"MCP server '{server_name}' not found"}
        
        if server_info.get("disabled", False):
            return {"error": f"MCP server '{server_name}' is disabled"}
        
        # For database-mcp server
        if server_name == "database-mcp":
            return self._execute_database_mcp_command(command)
        
        # For computer-control server
        if server_name == "computer-control":
            return self._execute_computer_control_command(command)
        
        # For browser-tools-mcp
        if server_name == "github.com/AgentDeskAI/browser-tools-mcp":
            return self._execute_browser_tools_command(command)
        
        return {"error": f"Unsupported MCP server: {server_name}"}
    
    def _execute_database_mcp_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command on the database-mcp server"""
        tool_name = command.get("tool_name")
        arguments = command.get("arguments", {})
        
        # Vector database operations
        if tool_name == "vector_store_add":
            return self._vector_store_add(arguments)
        elif tool_name == "vector_store_search":
            return self._vector_store_search(arguments)
        elif tool_name == "vector_store_delete":
            return self._vector_store_delete(arguments)
        
        # Key-value database operations
        elif tool_name == "kv_store_set":
            return self._kv_store_set(arguments)
        elif tool_name == "kv_store_get":
            return self._kv_store_get(arguments)
        elif tool_name == "kv_store_query":
            return self._kv_store_query(arguments)
        elif tool_name == "kv_store_delete":
            return self._kv_store_delete(arguments)
        
        # Ollama operations
        elif tool_name == "ollama_get_embedding":
            return self._ollama_get_embedding(arguments)
        elif tool_name == "ollama_generate":
            return self._ollama_generate(arguments)
        elif tool_name == "ollama_chat":
            return self._ollama_chat(arguments)
        
        # File operations
        elif tool_name == "file_create":
            return self._file_create(arguments)
        elif tool_name == "file_read":
            return self._file_read(arguments)
        elif tool_name == "file_update":
            return self._file_update(arguments)
        elif tool_name == "file_delete":
            return self._file_delete(arguments)
        elif tool_name == "file_list":
            return self._file_list(arguments)
        elif tool_name == "file_search":
            return self._file_search(arguments)
        
        return {"error": f"Unsupported tool: {tool_name}"}
    
    def _execute_computer_control_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command on the computer-control server"""
        tool_name = command.get("tool_name")
        arguments = command.get("arguments", {})
        
        if tool_name == "list_directory":
            return self._list_directory(arguments)
        elif tool_name == "read_file_content":
            return self._read_file_content(arguments)
        elif tool_name == "write_file_content":
            return self._write_file_content(arguments)
        elif tool_name == "open_browser":
            return self._open_browser(arguments)
        
        return {"error": f"Unsupported tool: {tool_name}"}
    
    def _execute_browser_tools_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command on the browser-tools-mcp server"""
        tool_name = command.get("tool_name")
        arguments = command.get("arguments", {})
        
        # Implement browser tools commands here
        return {"error": "Browser tools not implemented yet"}
    
    # Vector database operations
    def _vector_store_add(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Add a text to the vector database"""
        try:
            import requests
            
            # Get text and metadata
            text = arguments.get("text")
            metadata = arguments.get("metadata", {})
            
            if not text:
                return {"error": "Text is required"}

            # Use MCP server for vector storage
            response = requests.post(
                "http://localhost:8002/use_mcp_tool",
                json={
                    "server_name": "database-mcp",
                    "tool_name": "vector_store_add",
                    "arguments": {
                        "text": text,
                        "metadata": metadata
                    }
                },
                headers={"Authorization": f"Bearer nvdb-sk-0a6d5f1e9b1d4c2a8e3f7b0c9d8a5e6f"}
            )
            
            if response.status_code != 200:
                return {"error": f"Database error: {response.text}"}
            
            return response.json()
        except Exception as e:
            return {"error": f"Error adding text to vector database: {str(e)}"}
    
    def _vector_store_search(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Search for similar texts in the vector database"""
        try:
            import sqlite3
            import numpy as np
            from langchain_community.llms import Ollama
            
            # Get query and limit
            query = arguments.get("query")
            limit = arguments.get("limit", 10)
            
            if not query:
                return {"error": "Query is required"}
            
            # Generate embedding for query
            ollama = Ollama(base_url="http://localhost:11434", model="nomic-embed-text")
            query_embedding = ollama.embed_query(query)
            
            # Search in SQLite
            conn = sqlite3.connect("vector_store.db")
            cursor = conn.cursor()
            
            # Get all vectors
            cursor.execute("SELECT id, text, embedding, metadata FROM vector_store")
            rows = cursor.fetchall()
            
            # Calculate cosine similarity
            results = []
            for row in rows:
                vector_id, text, embedding_json, metadata_json = row
                embedding = json.loads(embedding_json)
                metadata = json.loads(metadata_json) if metadata_json else {}
                
                # Calculate cosine similarity
                similarity = np.dot(query_embedding, embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(embedding))
                
                results.append({
                    "id": vector_id,
                    "text": text,
                    "metadata": metadata,
                    "similarity": float(similarity)
                })
            
            # Sort by similarity and limit results
            results.sort(key=lambda x: x["similarity"], reverse=True)
            results = results[:limit]
            
            conn.close()
            
            return {
                "results": results
            }
        except Exception as e:
            return {"error": f"Error searching vector database: {str(e)}"}
    
    def _vector_store_delete(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a vector from the database by ID"""
        try:
            import sqlite3
            
            # Get vector ID
            vector_id = arguments.get("id")
            
            if not vector_id:
                return {"error": "Vector ID is required"}
            
            # Delete from SQLite
            conn = sqlite3.connect("vector_store.db")
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM vector_store WHERE id = ?", (vector_id,))
            conn.commit()
            
            deleted = cursor.rowcount > 0
            conn.close()
            
            if deleted:
                return {"success": True, "message": f"Vector {vector_id} deleted"}
            else:
                return {"error": f"Vector {vector_id} not found"}
        except Exception as e:
            return {"error": f"Error deleting vector: {str(e)}"}
    
    # Key-value database operations
    def _kv_store_set(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Set a key-value pair in the database"""
        try:
            import sqlite3
            
            # Get key and value
            key = arguments.get("key")
            value = arguments.get("value")
            
            if not key:
                return {"error": "Key is required"}
            
            if value is None:
                return {"error": "Value is required"}
            
            # Store in SQLite
            conn = sqlite3.connect("kv_store.db")
            cursor = conn.cursor()
            
            # Create table if it doesn't exist
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Insert or replace key-value pair
            cursor.execute(
                "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
                (key, json.dumps(value))
            )
            
            conn.commit()
            conn.close()
            
            return {
                "key": key,
                "value": value
            }
        except Exception as e:
            return {"error": f"Error setting key-value pair: {str(e)}"}

    def store_trade_data_with_analysis(self, trade_data: Dict[str, Any], analysis_text: str) -> Dict[str, Any]:
        """Store trade data with vector analysis"""
        # Store in vector database
        vec_response = self._vector_store_add({
            "text": analysis_text,
            "metadata": {
                "trade_id": trade_data.get("id"),
                "pair": trade_data.get("pair"),
                "strategy": trade_data.get("strategy"),
                "timestamp": trade_data.get("timestamp")
            }
        })
        
        # Store in KV database
        kv_response = self._kv_store_set({
            "key": f"trade_{trade_data.get('id')}",
            "value": trade_data
        })
        
        return {
            "vector_id": vec_response.get("id"),
            "kv_key": kv_response.get("key"),
            "success": "id" in vec_response and "key" in kv_response
        }
    
    def _kv_store_get(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Get a value from the database by key"""
        try:
            import sqlite3
            
            # Get key
            key = arguments.get("key")
            
            if not key:
                return {"error": "Key is required"}
            
            # Get from SQLite
            conn = sqlite3.connect("kv_store.db")
            cursor = conn.cursor()
            
            cursor.execute("SELECT value FROM kv_store WHERE key = ?", (key,))
            row = cursor.fetchone()
            
            conn.close()
            
            if row:
                value = json.loads(row[0])
                return {
                    "key": key,
                    "value": value
                }
            else:
                return {"error": f"Key {key} not found"}
        except Exception as e:
            return {"error": f"Error getting value: {str(e)}"}
    
    def _kv_store_query(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Query the database with conditions"""
        try:
            import sqlite3
            
            # Get conditions
            conditions = arguments.get("conditions", {})
            
            # Get from SQLite
            conn = sqlite3.connect("kv_store.db")
            cursor = conn.cursor()
            
            cursor.execute("SELECT key, value FROM kv_store")
            rows = cursor.fetchall()
            
            conn.close()
            
            # Filter results based on conditions
            results = []
            for row in rows:
                key, value_json = row
                value = json.loads(value_json)
                
                # Check if value matches all conditions
                match = True
                for cond_key, cond_value in conditions.items():
                    # Support for nested keys (e.g., "user.name")
                    keys = cond_key.split(".")
                    current_value = value
                    for k in keys:
                        if isinstance(current_value, dict) and k in current_value:
                            current_value = current_value[k]
                        else:
                            match = False
                            break
                    
                    if match and current_value != cond_value:
                        match = False
                
                if match:
                    results.append({
                        "key": key,
                        "value": value
                    })
            
            return {
                "results": results
            }
        except Exception as e:
            return {"error": f"Error querying database: {str(e)}"}
    
    def _kv_store_delete(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a key-value pair from the database"""
        try:
            import sqlite3
            
            # Get key
            key = arguments.get("key")
            
            if not key:
                return {"error": "Key is required"}
            
            # Delete from SQLite
            conn = sqlite3.connect("kv_store.db")
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM kv_store WHERE key = ?", (key,))
            conn.commit()
            
            deleted = cursor.rowcount > 0
            conn.close()
            
            if deleted:
                return {"success": True, "message": f"Key {key} deleted"}
            else:
                return {"error": f"Key {key} not found"}
        except Exception as e:
            return {"error": f"Error deleting key-value pair: {str(e)}"}
    
    # Ollama operations
    def _ollama_get_embedding(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Get embeddings for a text using Ollama"""
        try:
            from langchain_community.llms import Ollama
            
            # Get text and model
            text = arguments.get("text")
            model = arguments.get("model", "nomic-embed-text")
            
            if not text:
                return {"error": "Text is required"}
            
            # Generate embedding
            ollama = Ollama(base_url="http://localhost:11434", model=model)
            embedding = ollama.embed_query(text)
            
            return {
                "embedding": embedding,
                "model": model
            }
        except Exception as e:
            return {"error": f"Error generating embedding: {str(e)}"}
    
    def _ollama_generate(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a completion using Ollama"""
        try:
            from langchain_community.llms import Ollama
            
            # Get prompt and model
            prompt = arguments.get("prompt")
            model = arguments.get("model", "llama3")
            
            if not prompt:
                return {"error": "Prompt is required"}
            
            # Generate completion
            ollama = Ollama(base_url="http://localhost:11434", model=model)
            completion = ollama.predict(prompt)
            
            return {
                "completion": completion,
                "model": model
            }
        except Exception as e:
            return {"error": f"Error generating completion: {str(e)}"}
    
    def _ollama_chat(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a chat completion using Ollama"""
        try:
            import requests
            
            # Get messages and model
            messages = arguments.get("messages")
            model = arguments.get("model", "llama3")
            
            if not messages:
                return {"error": "Messages are required"}
            
            # Generate chat completion
            response = requests.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": model,
                    "messages": messages
                }
            )
            
            if response.status_code != 200:
                return {"error": f"Ollama API error: {response.text}"}
            
            result = response.json()
            
            return {
                "message": result.get("message", {}),
                "model": model
            }
        except Exception as e:
            return {"error": f"Error generating chat completion: {str(e)}"}
    
    # File operations
    def _file_create(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Create a file with the given content"""
        try:
            # Get path and content
            path = arguments.get("path")
            content = arguments.get("content")
            
            if not path:
                return {"error": "Path is required"}
            
            if content is None:
                return {"error": "Content is required"}
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            
            # Write content to file
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "path": path,
                "size": len(content)
            }
        except Exception as e:
            return {"error": f"Error creating file: {str(e)}"}
    
    def _file_read(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Read a file and return its content"""
        try:
            # Get path
            path = arguments.get("path")
            
            if not path:
                return {"error": "Path is required"}
            
            # Read file
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                "path": path,
                "content": content,
                "size": len(content)
            }
        except Exception as e:
            return {"error": f"Error reading file: {str(e)}"}
    
    def _file_update(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Update a file with new content"""
        try:
            # Get path and content
            path = arguments.get("path")
            content = arguments.get("content")
            
            if not path:
                return {"error": "Path is required"}
            
            if content is None:
                return {"error": "Content is required"}
            
            # Check if file exists
            if not os.path.exists(path):
                return {"error": f"File {path} not found"}
            
            # Write content to file
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "path": path,
                "size": len(content)
            }
        except Exception as e:
            return {"error": f"Error updating file: {str(e)}"}
    
    def _file_delete(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a file"""
        try:
            # Get path
            path = arguments.get("path")
            
            if not path:
                return {"error": "Path is required"}
            
            # Check if file exists
            if not os.path.exists(path):
                return {"error": f"File {path} not found"}
            
            # Delete file
            os.remove(path)
            
            return {
                "path": path,
                "deleted": True
            }
        except Exception as e:
            return {"error": f"Error deleting file: {str(e)}"}
    
    def _file_list(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """List files in a directory"""
        try:
            # Get path and recursive flag
            path = arguments.get("path")
            recursive = arguments.get("recursive", False)
            
            if not path:
                return {"error": "Path is required"}
            
            # Check if directory exists
            if not os.path.exists(path):
                return {"error": f"Directory {path} not found"}
            
            # List files
            if recursive:
                files = []
                for root, dirs, filenames in os.walk(path):
                    for filename in filenames:
                        file_path = os.path.join(root, filename)
                        files.append({
                            "path": file_path,
                            "size": os.path.getsize(file_path),
                            "modified": os.path.getmtime(file_path)
                        })
            else:
                files = []
                for item in os.listdir(path):
                    item_path = os.path.join(path, item)
                    if os.path.isfile(item_path):
                        files.append({
                            "path": item_path,
                            "size": os.path.getsize(item_path),
                            "modified": os.path.getmtime(item_path)
                        })
            
            return {
                "path": path,
                "files": files
            }
        except Exception as e:
            return {"error": f"Error listing files: {str(e)}"}
    
    def _file_search(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Search for files similar to a query"""
        try:
            # Get query and limit
            query = arguments.get("query")
            limit = arguments.get("limit", 10)
            
            if not query:
                return {"error": "Query is required"}
            
            # This is a simplified implementation that just searches for files containing the query
            # In a real implementation, you would use vector search
            results = []
            for root, dirs, filenames in os.walk("."):
                for filename in filenames:
                    if query.lower() in filename.lower():
                        file_path = os.path.join(root, filename)
                        results.append({
                            "path": file_path,
                            "size": os.path.getsize(file_path),
                            "modified": os.path.getmtime(file_path)
                        })
            
            # Sort by relevance (in this case, just alphabetically) and limit results
            results.sort(key=lambda x: x["path"])
            results = results[:limit]
            
            return {
                "query": query,
                "results": results
            }
        except Exception as e:
            return {"error": f"Error searching files: {str(e)}"}
    
    # Computer control operations
    def _list_directory(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """List files and directories in a specified path"""
        try:
            # Get path
            path = arguments.get("path")
            
            if not path:
                return {"error": "Path is required"}
            
            # Check if directory exists
            if not os.path.exists(path):
                return {"error": f"Directory {path} not found"}
            
            # List files and directories
            items = []
            for item in os.listdir(path):
                item_path = os.path.join(path, item)
                items.append({
                    "name": item,
                    "path": item_path,
                    "type": "directory" if os.path.isdir(item_path) else "file",
                    "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None,
                    "modified": os.path.getmtime(item_path)
                })
            
            return {
                "path": path,
                "items": items
            }
        except Exception as e:
            return {"error": f"Error listing directory: {str(e)}"}
    
    def _read_file_content(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Read the content of a file"""
        try:
            # Get path
            path = arguments.get("path")
            
            if not path:
                return {"error": "Path is required"}
            
            # Check if file exists
            if not os.path.exists(path):
                return {"error": f"File {path} not found"}
            
            # Read file
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                "path": path,
                "content": content,
                "size": len(content)
            }
        except Exception as e:
            return {"error": f"Error reading file: {str(e)}"}
    
    def _write_file_content(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Write content to a file (overwrites existing content)"""
        try:
            # Get path and content
            path = arguments.get("path")
            content = arguments.get("content")
            
            if not path:
                return {"error": "Path is required"}
            
            if content is None:
                return {"error": "Content is required"}
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            
            # Write content to file
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                "path": path,
                "size": len(content)
            }
        except Exception as e:
            return {"error": f"Error writing file: {str(e)}"}
    
    def _open_browser(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Open a URL in the default web browser"""
        try:
            # Get URL
            url = arguments.get("url")
            
            if not url:
                return {"error": "URL is required"}
            
            # Open URL in browser
            import webbrowser
            webbrowser.open(url)
            
            return {
                "url": url,
                "opened": True
            }
        except Exception as e:
            return {"error": f"Error opening browser: {str(e)}"}

# Create a singleton instance
mcp_integration = McpIntegration()
