# Setting Up Real-Time Integration Between Claude and Unity Editor

To create a real-time integration between Claude and the Unity Editor, we need to develop a custom MCP (Model Context Protocol) server that can communicate with Unity. Here's what you'll need:

## Components Required

1. **Unity Editor Plugin**: A custom Unity package that exposes Unity functionality via an API
2. **MCP Server**: A Node.js server that acts as a bridge between Claude and Unity
3. **Configuration Files**: Settings to connect everything together

## Step 1: Create a Unity Editor Plugin

First, we need to create a Unity Editor plugin that can expose Unity's functionality:

1. Create a new folder in your Unity project under `Assets/Editor/ClaudeIntegration`
2. Create the following C# scripts:

### ClaudeUnityBridge.cs

```csharp
using UnityEngine;
using UnityEditor;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace ClaudeIntegration
{
    [InitializeOnLoad]
    public class ClaudeUnityBridge : EditorWindow
    {
        private static TcpListener server;
        private static Thread listenerThread;
        private static bool isRunning = false;
        private static int port = 9000;
        private static ClaudeUnityBridge window;

        private string statusMessage = "Server not running";
        private Vector2 scrollPosition;
        private List<string> logMessages = new List<string>();

        static ClaudeUnityBridge()
        {
            EditorApplication.update += OnEditorUpdate;
        }

        [MenuItem("Claude/Unity Bridge")]
        public static void ShowWindow()
        {
            window = GetWindow<ClaudeUnityBridge>("Claude Unity Bridge");
        }

        private static void OnEditorUpdate()
        {
            // This is called regularly by the Unity Editor
        }

        private void OnGUI()
        {
            GUILayout.Label("Claude Unity Bridge", EditorStyles.boldLabel);
            GUILayout.Label("Status: " + statusMessage);

            GUILayout.BeginHorizontal();
            if (!isRunning)
            {
                if (GUILayout.Button("Start Server"))
                {
                    StartServer();
                }
            }
            else
            {
                if (GUILayout.Button("Stop Server"))
                {
                    StopServer();
                }
            }
            GUILayout.EndHorizontal();

            GUILayout.Label("Port:");
            string newPort = GUILayout.TextField(port.ToString());
            if (int.TryParse(newPort, out int result))
            {
                port = result;
            }

            GUILayout.Label("Log:", EditorStyles.boldLabel);
            scrollPosition = GUILayout.BeginScrollView(scrollPosition, GUILayout.Height(300));
            foreach (var message in logMessages)
            {
                GUILayout.Label(message);
            }
            GUILayout.EndScrollView();
        }

        private void StartServer()
        {
            if (isRunning) return;

            try
            {
                listenerThread = new Thread(new ThreadStart(ListenForClients));
                listenerThread.IsBackground = true;
                listenerThread.Start();
                isRunning = true;
                statusMessage = "Server running on port " + port;
                Log("Server started on port " + port);
            }
            catch (Exception ex)
            {
                statusMessage = "Error starting server: " + ex.Message;
                Log("Error starting server: " + ex.Message);
            }
        }

        private void StopServer()
        {
            if (!isRunning) return;

            try
            {
                isRunning = false;
                server.Stop();
                listenerThread.Abort();
                statusMessage = "Server stopped";
                Log("Server stopped");
            }
            catch (Exception ex)
            {
                statusMessage = "Error stopping server: " + ex.Message;
                Log("Error stopping server: " + ex.Message);
            }
        }

        private void ListenForClients()
        {
            try
            {
                server = new TcpListener(IPAddress.Loopback, port);
                server.Start();

                while (isRunning)
                {
                    TcpClient client = server.AcceptTcpClient();
                    Thread clientThread = new Thread(new ParameterizedThreadStart(HandleClientComm));
                    clientThread.IsBackground = true;
                    clientThread.Start(client);
                }
            }
            catch (SocketException ex)
            {
                if (isRunning)
                {
                    EditorApplication.delayCall += () =>
                    {
                        Log("Socket error: " + ex.Message);
                    };
                }
            }
            catch (Exception ex)
            {
                if (isRunning)
                {
                    EditorApplication.delayCall += () =>
                    {
                        Log("Server error: " + ex.Message);
                    };
                }
            }
        }

        private void HandleClientComm(object client)
        {
            TcpClient tcpClient = (TcpClient)client;
            NetworkStream clientStream = tcpClient.GetStream();

            byte[] message = new byte[4096];
            int bytesRead;

            try
            {
                bytesRead = clientStream.Read(message, 0, 4096);

                if (bytesRead == 0)
                {
                    tcpClient.Close();
                    return;
                }

                string data = Encoding.UTF8.GetString(message, 0, bytesRead);
                EditorApplication.delayCall += () =>
                {
                    Log("Received: " + data);
                    ProcessCommand(data, clientStream);
                };
            }
            catch (Exception ex)
            {
                EditorApplication.delayCall += () =>
                {
                    Log("Error handling client: " + ex.Message);
                };
                tcpClient.Close();
            }
        }

        private void ProcessCommand(string commandJson, NetworkStream clientStream)
        {
            try
            {
                dynamic command = JsonConvert.DeserializeObject(commandJson);
                string action = command.action;
                dynamic result = null;

                switch (action)
                {
                    case "ping":
                        result = new { status = "success", message = "pong" };
                        break;
                    case "getSceneInfo":
                        result = GetSceneInfo();
                        break;
                    case "getGameObjects":
                        result = GetGameObjects();
                        break;
                    case "createGameObject":
                        string objectName = command.name;
                        result = CreateGameObject(objectName);
                        break;
                    case "addComponent":
                        string gameObjectPath = command.gameObjectPath;
                        string componentType = command.componentType;
                        result = AddComponent(gameObjectPath, componentType);
                        break;
                    default:
                        result = new { status = "error", message = "Unknown command: " + action };
                        break;
                }

                string responseJson = JsonConvert.SerializeObject(result);
                byte[] response = Encoding.UTF8.GetBytes(responseJson);
                clientStream.Write(response, 0, response.Length);
                clientStream.Flush();
                Log("Sent response: " + responseJson);
            }
            catch (Exception ex)
            {
                Log("Error processing command: " + ex.Message);
                string errorJson = JsonConvert.SerializeObject(new { status = "error", message = ex.Message });
                byte[] errorResponse = Encoding.UTF8.GetBytes(errorJson);
                clientStream.Write(errorResponse, 0, errorResponse.Length);
                clientStream.Flush();
            }
        }

        private object GetSceneInfo()
        {
            return new
            {
                status = "success",
                sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                sceneCount = UnityEngine.SceneManagement.SceneManager.sceneCount
            };
        }

        private object GetGameObjects()
        {
            var gameObjects = new List<object>();
            foreach (GameObject obj in UnityEngine.Object.FindObjectsOfType(typeof(GameObject)))
            {
                if (obj.transform.parent == null) // Only root objects
                {
                    gameObjects.Add(new
                    {
                        name = obj.name,
                        path = GetGameObjectPath(obj),
                        components = GetComponentNames(obj)
                    });
                }
            }

            return new
            {
                status = "success",
                gameObjects = gameObjects
            };
        }

        private object CreateGameObject(string name)
        {
            GameObject newObj = new GameObject(name);
            return new
            {
                status = "success",
                gameObject = new
                {
                    name = newObj.name,
                    path = GetGameObjectPath(newObj),
                    components = GetComponentNames(newObj)
                }
            };
        }

        private object AddComponent(string gameObjectPath, string componentType)
        {
            GameObject obj = FindGameObjectByPath(gameObjectPath);
            if (obj == null)
            {
                return new { status = "error", message = "GameObject not found: " + gameObjectPath };
            }

            Type type = Type.GetType(componentType);
            if (type == null)
            {
                // Try with UnityEngine namespace
                type = Type.GetType("UnityEngine." + componentType);
            }

            if (type == null)
            {
                return new { status = "error", message = "Component type not found: " + componentType };
            }

            Component component = obj.AddComponent(type);
            return new
            {
                status = "success",
                component = component.GetType().Name
            };
        }

        private string[] GetComponentNames(GameObject obj)
        {
            var components = obj.GetComponents<Component>();
            var names = new string[components.Length];
            for (int i = 0; i < components.Length; i++)
            {
                names[i] = components[i].GetType().Name;
            }
            return names;
        }

        private string GetGameObjectPath(GameObject obj)
        {
            string path = obj.name;
            Transform parent = obj.transform.parent;
            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }
            return path;
        }

        private GameObject FindGameObjectByPath(string path)
        {
            string[] parts = path.Split('/');
            GameObject current = null;

            // Find the root object
            foreach (GameObject obj in UnityEngine.Object.FindObjectsOfType(typeof(GameObject)))
            {
                if (obj.transform.parent == null && obj.name == parts[0])
                {
                    current = obj;
                    break;
                }
            }

            if (current == null) return null;

            // Traverse the hierarchy
            for (int i = 1; i < parts.Length; i++)
            {
                Transform child = current.transform.Find(parts[i]);
                if (child == null) return null;
                current = child.gameObject;
            }

            return current;
        }

        private void Log(string message)
        {
            if (window != null)
            {
                logMessages.Add("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + message);
                window.Repaint();
            }
        }

        private void OnDestroy()
        {
            if (isRunning)
            {
                StopServer();
            }
        }
    }
}
```

## Step 2: Create the MCP Server

Next, we need to create an MCP server that can communicate with both Claude and Unity:

1. Create a new directory for your MCP server: `C:\Users\Mik\Documents\Cline\MCP\unity-mcp-server`
2. Initialize a new Node.js project and install dependencies:

```bash
cd C:\Users\Mik\Documents\Cline\MCP\unity-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk net
```

3. Create the following files:

### index.js

```javascript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import net from 'net';

class UnityMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'unity-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.unityPort = process.env.UNITY_PORT || 9000;
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'ping_unity',
          description: 'Check if Unity is connected',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get_scene_info',
          description: 'Get information about the current Unity scene',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get_game_objects',
          description: 'Get a list of game objects in the scene',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'create_game_object',
          description: 'Create a new game object in the scene',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name for the new game object',
              },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        {
          name: 'add_component',
          description: 'Add a component to a game object',
          inputSchema: {
            type: 'object',
            properties: {
              gameObjectPath: {
                type: 'string',
                description: 'Path to the game object',
              },
              componentType: {
                type: 'string',
                description: 'Type of component to add',
              },
            },
            required: ['gameObjectPath', 'componentType'],
            additionalProperties: false,
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let command;
        
        switch (name) {
          case 'ping_unity':
            command = { action: 'ping' };
            break;
          case 'get_scene_info':
            command = { action: 'getSceneInfo' };
            break;
          case 'get_game_objects':
            command = { action: 'getGameObjects' };
            break;
          case 'create_game_object':
            command = { 
              action: 'createGameObject',
              name: args.name
            };
            break;
          case 'add_component':
            command = { 
              action: 'addComponent',
              gameObjectPath: args.gameObjectPath,
              componentType: args.componentType
            };
            break;
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
        
        const result = await this.sendToUnity(command);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async sendToUnity(command) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let data = '';
      
      client.connect(this.unityPort, '127.0.0.1', () => {
        client.write(JSON.stringify(command));
      });
      
      client.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      client.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Unity response: ${error.message}`));
        }
      });
      
      client.on('error', (error) => {
        reject(new Error(`Unity connection error: ${error.message}`));
      });
      
      // Set a timeout
      setTimeout(() => {
        client.destroy();
        reject(new Error('Unity connection timeout'));
      }, 5000);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Unity MCP server running on stdio');
  }
}

const server = new UnityMcpServer();
server.run().catch(console.error);
```

### package.json

Make sure your package.json has the following:

```json
{
  "name": "unity-mcp-server",
  "version": "0.1.0",
  "description": "MCP server for Unity integration",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "build": "mkdir -p build && cp index.js build/ && chmod +x build/index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0",
    "net": "^1.0.2"
  }
}
```

## Step 3: Build and Configure the MCP Server

1. Build the MCP server:

```bash
cd C:\Users\Mik\Documents\Cline\MCP\unity-mcp-server
npm run build
```

2. Add the MCP server to Claude's configuration:

Edit the file at `C:\Users\Mik\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` and add:

```json
{
  "mcpServers": {
    "unity": {
      "command": "node",
      "args": ["C:/Users/Mik/Documents/Cline/MCP/unity-mcp-server/build/index.js"],
      "env": {
        "UNITY_PORT": "9000"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Step 4: Install Required Unity Packages

In Unity, you'll need to install the Newtonsoft.Json package:

1. Open the Package Manager (Window > Package Manager)
2. Click the "+" button in the top-left corner
3. Select "Add package from git URL..."
4. Enter `com.unity.nuget.newtonsoft-json`
5. Click "Add"

## Step 5: Using the Integration

1. In Unity, open the Claude Unity Bridge window (Claude > Unity Bridge)
2. Click "Start Server" to start the Unity server on port 9000
3. Restart Claude to load the new MCP server configuration
4. You can now use the following tools to interact with Unity:
   - `ping_unity`: Check if Unity is connected
   - `get_scene_info`: Get information about the current scene
   - `get_game_objects`: Get a list of game objects in the scene
   - `create_game_object`: Create a new game object
   - `add_component`: Add a component to a game object

## Example Usage

Once everything is set up, you can interact with Unity using commands like:

```
use_mcp_tool with server_name: unity, tool_name: get_scene_info
```

This will return information about the current Unity scene.

## Troubleshooting

1. **Connection Issues**: Make sure the Unity Editor is running and the Claude Unity Bridge server is started.
2. **Port Conflicts**: If port 9000 is already in use, change it in both the Unity plugin and the MCP server configuration.
3. **Missing Packages**: Ensure Newtonsoft.Json is installed in your Unity project.
