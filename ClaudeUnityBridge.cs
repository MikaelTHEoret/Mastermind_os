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
