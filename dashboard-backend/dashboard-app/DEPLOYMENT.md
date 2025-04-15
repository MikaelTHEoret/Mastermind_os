# Deployment Guide

This guide provides instructions for deploying both the frontend dashboard and backend API for the Mastermind Database Dashboard.

## Frontend Deployment (Vercel)

### Prerequisites
- A Vercel account
- Git installed on your machine
- Node.js 16+ installed

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the dashboard**
   ```bash
   cd dashboard-app
   vercel
   ```

4. **Configure your deployment**
   - Follow the prompts to configure your project
   - Link to your existing project or create a new one
   - Set the environment variables in the Vercel dashboard:
     - `VITE_API_URL`: URL of your backend API

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

6. **Access your deployed dashboard**
   - Your dashboard will be available at `https://your-project-name.vercel.app`

### Environment Variables

For the frontend, set the following environment variables in the Vercel dashboard:

- `VITE_API_URL`: The URL of your backend API

## Backend Deployment (Render)

### Prerequisites
- A Render account
- Git repository with your backend code

### Steps

1. **Create a new Web Service on Render**
   - Log in to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - Name: `mastermind-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main_with_neon:app --host 0.0.0.0 --port $PORT`

3. **Set environment variables**
   - `MASTERMIND_CONNECTION_STRING`: Your Mastermind database connection string
   - `NEURAL_DB_CONNECTION_STRING`: Your NeuralDBApp database connection string
   - `CODEX_DOC_CONNECTION_STRING`: Your CodexDoc database connection string
   - `CODEX_MEMORY_CONNECTION_STRING`: Your CodexMemory database connection string
   - Add any other required environment variables

4. **Deploy the service**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

5. **Access your API**
   - Your API will be available at `https://mastermind-api.onrender.com`

### API Requirements File

Create a `requirements.txt` file in your backend directory with the following contents:

```
fastapi==0.109.0
uvicorn==0.27.0
python-dotenv==1.0.0
psycopg2-binary==2.9.6
langchain==0.1.4
langchain_huggingface==0.0.8
langchain_qdrant==0.0.2
qdrant-client==1.7.0
pydantic==2.5.2
httpx==0.24.1
```

## Database Setup

### Neon PostgreSQL Setup

1. **Create Neon account**
   - Sign up at https://neon.tech
   - Create a new project

2. **Create databases**
   - Create the following databases:
     - `mastermind`
     - `neuralDbApp`
     - `codexDocDb`
     - `codexMemoryDb`

3. **Get connection strings**
   - For each database, get the connection string from the Neon dashboard
   - Format: `postgresql://username:password@hostname:port/database`

4. **Initialize the database**
   - After deploying the API, make a POST request to `/initialize` endpoint
   - This will set up the necessary tables and functions

## Connecting Frontend to Backend

### Update API URL

1. **Get your API URL**
   - After deploying your backend to Render, get the URL (e.g., `https://mastermind-api.onrender.com`)

2. **Update frontend configuration**
   - Set the `VITE_API_URL` environment variable in Vercel
   - Or update `vercel.json` with the correct API URL:
     ```json
     {
       "env": {
         "VITE_API_URL": "https://mastermind-api.onrender.com"
       },
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "https://mastermind-api.onrender.com/:path*"
         }
       ]
     }
     ```

3. **Redeploy frontend**
   - Trigger a redeployment in Vercel to apply changes

## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. **Update backend CORS configuration**
   - In `main_with_neon.py`, ensure the CORS middleware is configured correctly:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["https://your-frontend-domain.vercel.app"],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )
     ```

2. **Check API URLs**
   - Ensure the API URLs in the frontend are correct
   - Use absolute URLs instead of relative paths

### Database Connection Issues

If database connections fail:

1. **Check environment variables**
   - Verify that all connection strings are correctly set in Render

2. **Check IP allowlist**
   - Ensure that Render's IP addresses are allowlisted in Neon

3. **Test connections manually**
   - Test the connection strings using a tool like `psql`

### Deployment Failures

If deployment fails:

1. **Check build logs**
   - Review the build logs in Vercel or Render to identify issues

2. **Verify dependencies**
   - Ensure all dependencies are correctly listed in `package.json` or `requirements.txt`

3. **Check environment compatibility**
   - Verify that the Node.js or Python version is compatible with your code

## Monitoring

### Frontend Monitoring

- Use Vercel Analytics to monitor frontend performance and usage
- Enable Error Tracking in Vercel to catch client-side errors

### Backend Monitoring

- Use Render Metrics to monitor API performance
- Set up logging with a service like Papertrail or Logtail
- Configure health checks in Render

## Security Considerations

- Store sensitive connection strings as environment variables, never in code
- Use HTTPS for all connections
- Implement authentication for API endpoints
- Regularly update dependencies to patch security vulnerabilities

## Backup Strategy

- Enable point-in-time recovery in Neon PostgreSQL
- Schedule regular database backups
- Store application code in a version-controlled repository
- Document deployment configurations
