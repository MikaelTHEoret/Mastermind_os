# Unified Launcher for Mastermind Codex OS v2

This document explains the recent updates to the Mastermind Codex OS v2 system and how to use the new unified launcher.

## Recent Updates

1. **Fixed Deprecated Ollama Import**:
   - Updated the code to use `OllamaLLM` from `langchain_ollama` instead of the deprecated `Ollama` class from `langchain_community.llms`.
   - Added the `langchain-ollama` package to the project dependencies.

2. **Resolved Port Conflicts**:
   - Changed the Ollama Nexus server port from 8001 to 8005 to avoid conflicts with the main application.
   - Updated all relevant configuration files to use the new port.

3. **Created Unified Launcher**:
   - Developed a unified launcher script that starts all components in the correct order.
   - Added checks to ensure Ollama is running before starting other components.
   - Provided both batch (.bat) and PowerShell (.ps1) versions of the launcher.

## How to Use the Unified Launcher

### Prerequisites

1. Make sure Ollama is installed and running on your system.
2. Ensure all dependencies are installed by running:
   ```
   pip install -r backend/requirements.txt
   ```

### Starting the System

1. **Using Batch Script**:
   ```
   start-unified.bat
   ```

2. **Using PowerShell Script**:
   ```
   powershell -ExecutionPolicy Bypass -File "start-unified.ps1"
   ```

The launcher will:
1. Check if Ollama is running (and prompt you to start it if it's not)
2. Start the Ollama Nexus backend on port 8005
3. Start the Ollama Nexus MCP server
4. Start the main application backend on port 8001

### Component Overview

- **Ollama**: Local LLM server running on port 11434
- **Ollama Nexus**: Extended API for Ollama with database, file, and browser capabilities (port 8005)
- **Ollama Nexus MCP Server**: MCP integration for Claude to access Ollama Nexus features
- **Main Application Backend**: The primary Mastermind Codex OS v2 backend (port 8001)

### MCP Integration

The system leverages several MCP servers:

1. **github.com/NightTrek/Ollama-mcp**: Direct integration with Ollama for model management and inference
2. **ollama-nexus**: Extended capabilities including database, file operations, and browser automation

## Troubleshooting

- **Port Conflicts**: If you encounter port conflicts, check if any other applications are using ports 8001 or 8005.
- **Ollama Connection Issues**: Ensure Ollama is running and accessible at http://localhost:11434.
- **MCP Server Issues**: Check the Claude MCP settings at `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`.
