// Simple test script to demonstrate Puppeteer MCP server with Claude
const path = require('path');

// Get the absolute path to the test HTML file
const testPagePath = path.resolve(__dirname, 'test-page.html');
const fileUrl = `file://${testPagePath.replace(/\\/g, '/')}`;

console.log('Starting Puppeteer MCP test with Claude...');
console.log(`Test page URL: ${fileUrl}`);
console.log('\nTo use this with Claude, you can run the following commands:');

console.log(`
1. Navigate to the test page:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_navigate</tool_name>
<arguments>
{
  "url": "${fileUrl}",
  "launchOptions": { "headless": false }
}
</arguments>
</use_mcp_tool>

2. Take a screenshot:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_screenshot</tool_name>
<arguments>
{
  "name": "test-screenshot",
  "width": 800,
  "height": 600
}
</arguments>
</use_mcp_tool>

3. Fill out the form:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_fill</tool_name>
<arguments>
{
  "selector": "#nameInput",
  "value": "Claude Test"
}
</arguments>
</use_mcp_tool>

4. Click the button:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_click</tool_name>
<arguments>
{
  "selector": "#clickButton"
}
</arguments>
</use_mcp_tool>

5. Submit the form:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_click</tool_name>
<arguments>
{
  "selector": "#testForm button"
}
</arguments>
</use_mcp_tool>

6. Execute JavaScript in the browser:
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_evaluate</tool_name>
<arguments>
{
  "script": "document.querySelector('h1').textContent = 'Modified by Claude!'; return 'Title modified successfully';"
}
</arguments>
</use_mcp_tool>

7. Access console logs:
<access_mcp_resource>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<uri>console://logs</uri>
</access_mcp_resource>

8. Access screenshot:
<access_mcp_resource>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<uri>screenshot://test-screenshot</uri>
</access_mcp_resource>
`);

console.log('\nYou can copy and paste these commands into Claude to interact with the Puppeteer MCP server.');
