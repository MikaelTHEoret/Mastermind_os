// Memory System Configuration Script
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the main application backend
const baseUrl = 'http://localhost:8001';

// Configure memory system
async function configureMemorySystem() {
    console.log('Configuring memory system...\n');
    
    // Create configuration object
    const config = {
        // Enable SQLite memory (already working)
        sqlite: {
            enabled: true,
            database: 'codex_memory.db',
            tables: ['memory', 'collections', 'collection_items']
        },
        
        // Enable key-value database (already working)
        keyValue: {
            enabled: true,
            database: 'kv_store.db'
        },
        
        // Configure vector database (not fully working)
        vector: {
            enabled: false, // Set to false until fixed
            database: 'vector_store.db',
            embeddingModel: 'nomic-embed-text'
        },
        
        // Configure Ollama (chat not working)
        ollama: {
            enabled: true,
            host: 'http://localhost:11434',
            models: [],
            chatEnabled: false // Set to false until fixed
        },
        
        // Configure MCP servers
        mcp: {
            servers: [],
            memoryServerEnabled: false // Set to false until fixed
        }
    };
    
    // Get Ollama models
    try {
        const modelsResponse = await axios.get(`${baseUrl}/ollama/models`);
        config.ollama.models = modelsResponse.data.models || [];
        console.log('Available Ollama models:', config.ollama.models);
    } catch (error) {
        console.error('Error getting Ollama models:', error.message);
    }
    
    // Get MCP servers
    try {
        const serversResponse = await axios.get(`${baseUrl}/mcp/servers`);
        config.mcp.servers = serversResponse.data.servers || [];
        console.log('Available MCP servers:', config.mcp.servers);
        
        // Check if memory server is available
        if (config.mcp.servers.includes('github.com/modelcontextprotocol/servers/tree/main/src/memory')) {
            config.mcp.memoryServerEnabled = true;
            console.log('Memory MCP server is available.');
        }
    } catch (error) {
        console.error('Error getting MCP servers:', error.message);
    }
    
    // Save configuration to file
    const configPath = path.join(__dirname, 'memory-system-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`\nConfiguration saved to ${configPath}`);
    
    return config;
}

// Create memory system documentation
function createDocumentation(config) {
    console.log('\nCreating memory system documentation...');
    
    const doc = `# Memory System Documentation

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
| Memory MCP Server | ${config.mcp.memoryServerEnabled ? '✅ Working' : '❌ Not Working'} | ${config.mcp.memoryServerEnabled ? 'Provides knowledge graph capabilities' : 'Not available or not configured'} |

## Usage

### SQLite Memory

The SQLite memory system stores text memories with metadata in a relational database.

\`\`\`javascript
// Write memory
const writeResponse = await axios.post(\`\${baseUrl}/write\`, {
    text: 'This is a memory',
    source: 'documentation',
    type: 'example'
});

// Query memory
const queryResponse = await axios.post(\`\${baseUrl}/sql\`, {
    query: 'SELECT * FROM memory WHERE source = "documentation" ORDER BY id DESC LIMIT 5'
});
\`\`\`

### Key-Value Database

The key-value database stores structured data with a flexible schema.

\`\`\`javascript
// Set key-value pair
const setResponse = await axios.post(\`\${baseUrl}/database/kv/set\`, {
    key: 'user-preferences',
    value: {
        theme: 'dark',
        fontSize: 14,
        notifications: true
    }
});

// Get key-value pair
const getResponse = await axios.get(\`\${baseUrl}/database/kv/get?key=user-preferences\`);

// Query key-value database
const queryResponse = await axios.post(\`\${baseUrl}/database/kv/query\`, {
    conditions: {
        "theme": "dark"
    }
});
\`\`\`

### MCP Integration

The MCP integration allows executing commands on MCP servers.

\`\`\`javascript
// Execute MCP command
const mcpResponse = await axios.post(\`\${baseUrl}/mcp/execute\`, {
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
\`\`\`

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

${config.mcp.memoryServerEnabled ? 'The Memory MCP server is working correctly.' : 'The Memory MCP server is not available or not configured. To fix this:'}
${!config.mcp.memoryServerEnabled ? `
1. Ensure the Memory MCP server is installed and configured in the MCP settings
2. Check the MCP settings file at: \`%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json\`
3. Restart VSCode to load the updated MCP settings
` : ''}

## Future Improvements

1. Fix vector database issues to enable semantic search capabilities
2. Fix Ollama chat issues to enable LLM reasoning
3. Enhance the memory system with additional features:
   - Automatic memory summarization
   - Memory prioritization
   - Memory forgetting mechanisms
   - Cross-reference between different memory types
`;
    
    // Save documentation to file
    const docPath = path.join(__dirname, 'MEMORY_SYSTEM.md');
    fs.writeFileSync(docPath, doc);
    console.log(`Documentation saved to ${docPath}`);
}

// Create memory system API wrapper
function createApiWrapper() {
    console.log('\nCreating memory system API wrapper...');
    
    const wrapper = `// Memory System API Wrapper
const axios = require('axios');

// Base URL for the main application backend
const baseUrl = 'http://localhost:8001';

// Memory System API
class MemorySystem {
    constructor() {
        this.baseUrl = baseUrl;
    }
    
    // SQLite Memory API
    
    /**
     * Write a memory to the SQLite database
     * @param {string} text - The text content of the memory
     * @param {string} source - The source of the memory
     * @param {string} type - The type of memory
     * @returns {Promise<object>} - The response from the server
     */
    async writeMemory(text, source = 'api', type = 'note') {
        try {
            const response = await axios.post(\`\${this.baseUrl}/write\`, {
                text,
                source,
                type
            });
            return response.data;
        } catch (error) {
            console.error('Error writing memory:', error.message);
            throw error;
        }
    }
    
    /**
     * Query the SQLite database
     * @param {string} query - The SQL query to execute
     * @returns {Promise<object>} - The response from the server
     */
    async querySql(query) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/sql\`, {
                query
            });
            return response.data;
        } catch (error) {
            console.error('Error querying SQL:', error.message);
            throw error;
        }
    }
    
    // Key-Value Database API
    
    /**
     * Set a key-value pair in the database
     * @param {string} key - The key
     * @param {object} value - The value
     * @returns {Promise<object>} - The response from the server
     */
    async setKeyValue(key, value) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/database/kv/set\`, {
                key,
                value
            });
            return response.data;
        } catch (error) {
            console.error('Error setting key-value pair:', error.message);
            throw error;
        }
    }
    
    /**
     * Get a value from the database by key
     * @param {string} key - The key
     * @returns {Promise<object>} - The response from the server
     */
    async getKeyValue(key) {
        try {
            const response = await axios.get(\`\${this.baseUrl}/database/kv/get?key=\${key}\`);
            return response.data;
        } catch (error) {
            console.error('Error getting key-value pair:', error.message);
            throw error;
        }
    }
    
    /**
     * Query the key-value database with conditions
     * @param {object} conditions - The conditions to query with
     * @returns {Promise<object>} - The response from the server
     */
    async queryKeyValue(conditions) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/database/kv/query\`, {
                conditions
            });
            return response.data;
        } catch (error) {
            console.error('Error querying key-value database:', error.message);
            throw error;
        }
    }
    
    /**
     * Delete a key-value pair from the database
     * @param {string} key - The key to delete
     * @returns {Promise<object>} - The response from the server
     */
    async deleteKeyValue(key) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/database/kv/delete\`, {
                key
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting key-value pair:', error.message);
            throw error;
        }
    }
    
    // Vector Database API (currently disabled)
    
    /**
     * Add text to the vector database
     * @param {string} text - The text to add
     * @param {object} metadata - The metadata to associate with the text
     * @returns {Promise<object>} - The response from the server
     */
    async addToVectorDb(text, metadata = {}) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/database/vector/add\`, {
                text,
                metadata
            });
            return response.data;
        } catch (error) {
            console.error('Error adding to vector database:', error.message);
            throw error;
        }
    }
    
    /**
     * Search the vector database
     * @param {string} query - The query text
     * @param {number} limit - The maximum number of results to return
     * @returns {Promise<object>} - The response from the server
     */
    async searchVectorDb(query, limit = 5) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/database/vector/search\`, {
                query,
                limit
            });
            return response.data;
        } catch (error) {
            console.error('Error searching vector database:', error.message);
            throw error;
        }
    }
    
    // Ollama API
    
    /**
     * Get available Ollama models
     * @returns {Promise<object>} - The response from the server
     */
    async getOllamaModels() {
        try {
            const response = await axios.get(\`\${this.baseUrl}/ollama/models\`);
            return response.data;
        } catch (error) {
            console.error('Error getting Ollama models:', error.message);
            throw error;
        }
    }
    
    /**
     * Chat with Ollama (currently not working)
     * @param {string} message - The message to send
     * @param {string} model - The model to use
     * @returns {Promise<object>} - The response from the server
     */
    async chatWithOllama(message, model = 'nous-hermes2') {
        try {
            const response = await axios.post(\`\${this.baseUrl}/ollama/chat\`, {
                message,
                model
            });
            return response.data;
        } catch (error) {
            console.error('Error chatting with Ollama:', error.message);
            throw error;
        }
    }
    
    // MCP API
    
    /**
     * List available MCP servers
     * @returns {Promise<object>} - The response from the server
     */
    async listMcpServers() {
        try {
            const response = await axios.get(\`\${this.baseUrl}/mcp/servers\`);
            return response.data;
        } catch (error) {
            console.error('Error listing MCP servers:', error.message);
            throw error;
        }
    }
    
    /**
     * Execute an MCP command
     * @param {string} serverName - The name of the MCP server
     * @param {string} toolName - The name of the tool to execute
     * @param {object} toolArgs - The arguments for the tool
     * @returns {Promise<object>} - The response from the server
     */
    async executeMcpCommand(serverName, toolName, toolArgs) {
        try {
            const response = await axios.post(\`\${this.baseUrl}/mcp/execute\`, {
                server_name: serverName,
                tool_name: toolName,
                toolArgs
            });
            return response.data;
        } catch (error) {
            console.error('Error executing MCP command:', error.message);
            throw error;
        }
    }
}

module.exports = MemorySystem;
`;
    
    // Save API wrapper to file
    const wrapperPath = path.join(__dirname, 'memory-system-api.js');
    fs.writeFileSync(wrapperPath, wrapper);
    console.log(`API wrapper saved to ${wrapperPath}`);
}

// Create memory system example
function createExample() {
    console.log('\nCreating memory system example...');
    
    const example = `// Memory System Example
const MemorySystem = require('./memory-system-api');

// Create memory system instance
const memory = new MemorySystem();

// Example usage
async function runExample() {
    console.log('Memory System Example\n');
    
    try {
        // Write memory
        console.log('Writing memory...');
        const writeResult = await memory.writeMemory(
            'This is an example memory for the Mastermind Codex OS v2',
            'example',
            'documentation'
        );
        console.log('Write result:', writeResult);
        
        // Query memory
        console.log('\nQuerying memory...');
        const queryResult = await memory.querySql(
            'SELECT * FROM memory WHERE source = "example" ORDER BY id DESC LIMIT 5'
        );
        console.log('Query result:', queryResult);
        
        // Set key-value pair
        console.log('\nSetting key-value pair...');
        const setResult = await memory.setKeyValue(
            'example-key',
            {
                text: 'This is an example key-value pair',
                timestamp: new Date().toISOString(),
                metadata: { source: 'example', type: 'documentation' }
            }
        );
        console.log('Set result:', setResult);
        
        // Get key-value pair
        console.log('\nGetting key-value pair...');
        const getResult = await memory.getKeyValue('example-key');
        console.log('Get result:', getResult);
        
        // List MCP servers
        console.log('\nListing MCP servers...');
        const serversResult = await memory.listMcpServers();
        console.log('Servers result:', serversResult);
        
        // Execute MCP command (if database-mcp server is available)
        if (serversResult.servers.includes('database-mcp')) {
            console.log('\nExecuting MCP command...');
            const mcpResult = await memory.executeMcpCommand(
                'database-mcp',
                'kv_store_set',
                {
                    key: 'mcp-example',
                    value: {
                        text: 'This is an example from MCP integration',
                        timestamp: new Date().toISOString()
                    }
                }
            );
            console.log('MCP command result:', mcpResult);
        }
        
        console.log('\nExample completed successfully!');
    } catch (error) {
        console.error('Error running example:', error.message);
    }
}

// Run the example
runExample();
`;
    
    // Save example to file
    const examplePath = path.join(__dirname, 'memory-system-example.js');
    fs.writeFileSync(examplePath, example);
    console.log(`Example saved to ${examplePath}`);
}

// Run the configuration
async function run() {
    try {
        const config = await configureMemorySystem();
        createDocumentation(config);
        createApiWrapper();
        createExample();
        
        console.log('\nMemory system configuration completed successfully!');
        console.log('\nThe following files have been created:');
        console.log('- memory-system-config.json: Configuration for the memory system');
        console.log('- MEMORY_SYSTEM.md: Documentation for the memory system');
        console.log('- memory-system-api.js: API wrapper for the memory system');
        console.log('- memory-system-example.js: Example usage of the memory system');
        
        console.log('\nTo use the memory system:');
        console.log('1. Ensure the unified server is running (start-unified.bat)');
        console.log('2. Run the example: node memory-system-example.js');
        console.log('3. Use the API wrapper in your own code: const MemorySystem = require(\'./memory-system-api\')');
    } catch (error) {
        console.error('Error configuring memory system:', error);
    }
}

// Run the script
run();
