# Mastermind_os

A modular, scalable application designed to streamline the creation of autonomous systems. It combines user interaction, distributed computing, and dynamic conversation management into a cohesive architecture.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Installation and Setup](#installation-and-setup)
4. [Core Modules](#core-modules)
5. [Development Workflow](#development-workflow)
6. [API Reference](#api-reference)
7. [Deployment](#deployment)

## Overview

### Purpose and Vision
Mastermind_os is a sophisticated TypeScript/React application that provides a modular framework for building autonomous systems. It features a powerful central nexus for task orchestration, an agent system for autonomous operations, and a flexible memory management system.

### Key Features
- **Modular Architecture**: Components are designed with clear boundaries and interfaces
- **AI Integration**: Built-in support for multiple AI providers (OpenAI, Anthropic, Gemini)
- **Memory Management**: Sophisticated memory system with ChromaDB and IndexedDB support
- **Visual Interface**: Rich set of visualization components and interactive desktop environment
- **Distributed Computing**: Worker pool and network clustering capabilities
- **Security**: Comprehensive permissions system and secure system access controls

## System Architecture

### High-Level Components

1. **Central Nexus (`src/lib/nexus/`)**
   - CentralNexus.ts: Core orchestration engine
   - SirExecutor.ts: Task execution management
   - JohnnyGoGetter.ts: Resource retrieval system
   - Worker.ts & WorkerPool.ts: Distributed task processing

2. **AI System (`src/lib/ai/`)**
   - Multiple provider support (OpenAI, Anthropic, Gemini)
   - Memory-enabled AI interactions
   - Factory pattern for provider instantiation

3. **Memory System (`src/lib/memory/`)**
   - ChromaStore: Vector database integration
   - IndexedDBStore: Local storage management
   - MemoryManager: Unified memory interface

4. **User Interface (`src/components/`)**
   - Desktop.tsx: Main application interface
   - Window.tsx: Window management system
   - Visualization components for data representation
   - Configuration and settings panels

5. **State Management (`src/stores/`)**
   - Nexus state management
   - Window management
   - Configuration storage
   - Module tracking

## Installation and Setup

### Prerequisites
- Node.js 16+
- TypeScript 4.5+
- Modern web browser with:
  - IndexedDB support (Chrome 24+, Firefox 16+, Safari 10+, Edge 12+)
  - ES2020 features support
  - WebWorker support for distributed computing features
  - Local storage enabled for configuration persistence
  - Minimum recommended screen resolution: 1280x720

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/MikaelTHEoret/Mastermind_os.git
cd Mastermind_os
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Core Modules

### Central Nexus
The heart of the system, managing task orchestration and component communication.

```typescript
// Example usage of CentralNexus
import { CentralNexus } from './lib/nexus/CentralNexus';

const nexus = new CentralNexus();
await nexus.initialize();
await nexus.executeTask({
  type: 'process',
  payload: { /* task data */ }
});
```

### Memory Management
Handles storage and retrieval of system data and conversation history.

```typescript
// Example usage of MemoryManager
import { MemoryManager } from './lib/memory/MemoryManager';

const memory = new MemoryManager();
await memory.store('key', { data: 'value' });
const data = await memory.retrieve('key');
```

### AI Integration
Provides unified interface for multiple AI providers.

```typescript
// Example usage of AI factory
import { createAIProvider } from './lib/ai/factory';

const provider = createAIProvider('openai', config);
const response = await provider.complete('Your prompt here');
```

## Development Workflow

### Project Structure
```
mastermind_os/
├── src/
│   ├── components/    # React components
│   ├── lib/          # Core functionality
│   ├── stores/       # State management
│   └── types/        # TypeScript definitions
├── docs/            # Additional documentation
└── tests/          # Test suites
```

### Testing
The project uses Jest for testing. Run tests with:
```bash
npm test
```

### Building
Build the project for production:
```bash
npm run build
```

## API Reference

### Central Nexus API
```typescript
interface NexusTask {
  type: string;
  payload: any;
  priority?: number;
}

interface NexusResponse {
  status: 'success' | 'error';
  data: any;
}
```

### Memory Manager API
```typescript
interface MemoryStore {
  store(key: string, value: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
}
```

## Deployment

### Production Build
1. Build the project:
```bash
npm run build
```

2. Serve the built files:
```bash
npm run serve
```

### Environment Configuration
Key environment variables:
- `VITE_AI_PROVIDER`: Default AI provider
- `VITE_MEMORY_STORE`: Memory storage backend
- `VITE_API_KEYS`: API keys for various services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details

---

For more detailed documentation on specific components, please refer to the docs/ directory.
