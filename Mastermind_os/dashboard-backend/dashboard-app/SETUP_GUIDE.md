# Mastermind Dashboard Setup Guide

This guide provides step-by-step instructions for setting up and deploying the Mastermind Database Dashboard. We've prepared all the necessary code files, but you'll need to create a proper React project structure to run them.

## Step 1: Create a New React Project

### Using Vite

```bash
# Create a new React+TypeScript project with Vite
npm create vite@latest mastermind-dashboard -- --template react-ts

# Navigate into the project directory
cd mastermind-dashboard

# Install dependencies
npm install react-router-dom axios lucide-react
npm install -D tailwindcss postcss autoprefixer
```

## Step 2: Set Up Tailwind CSS

```bash
# Initialize Tailwind CSS
npx tailwindcss init -p
```

Then, update the `tailwind.config.js` file with the following content:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon colors for synthwave aesthetic
        'neon-pink': '#ff71ce',
        'neon-blue': '#01cdfe',
        'neon-green': '#05ffa1',
        'neon-purple': '#b967ff',
        'neon-yellow': '#fffb96',
      },
      boxShadow: {
        'neon-pink': '0 0 5px theme("colors.pink.500"), 0 0 20px theme("colors.pink.500")',
        'neon-blue': '0 0 5px theme("colors.cyan.400"), 0 0 20px theme("colors.cyan.400")',
        'neon-green': '0 0 5px theme("colors.green.400"), 0 0 20px theme("colors.green.400")',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(45, 55, 72, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 55, 72, 0.2) 1px, transparent 1px)',
      },
      animation: {
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 'box-shadow': '0 0 5px theme("colors.pink.500"), 0 0 10px theme("colors.pink.500")' },
          '100%': { 'box-shadow': '0 0 10px theme("colors.pink.500"), 0 0 20px theme("colors.pink.500")' },
        },
      },
    },
  },
  plugins: [],
}
```

## Step 3: Update CSS

Replace the content of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background-color: #0f1118;
  --text-color: #e2e8f0;
  --accent-color-pink: #ec4899;
  --accent-color-cyan: #06b6d4;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 0;
}

/* Synthwave-style scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, var(--accent-color-pink), var(--accent-color-cyan));
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #f472b6, #22d3ee);
}

/* Neon text effect */
.neon-text {
  text-shadow: 
    0 0 5px var(--accent-color-pink),
    0 0 10px var(--accent-color-pink),
    0 0 20px var(--accent-color-pink);
}

.neon-text-cyan {
  text-shadow: 
    0 0 5px var(--accent-color-cyan),
    0 0 10px var(--accent-color-cyan),
    0 0 20px var(--accent-color-cyan);
}

/* Neon border effect */
.neon-border {
  box-shadow: 
    0 0 5px var(--accent-color-pink), 
    0 0 10px var(--accent-color-pink);
}

.neon-border-cyan {
  box-shadow: 
    0 0 5px var(--accent-color-cyan), 
    0 0 10px var(--accent-color-cyan);
}
```

## Step 4: Create Directory Structure

```bash
# Create directories
mkdir -p src/components/database
mkdir -p src/lib
mkdir -p public
```

## Step 5: Copy Files

Now, copy all the component files and utility modules to their respective directories:

1. Copy `DatabaseDashboard.tsx` to `src/components/database/`
2. Copy `api.ts` to `src/lib/`
3. Copy `App.tsx` to `src/`
4. Copy `main.tsx` to `src/`
5. Copy `database.svg` to `public/`
6. Copy `vercel.json` to the project root

## Step 6: Test Locally

Start the development server:

```bash
npm run dev
```

Navigate to http://localhost:5173 in your browser to see the dashboard.

## Step 7: Deploy to Vercel

### Prerequisites
- A Vercel account
- Git installed on your machine

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mastermind-dashboard.git
   git push -u origin main
   ```

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Configure your deployment**
   - Follow the prompts to configure your project
   - Set the environment variables in the Vercel dashboard:
     - `VITE_API_URL`: URL of your backend API (e.g., `https://mastermind-api.onrender.com`)

5. **Access your deployed dashboard**
   - Your dashboard will be available at `https://your-project-name.vercel.app`

## Next Steps

1. Configure the backend API to accept requests from your Vercel domain
2. Initialize the database system by calling the `/initialize` endpoint
3. Explore your databases through the dashboard interface

## Troubleshooting

If the app doesn't load properly:
- Check the browser console for errors
- Verify that all files are in the correct locations
- Ensure all dependencies are installed
- Check that the API URL is correctly configured

## Customizing the Dashboard

You can customize the dashboard by:
- Modifying the color scheme in `tailwind.config.js`
- Adding new components to the dashboard
- Extending the API client in `src/lib/api.ts`
- Adding new routes to `src/App.tsx`
