using UnityEngine;

public class TestUnityMCP : MonoBehaviour
{
    // This is a simple test script to verify that the Unity MCP integration is working
    // Place this script on a GameObject in your scene

    void Start()
    {
        Debug.Log("TestUnityMCP script started. If you can see this message in the Unity console, the script is working.");
        Debug.Log("You can now use Claude to interact with your Unity project through the MCP integration.");
        Debug.Log("Try asking Claude to create a new GameObject or modify this one!");
    }

    // This method can be called by Claude to test the integration
    public void TestMethod()
    {
        Debug.Log("TestMethod called successfully! The Unity MCP integration is working correctly.");
        
        // Create a simple cube to demonstrate that the integration is working
        GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.transform.position = new Vector3(0, 1, 0);
        cube.name = "MCP_Test_Cube";
        
        Debug.Log("Created a test cube named 'MCP_Test_Cube'");
    }
}
