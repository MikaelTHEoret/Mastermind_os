import uvicorn
from vector import app

if __name__ == "__main__":
    print("Starting Vector Codex server on port 8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
