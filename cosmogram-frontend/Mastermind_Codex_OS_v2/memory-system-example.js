// Memory System Example
const MemorySystem = require('./memory-system-api');

// Create memory system instance
const memory = new MemorySystem();

// Example usage
async function runExample() {
    console.log('Memory System Example');
    
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
