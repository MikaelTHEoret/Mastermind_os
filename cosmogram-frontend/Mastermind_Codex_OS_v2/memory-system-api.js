// Memory System API Wrapper
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
            const response = await axios.post(`${this.baseUrl}/write`, {
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
            const response = await axios.post(`${this.baseUrl}/sql`, {
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
            const response = await axios.post(`${this.baseUrl}/database/kv/set`, {
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
            const response = await axios.get(`${this.baseUrl}/database/kv/get?key=${key}`);
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
            const response = await axios.post(`${this.baseUrl}/database/kv/query`, {
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
            const response = await axios.post(`${this.baseUrl}/database/kv/delete`, {
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
            const response = await axios.post(`${this.baseUrl}/database/vector/add`, {
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
            const response = await axios.post(`${this.baseUrl}/database/vector/search`, {
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
            const response = await axios.get(`${this.baseUrl}/ollama/models`);
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
            const response = await axios.post(`${this.baseUrl}/ollama/chat`, {
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
            const response = await axios.get(`${this.baseUrl}/mcp/servers`);
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
            const response = await axios.post(`${this.baseUrl}/mcp/execute`, {
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
