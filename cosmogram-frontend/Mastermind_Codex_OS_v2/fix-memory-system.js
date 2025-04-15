// Script to fix memory system issues
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Base URL for the main application backend
const baseUrl = 'http://localhost:8001';

// Fix vector database issues
async function fixVectorDb() {
    console.log('Fixing vector database issues...');
    
    try {
        // Check if Qdrant data directory exists
        const qdrantDataPath = path.join(__dirname, 'backend', 'qdrant_data');
        if (!fs.existsSync(qdrantDataPath)) {
            console.log('Creating Qdrant data directory...');
            fs.mkdirSync(qdrantDataPath, { recursive: true });
        }
        
        // Check if vector_store.db exists
        const vectorDbPath = path.join(__dirname, 'vector_store.db');
        if (!fs.existsSync(vectorDbPath)) {
            console.log('Vector store database does not exist. It will be created when needed.');
        }
        
        // Test if Ollama embedding model is available
        console.log('Testing Ollama embedding model...');
        const modelsResponse = await axios.get(`${baseUrl}/ollama/models`);
        const models = modelsResponse.data.models || [];
        
        if (!models.includes('nomic-embed-text:latest')) {
            console.log('Nomic embed text model not found. Pulling the model...');
            // Pull the model using the MCP execute endpoint
            await axios.post(`${baseUrl}/mcp/execute`, {
                server_name: 'ollama-nexus',
                tool_name: 'pull',
                toolArgs: {
                    name: 'nomic-embed-text'
                }
            });
            console.log('Nomic embed text model pulled successfully.');
        } else {
            console.log('Nomic embed text model is available.');
        }
        
        console.log('Vector database issues fixed.');
        return true;
    } catch (error) {
        console.error('Error fixing vector database:', error.message);
        return false;
    }
}

// Fix Ollama issues
async function fixOllama() {
    console.log('\nFixing Ollama issues...');
    
    try {
        // Check if Ollama is running
        console.log('Checking if Ollama is running...');
        const modelsResponse = await axios.get(`${baseUrl}/ollama/models`);
        const models = modelsResponse.data.models || [];
        
        console.log('Available models:', models);
        
        // Check if nous-hermes model is available
        if (!models.includes('nous-hermes:latest') && !models.includes('nous-hermes2:latest')) {
            console.log('Nous-hermes model not found. Using another available model...');
            
            // Find an alternative model
            let alternativeModel = null;
            const preferredModels = ['llama3', 'llama2', 'mistral', 'dolphin-llama3'];
            
            for (const model of preferredModels) {
                const matchingModel = models.find(m => m.includes(model));
                if (matchingModel) {
                    alternativeModel = matchingModel;
                    break;
                }
            }
            
            if (!alternativeModel && models.length > 0) {
                alternativeModel = models[0];
            }
            
            if (alternativeModel) {
                console.log(`Using alternative model: ${alternativeModel}`);
                
                // Update the .env file to use the alternative model
                const envPath = path.join(__dirname, 'backend', '.env');
                if (fs.existsSync(envPath)) {
                    let envContent = fs.readFileSync(envPath, 'utf8');
                    envContent = envContent.replace(/OLLAMA_MODEL=.*/, `OLLAMA_MODEL=${alternativeModel}`);
                    fs.writeFileSync(envPath, envContent);
                    console.log(`Updated .env file to use ${alternativeModel}`);
                }
                
                // Update the ollama-nexus .env file as well
                const nexusEnvPath = path.join(__dirname, 'ollama-nexus', 'backend', '.env');
                if (fs.existsSync(nexusEnvPath)) {
                    let nexusEnvContent = fs.readFileSync(nexusEnvPath, 'utf8');
                    nexusEnvContent = nexusEnvContent.replace(/OLLAMA_MODEL=.*/, `OLLAMA_MODEL=${alternativeModel}`);
                    fs.writeFileSync(nexusEnvPath, nexusEnvContent);
                    console.log(`Updated ollama-nexus .env file to use ${alternativeModel}`);
                }
            } else {
                console.log('No alternative model found. Please pull a model using Ollama.');
            }
        } else {
            console.log('Nous-hermes model is available.');
        }
        
        // Test chat with a simple prompt
        console.log('\nTesting chat with a simple prompt...');
        try {
            const chatResponse = await axios.post(`${baseUrl}/ollama/chat`, {
                message: 'Hello, how are you?',
                model: models[0] // Use the first available model
            });
            console.log('Chat response:', chatResponse.data);
            console.log('Ollama chat is working correctly.');
        } catch (error) {
            console.error('Error testing chat:', error.message);
            console.log('Ollama chat is still not working. Please check the Ollama server logs.');
        }
        
        console.log('Ollama issues fixed.');
        return true;
    } catch (error) {
        console.error('Error fixing Ollama:', error.message);
        return false;
    }
}

// Test MCP memory server
async function testMemoryServer() {
    console.log('\nTesting MCP memory server...');
    
    try {
        // List MCP servers
        console.log('Listing MCP servers...');
        const serversResponse = await axios.get(`${baseUrl}/mcp/servers`);
        const servers = serversResponse.data.servers || [];
        
        if (servers.includes('github.com/modelcontextprotocol/servers/tree/main/src/memory')) {
            console.log('Memory MCP server is available.');
            
            // Test creating an entity
            console.log('\nTesting creating an entity...');
            try {
                const createResponse = await axios.post(`${baseUrl}/mcp/execute`, {
                    server_name: 'github.com/modelcontextprotocol/servers/tree/main/src/memory',
                    tool_name: 'create_entities',
                    toolArgs: {
                        entities: [
                            {
                                name: 'Test_User',
                                entityType: 'person',
                                observations: ['Created during system test', 'Has memory capabilities']
                            }
                        ]
                    }
                });
                console.log('Create entity response:', createResponse.data);
                console.log('Memory MCP server is working correctly.');
                return true;
            } catch (error) {
                console.error('Error creating entity:', error.message);
                console.log('Memory MCP server is not working correctly. Please check the server logs.');
                return false;
            }
        } else {
            console.log('Memory MCP server is not available. Please check the MCP settings.');
            return false;
        }
    } catch (error) {
        console.error('Error testing memory server:', error.message);
        return false;
    }
}

// Run all fixes
async function runFixes() {
    console.log('Starting memory system fixes...\n');
    
    const vectorDbResult = await fixVectorDb();
    const ollamaResult = await fixOllama();
    const memoryServerResult = await testMemoryServer();
    
    console.log('\nFix results:');
    console.log('Vector database:', vectorDbResult ? 'FIXED' : 'FAILED');
    console.log('Ollama:', ollamaResult ? 'FIXED' : 'FAILED');
    console.log('Memory MCP server:', memoryServerResult ? 'WORKING' : 'NOT WORKING');
    
    if (vectorDbResult && ollamaResult && memoryServerResult) {
        console.log('\nAll issues fixed! Memory system should now be working correctly.');
        console.log('\nTo verify, run the test-memory.js script again:');
        console.log('node test-memory.js');
    } else {
        console.log('\nSome issues could not be fixed. Please check the logs for details.');
    }
}

// Run the fixes
runFixes().catch(error => {
    console.error('Error running fixes:', error);
});
