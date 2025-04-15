# Memory System Documentation

## Overview

The Mastermind Codex OS v2 memory system provides persistent storage capabilities through multiple components:

1. SQLite Memory: A relational database for structured data storage
2. Key-Value Database: A simple key-value store for flexible data storage
3. Vector Database: A semantic search database for finding similar content (currently disabled)
4. Ollama Integration: Integration with Ollama for LLM capabilities
5. MCP Servers: Model Context Protocol servers for extended functionality

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| SQLite Memory | ✅ Working | Stores text memories with metadata |
| Key-Value Database | ✅ Working | Stores structured data with flexible schema |
| Vector Database | ❌ Not Working | Issues with embedding generation |
| Ollama Chat | ❌ Not Working | Issues with chat endpoint |
| MCP Integration | ✅ Working | Can execute MCP commands |
| Memory MCP Server | ❌ Not Working | Not available or not configured |

## Usage

### SQLite Memory

The SQLite memory system stores text memories with metadata in a relational database.

```javascript
// Write memory
const writeResponse = await axios.post(`${baseUrl}/write`, {
    text: 'This is a memory',
    source: 'documentation',
    type: 'example'
});

// Query memory
const queryResponse = await axios.post(`${baseUrl}/sql`, {
    query: 'SELECT * FROM memory WHERE source = "documentation" ORDER BY id DESC LIMIT 5'
});
```

### Key-Value Database

The key-value database stores structured data with a flexible schema.

```javascript
// Set key-value pair
const setResponse = await axios.post(`${baseUrl}/database/kv/set`, {
    key: 'user-preferences',
    value: {
        theme: 'dark',
        fontSize: 14,
        notifications: true
    }
});

// Get key-value pair
const getResponse = await axios.get(`${baseUrl}/database/kv/get?key=user-preferences`);

// Query key-value database
const queryResponse = await axios.post(`${baseUrl}/database/kv/query`, {
    conditions: {
        "theme": "dark"
    }
});
```

### MCP Integration

The MCP integration allows executing commands on MCP servers.

```javascript
// Execute MCP command
const mcpResponse = await axios.post(`${baseUrl}/mcp/execute`, {
    server_name: 'database-mcp',
    tool_name: 'kv_store_set',
    toolArgs: {
        key: 'mcp-example',
        value: {
            text: 'This is an example from MCP integration',
            timestamp: new Date().toISOString()
        }
    }
});
```

## Troubleshooting

### Vector Database Issues

The vector database is currently disabled due to issues with embedding generation. To fix this:

1. Ensure Ollama is running and the nomic-embed-text model is available
2. Check the server logs for specific error messages
3. Verify that the vector_store.db file exists and is writable

### Ollama Chat Issues

Ollama chat is currently not working. To fix this:

1. Ensure Ollama is running and the models are available
2. Check the server logs for specific error messages
3. Try using a different model in the chat request

### Memory MCP Server Issues

The Memory MCP server is not available or not configured. To fix this:

1. Ensure the Memory MCP server is installed and configured in the MCP settings
2. Check the MCP settings file at: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
3. Restart VSCode to load the updated MCP settings


## Future Improvements

1. Fix vector database issues to enable semantic search capabilities
2. Fix Ollama chat issues to enable LLM reasoning
3. Enhance the memory system with additional features:
   - Automatic memory summarization
   - Memory prioritization
   - Memory forgetting mechanisms
   - Cross-reference between different memory types
