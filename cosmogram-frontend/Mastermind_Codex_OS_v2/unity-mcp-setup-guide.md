# Setting Up the Unity MCP Integration

I see you already have the Unity MCP package installed on your system at `C:\Users\Mik\Documents\Cline\MCP\unity-mcp`. This is great news! This package allows me (Claude) to interact with your Unity projects through the Model Context Protocol (MCP).

## What You Need

Based on the package requirements:
- Unity 2020.3 LTS or newer (note: currently only works in URP projects)
- Python 3.12 or newer
- uv package manager

## Setup Steps

### 1. Verify Python Installation

Make sure you have Python 3.12+ installed:

```powershell
python --version
```

If not installed or if you have an older version, download from [python.org](https://www.python.org/downloads/).

### 2. Verify uv Package Manager

Check if uv is installed:

```powershell
uv --version
```

If not installed, install it with:

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Then add uv to your PATH:

```powershell
set Path=%USERPROFILE%\.local\bin;%Path%
```

### 3. Open the Unity MCP Window

1. In Unity, go to the menu and look for a "Unity MCP" option
2. Open the Unity MCP window (it should be under "Window > Unity MCP")
3. Make sure the server is running (there should be a status indicator in the window)

If you don't see the Unity MCP menu option, you may need to:
1. Go to `Window > Package Manager`
2. Click the `+` button and select `Add package from git URL`
3. Enter: `https://github.com/justinpbarnett/unity-mcp.git`

### 4. Verify MCP Connection

Once the Unity MCP window is open and the server is running, I should be able to interact with your Unity project. The MCP server should automatically connect when the Unity Editor is open with the Unity MCP window active.

## Available Tools

Based on my analysis of the Unity MCP package, here are the specific tools available:

### 1. GameObject Management
```
manage_gameobject
```
- Create, modify, delete, and find game objects
- Add/remove components
- Set component properties
- Create primitives
- Save objects as prefabs

### 2. Editor Management
```
manage_editor
```
- Play/pause the game
- Get editor state
- Set active tool
- Add tags and layers
- Control editor settings

### 3. Scene Management
```
manage_scene
```
- Open, save, and create scenes
- Get scene information
- Manage scene hierarchy

### 4. Script Management
```
manage_script
```
- Create, view, and update C# scripts
- Compile scripts
- Get script information

### 5. Asset Management
```
manage_asset
```
- Import assets
- Create and modify materials
- Work with prefabs
- Manage project assets

### 6. Console Access
```
read_console
```
- Read Unity console output
- Clear console

### 7. Menu Item Execution
```
execute_menu_item
```
- Execute Unity Editor menu commands

## Troubleshooting

If the connection isn't working:

1. **Unity Bridge Not Running**: Ensure the Unity Editor is open and the MCP window is active. Restart Unity if needed.
2. **Python Server Not Connected**: Verify that Python and uv are correctly installed.
3. **Configuration Issues**: Make sure the MCP client (Claude) is configured to communicate with the Unity MCP server.
4. **Check Unity Console**: Look for any error messages in the Unity console that might indicate issues with the MCP connection.

## Next Steps

Once the connection is established, I can help you with various Unity tasks such as:
- Creating and manipulating game objects
- Managing scenes and assets
- Creating and editing scripts
- Automating editor tasks
- Building and testing your project

Just let me know what you'd like to do with your Unity project, and I can assist you using these tools!
