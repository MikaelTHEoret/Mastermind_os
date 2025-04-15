# Neon Database Integration for Mastermind Codex OS v2

This document explains how to use the Neon PostgreSQL database integration with your Mastermind Codex OS v2 system.

## Overview

The integration connects your existing Mastermind system with Neon PostgreSQL databases, providing:

1. Cross-database communication between multiple Neon projects
2. Vector embedding storage in PostgreSQL for semantic search
3. API routes for database operations
4. React components with synthwave design aesthetics
5. Vercel deployment configuration

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd D:\C\GitHub\Mastermind_Codex_OS_v2\backend
   ```

2. Install required Python packages:
   ```bash
   pip install psycopg2-binary fastapi uvicorn
   ```

3. Create a `.env` file with your Neon database connection details:
   ```
   MASTERMIND_PROJECT_ID=fancy-waterfall-67832806
   MASTERMIND_DATABASE=neondb
   MASTERMIND_CONNECTION_STRING=postgresql://neondb_owner:password@ep-shy-heart-a8sfehhz-pooler.eastus2.azure.neon.tech/neondb?sslmode=require
   
   NEURAL_DB_PROJECT_ID=mute-hill-71288021
   NEURAL_DB_DATABASE=neondb
   NEURAL_DB_CONNECTION_STRING=postgresql://neondb_owner:password@ep-steep-boat-a5sm3o8t-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   
   CODEX_DOC_PROJECT_ID=aged-brook-87920580
   CODEX_DOC_DATABASE=neondb
   CODEX_DOC_CONNECTION_STRING=postgresql://neondb_owner:password@ep-falling-leaf-a5mtronb-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   
   CODEX_MEMORY_PROJECT_ID=shy-dawn-30097352
   CODEX_MEMORY_DATABASE=neondb
   CODEX_MEMORY_CONNECTION_STRING=postgresql://neondb_owner:password@ep-quiet-violet-a5qdp34m-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. Run the server with Neon integration:
   ```bash
   uvicorn main_with_neon:app --reload
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd D:\C\GitHub\Mastermind_Codex_OS_v2\frontend
   ```

2. Install required Node.js packages:
   ```bash
   npm install axios
   ```

3. Add the database dashboard component to your routes:
   ```javascript
   // In your router configuration
   import { DatabaseDashboard } from './components/database/DatabaseDashboard';
   
   // Add route
   {
     path: '/database',
     element: <DatabaseDashboard />
   }
   ```

4. Build the frontend:
   ```bash
   npm run build
   ```

### 3. Vercel Deployment

1. Initialize Git repository if not already done:
   ```bash
   git init
   git add .
   git commit -m "Add Neon database integration"
   ```

2. Connect to Vercel:
   ```bash
   npx vercel login
   npx vercel
   ```

3. Follow the prompts to configure your project. The `vercel.json` file is already set up.

## Using the Integration

### 1. Initialize the System

First, make a POST request to the initialization endpoint:

```bash
curl -X POST http://localhost:8000/initialize
```

This will:
- Set up the system_tools table
- Configure database connections
- Create the vector store schema

### 2. Database Dashboard

Access the database dashboard at:
```
http://localhost:5173/database
```

Or after deployment:
```
https://mastermind-os.vercel.app/database
```

The dashboard provides:
- Database connection status
- Table listings
- Schema information
- Visual analytics with synthwave design

### 3. API Usage

The API provides the following endpoints:

#### Database Operations
- `GET /api/neon/status` - Get database connection status
- `GET /api/neon/tables/{database}` - List tables in a database
- `GET /api/neon/schema/{database}/{table}` - Get table schema
- `POST /api/neon/query` - Execute SQL query
- `POST /api/neon/transaction` - Execute SQL transaction
- `POST /api/neon/cross-query` - Execute cross-database query

#### Vector Store
- `POST /api/neon/vector/search` - Search for similar texts
- `POST /api/neon/vector/add` - Add text to vector store

#### System Management
- `POST /api/neon/setup/system-tools` - Set up system tools
- `POST /api/neon/setup/database-connections` - Set up database connections
- `POST /api/neon/setup/vector-store` - Set up vector store
- `POST /api/neon/connection-test` - Test connection between databases

### 4. JavaScript Client

Use the provided API client in your JavaScript code:

```javascript
import api from './lib/api';

// Get database status
const status = await api.database.getStatus();

// Execute SQL query
const results = await api.database.executeQuery(
  'SELECT * FROM system_tools', 
  [], 
  'mastermindDb'
);

// Add to vector store
await api.vector.add(
  'This is a test memory', 
  { source: 'test', type: 'note' }
);

// Search vector store
const searchResults = await api.vector.search(
  'test memory', 
  { source: 'test' }, 
  0.7, 
  10
);
```

## Architecture

### Database Structure

The integration creates the following tables in your Mastermind database:

1. **system_tools** - Stores tool templates and documentation
2. **tool_usage_logs** - Tracks tool usage
3. **database_connections** - Stores connection information
4. **communication_test** - Logs connection tests
5. **communication_bridge** - Manages cross-database operations
6. **vector_store** - Stores texts with vector embeddings

### Components

1. **neon_database.py** - Core database manager
2. **neon_routes.py** - FastAPI routes for database operations
3. **main_with_neon.py** - Updated FastAPI server with Neon integration
4. **DatabaseDashboard.tsx** - React component with synthwave design
5. **api.ts** - JavaScript client for API endpoints
6. **vercel.json** - Vercel deployment configuration

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check your `.env` file for correct connection strings
2. Verify your Neon projects are running
3. Check for firewall restrictions
4. Run the following to test connections:
   ```bash
   curl -X GET http://localhost:8000/api/neon/status
   ```

### Database Setup Failures

If database setup fails:

1. Check PostgreSQL version (must be 13+)
2. Verify user permissions
3. Try manual setup:
   ```bash
   curl -X POST http://localhost:8000/api/neon/setup/system-tools
   curl -X POST http://localhost:8000/api/neon/setup/database-connections
   curl -X POST http://localhost:8000/api/neon/setup/vector-store
   ```

### Frontend Issues

If the dashboard doesn't display correctly:

1. Check browser console for errors
2. Verify API URL in `vercel.json` and `.env` files
3. Test API endpoints directly
4. Clear browser cache

## Next Steps

1. Add authentication to API endpoints
2. Create more specialized dashboards
3. Implement real-time data synchronization
4. Expand vector search capabilities
5. Add data visualization components

## Support

For assistance with this integration, please open an issue in the GitHub repository or contact the maintainer.
