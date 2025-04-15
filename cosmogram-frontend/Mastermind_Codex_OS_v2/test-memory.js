// Test script for memory system
const axios = require('axios');

// Base URL for the main application backend
const baseUrl = 'http://localhost:8001';

// Test vector database operations
async function testVectorDb() {
    console.log('Testing vector database operations...');
    
    try {
        // Add text to vector database
        console.log('Adding text to vector database...');
        const addResponse = await axios.post(`${baseUrl}/database/vector/add`, {
            text: 'This is a test memory for the Mastermind Codex OS v2',
            metadata: { source: 'test-script', type: 'test' }
        });
        console.log('Add response:', addResponse.data);
        
        // Search vector database
        console.log('\nSearching vector database...');
        const searchResponse = await axios.post(`${baseUrl}/database/vector/search`, {
            query: 'test memory',
            limit: 5
        });
        console.log('Search response:', searchResponse.data);
        
        return true;
    } catch (error) {
        console.error('Error testing vector database:', error.message);
        return false;
    }
}

// Test key-value database operations
async function testKvDb() {
    console.log('\nTesting key-value database operations...');
    
    try {
        // Set key-value pair
        console.log('Setting key-value pair...');
        const setResponse = await axios.post(`${baseUrl}/database/kv/set`, {
            key: 'test-memory',
            value: {
                text: 'This is a test memory for the Mastermind Codex OS v2',
                timestamp: new Date().toISOString(),
                metadata: { source: 'test-script', type: 'test' }
            }
        });
        console.log('Set response:', setResponse.data);
        
        // Get key-value pair
        console.log('\nGetting key-value pair...');
        const getResponse = await axios.get(`${baseUrl}/database/kv/get?key=test-memory`);
        console.log('Get response:', getResponse.data);
        
        // Query key-value database
        console.log('\nQuerying key-value database...');
        const queryResponse = await axios.post(`${baseUrl}/database/kv/query`, {
            conditions: {
                "metadata.type": "test"
            }
        });
        console.log('Query response:', queryResponse.data);
        
        return true;
    } catch (error) {
        console.error('Error testing key-value database:', error.message);
        return false;
    }
}

// Test SQLite memory operations
async function testSqlMemory() {
    console.log('\nTesting SQLite memory operations...');
    
    try {
        // Write memory
        console.log('Writing memory...');
        const writeResponse = await axios.post(`${baseUrl}/write`, {
            text: 'This is a test memory for the SQLite database',
            source: 'test-script',
            type: 'test'
        });
        console.log('Write response:', writeResponse.data);
        
        // Query memory
        console.log('\nQuerying memory...');
        const queryResponse = await axios.post(`${baseUrl}/sql`, {
            query: 'SELECT * FROM memory WHERE source = "test-script" ORDER BY id DESC LIMIT 5'
        });
        console.log('Query response:', queryResponse.data);
        
        return true;
    } catch (error) {
        console.error('Error testing SQLite memory:', error.message);
        return false;
    }
}

// Test Ollama operations
async function testOllama() {
    console.log('\nTesting Ollama operations...');
    
    try {
        // Get Ollama models
        console.log('Getting Ollama models...');
        const modelsResponse = await axios.get(`${baseUrl}/ollama/models`);
        console.log('Models response:', modelsResponse.data);
        
        // Chat with Ollama
        console.log('\nChatting with Ollama...');
        const chatResponse = await axios.post(`${baseUrl}/ollama/chat`, {
            message: 'What is the Mastermind Codex OS?',
            model: 'nous-hermes'
        });
        console.log('Chat response:', chatResponse.data);
        
        return true;
    } catch (error) {
        console.error('Error testing Ollama:', error.message);
        return false;
    }
}

// Test MCP integration
async function testMcpIntegration() {
    console.log('\nTesting MCP integration...');
    
    try {
        // List MCP servers
        console.log('Listing MCP servers...');
        const serversResponse = await axios.get(`${baseUrl}/mcp/servers`);
        console.log('Servers response:', serversResponse.data);
        
        // Execute MCP command (if database-mcp server is available)
        if (serversResponse.data.servers.includes('database-mcp')) {
            console.log('\nExecuting MCP command...');
            const mcpResponse = await axios.post(`${baseUrl}/mcp/execute`, {
                server_name: 'database-mcp',
                tool_name: 'kv_store_set',
                toolArgs: {
                    key: 'mcp-test',
                    value: {
                        text: 'This is a test memory from MCP integration',
                        timestamp: new Date().toISOString()
                    }
                }
            });
            console.log('MCP command response:', mcpResponse.data);
        } else {
            console.log('database-mcp server not available');
        }
        
        return true;
    } catch (error) {
        console.error('Error testing MCP integration:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('Starting memory system tests...\n');
    
    const vectorDbResult = await testVectorDb();
    const kvDbResult = await testKvDb();
    const sqlMemoryResult = await testSqlMemory();
    const ollamaResult = await testOllama();
    const mcpResult = await testMcpIntegration();
    
    console.log('\nTest results:');
    console.log('Vector database:', vectorDbResult ? 'PASS' : 'FAIL');
    console.log('Key-value database:', kvDbResult ? 'PASS' : 'FAIL');
    console.log('SQLite memory:', sqlMemoryResult ? 'PASS' : 'FAIL');
    console.log('Ollama:', ollamaResult ? 'PASS' : 'FAIL');
    console.log('MCP integration:', mcpResult ? 'PASS' : 'FAIL');
    
    if (vectorDbResult && kvDbResult && sqlMemoryResult && ollamaResult && mcpResult) {
        console.log('\nAll tests passed! Memory system is working correctly.');
    } else {
        console.log('\nSome tests failed. Check the logs for details.');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
});
