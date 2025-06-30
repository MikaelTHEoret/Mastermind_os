# Mastermind Database Dashboard

A synthwave-inspired dashboard for the Mastermind Codex OS database system. This dashboard provides a modern interface for monitoring and managing Neon PostgreSQL databases with a retro 80s aesthetic.

## Features

- **Database Monitoring**: View connection status, tables, and database statistics
- **Cross-Database Operations**: Execute queries across multiple databases
- **Vector Search Integration**: Search for data using vector embeddings
- **Synthwave UI**: Neon pink and cyan aesthetic with retro grid patterns

## Tech Stack

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast, modern build tool
- **React Router**: Routing for React applications
- **Axios**: HTTP client for API requests
- **Lucide React**: Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mastermind-dashboard.git
cd mastermind-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL in `.env` file:
```
VITE_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## Deployment

The dashboard can be easily deployed to Vercel:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

## Configuration

- **API URL**: Set the API URL in `.env` file or environment variables
- **Proxy**: Configure the development proxy in `vite.config.ts`
- **Routing**: Configure routes in `src/App.tsx`

## License

MIT License - See LICENSE file for details.

## Acknowledgements

- Synthwave aesthetic inspired by the 80s retrowave movement
- Database icons by Lucide React
- Created for the Mastermind Codex OS system
