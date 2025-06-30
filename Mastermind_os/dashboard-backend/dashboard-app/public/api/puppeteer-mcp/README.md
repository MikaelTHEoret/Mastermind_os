# Puppeteer MCP Server

This directory contains the setup for the Puppeteer MCP server, which provides browser automation capabilities to Claude using the Model Context Protocol (MCP).

## Overview

The Puppeteer MCP server enables Claude to interact with web pages, take screenshots, and execute JavaScript in a real browser environment. This allows Claude to:

- Navigate to any URL
- Take screenshots of web pages
- Fill out forms
- Click on elements
- Execute JavaScript in the browser
- Access console logs
- And more!

## Setup

The server has been installed and configured with the following steps:

1. Created the directory for the Puppeteer MCP server
2. Installed the Puppeteer MCP server package using npm
3. Added the server configuration to the MCP settings file
4. Created test files to demonstrate the server's capabilities

## Configuration

The server is configured in the MCP settings file at:
`C:/Users/Mik/AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

The configuration uses the following settings:

```json
"github.com/modelcontextprotocol/servers/tree/main/src/puppeteer": {
    "command": "npx",
    "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
    ],
    "disabled": false,
    "autoApprove": []
}
```

## Available Tools

The Puppeteer MCP server provides the following tools:

- **puppeteer_navigate**: Navigate to any URL in the browser
- **puppeteer_screenshot**: Capture screenshots of the entire page or specific elements
- **puppeteer_click**: Click elements on the page
- **puppeteer_hover**: Hover elements on the page
- **puppeteer_fill**: Fill out input fields
- **puppeteer_select**: Select an element with SELECT tag
- **puppeteer_evaluate**: Execute JavaScript in the browser console

## Available Resources

The server provides access to two types of resources:

1. **Console Logs** (`console://logs`): Browser console output in text format
2. **Screenshots** (`screenshot://<name>`): PNG images of captured screenshots

## Testing

To test the Puppeteer MCP server, you can run one of the following scripts:

- **run-test.bat**: Windows batch file to run the test script
- **run-test.ps1**: PowerShell script to run the test script

These scripts will:
1. Open a test HTML page
2. Take a screenshot
3. Fill out a form
4. Click a button
5. Submit the form
6. Take another screenshot
7. Retrieve console logs

## Using with Claude

To use the Puppeteer MCP server with Claude, you can use the MCP tools directly. Examples are provided in the `test-with-claude.js` file.

Here's a simple example of how to navigate to a page and take a screenshot:

```
<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_navigate</tool_name>
<arguments>
{
  "url": "https://example.com",
  "launchOptions": { "headless": false }
}
</arguments>
</use_mcp_tool>

<use_mcp_tool>
<server_name>github.com/modelcontextprotocol/servers/tree/main/src/puppeteer</server_name>
<tool_name>puppeteer_screenshot</tool_name>
<arguments>
{
  "name": "example-screenshot",
  "width": 800,
  "height": 600
}
</arguments>
</use_mcp_tool>
```

## Files

- **test-page.html**: A simple HTML page for testing the Puppeteer MCP server
- **test-puppeteer.js**: A Node.js script that demonstrates the Puppeteer MCP server's capabilities
- **test-with-claude.js**: Examples of how to use the Puppeteer MCP server with Claude
- **run-test.bat**: Windows batch file to run the test script
- **run-test.ps1**: PowerShell script to run the test script
- **restart-vscode.bat**: Script to restart VSCode to apply MCP settings changes

## Troubleshooting

If you encounter issues with the Puppeteer MCP server:

1. Make sure VSCode has been restarted after installing the server
2. Check that the server is properly configured in the MCP settings file
3. Verify that the server is not disabled in the MCP settings
4. Run the test scripts to see if the server is working properly

## License

The Puppeteer MCP server is licensed under the MIT License.
