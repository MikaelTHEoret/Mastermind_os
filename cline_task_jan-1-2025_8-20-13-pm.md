**User:**

<task>
The issues you encountered in your tests were related to how environment variables and the ImportMeta interface were defined and utilized in your code. This update adjusts the env.ts file to simplify environment handling by removing the unused ImportMeta interface and ensuring all environment variables can fallback correctly when not found.

This should resolve the TypeScript error TS6196: 'ImportMeta' is declared but never used.

Steps Forward
Re-run your tests: Execute npm test again to confirm the TypeScript errors are resolved and tests execute properly.
Validate the functionality: Ensure your updated env.ts correctly loads environment variables for all modes (development, test, production).
Log Testing Results: If any tests fail, inspect the error logs for additional context or misconfigurations.
Would you like additional assistance debugging the test failures if they persist? 🚀





You said:
what update ? 
ChatGPT tells you:

The BaseProvider code includes a robust implementation for enforcing rate limits, handling retries, fallbacks, and testing connections. However, based on your concerns and the potential issues seen in your repository or system, here are potential updates or clarifications that could improve functionality and usability:

Issues or Improvements:
1. Dynamic Environment Variable Loading
The code assumes the presence of environment variables like apiBaseUrl, fallbackProvider, and fallbackApiKey. If these aren't properly set, errors will occur during execution.

Improvement: Add environment variable validation at initialization.
typescript

Copy the code
constructor(config: AIConfig) {
  this.config = config;

  if (!this.config.apiKey) {
    throw new AppError("API key is missing in configuration.", this.constructor.name);
  }
  if (!this.config.apiBaseUrl) {
    throw new AppError("API base URL is missing in configuration.", this.constructor.name);
  }

  this.rateLimit = config.rateLimit || DEFAULT_RATE_LIMIT;
}
2. Clearer Error Messages for Fallbacks
The current implementation can obscure why the primary or fallback operation failed. Adding detailed logs or debug-level information would improve debugging.

Improvement: Add more granular error handling.
typescript

Copy the code
protected async withFallback<T>(
  
  ope
operation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await this.withRetry(operation, context);
  } catch (error) {
    console.warn(`Primary operation failed for ${context}: ${error instanceof Error ? error.message : error}`);
    if (!this.config.fallbackProvider) {
      throw error;
    }

    console.info(`Attempting fallback operation for ${context}...`);
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      console.error(`Fallback operation failed for ${context}: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`);
      throw new AppError(
        `Both primary and fallback operations failed for ${context}.`,
        this.constructor.name,
        { primary: error, fallback: fallbackError }
      );
    }
  }
}
3. Enhanced Connection Testing
The testConnection() method performs a basic check using an HTTP HEAD request. If the server doesn't handle HEAD correctly, this can result in misleading failures.

Improvement: Add fallback to GET if HEAD fails.
typescript

Copy the code
protected async testConnection(): Promise<void> {
  try {
    const response = await fetch(this.config.apiBaseUrl, { method: 'HEAD' });
    if (!response.ok) throw new Error(`HEAD request failed: ${response.statusText}`);
    console.log(`Connection to ${this.config.apiBaseUrl} successful.`);
  } catch (headError) {
    console.warn(`HEAD request failed. Attempting GET for connection test...`);
    try {
      const response = await fetch(this.config.apiBaseUrl, { method: 'GET' });
      if (!response.ok) throw new Error(`GET request failed: ${response.statusText}`);
      console.log(`Connection to ${this.config.apiBaseUrl} successful via GET.`);
    } catch (getError) {
      throw new AppError(
        `Connection to ${this.config.apiBaseUrl} failed. HEAD: ${
          headError instanceof Error ? headError.message : headError
        }. GET: ${getError instanceof Error ? getError.message : getError}`,
        this.constructor.name,
        { headError, getError }
      );
    }
  }
}

        { headErro
4. Queue Cancellation Support
The current queueRequest function queues requests sequentially, but there's no mechanism to cancel pending requests.

Improvement: Add cancellation support using an AbortController.
typescript

Copy the code
protected queueRequest<T>(operation: () => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const signal = controller.signal;

  this.requestQueue = this.requestQueue
    .then(() => operation())
    .catch(error => {
      
 
if (signal.aborted) {
        console.warn('Request cancelled:', error);
        throw new AppError('Request was cancelled.', this.constructor.name);
      }
      
  
console.error('Error in queued operation:', error);
      throw error;
    });

  return this.requestQueue;
}

cancelQueue(): void {
  const controller = new AbortController();
  controller.abort();
  console.info('All queued requests have been cancelled.');
}
5. Token Count Logging
Token usage is tracked but not logged. Add logging to help monitor token usage for debugging and optimization.

Improvement: Log token usage statistics during rate-limit enforcement.
typescript

Copy the code
protected async enforceRateLimit(estimatedTokens: number = 0): Promise<void> {
  
  c
const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Clean up old timestamps and token counts
  this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
  this.tokenCounts = this.tokenCounts.filter((_, i) => this.requestTimestamps[i] > oneMinuteAgo);

  const totalTokens = this.tokenCounts.reduce((sum, count) => sum + count, 0) + estimatedTokens;

  console.info(`Rate limit check: ${this.requestTimestamps.length} requests, ${totalTokens} tokens used in the last minute.`);

  if (this.requestTimestamps.length >= this.rateLimit.maxRequestsPerMinute) {
    const waitTime = this.requestTimestamps[0] - oneMinuteAgo;
    console.warn(`Rate limit reached. Waiting ${waitTime}ms to proceed.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.enforceRateLimit(estimatedTokens);
  }

  if (totalTokens >= this.rateLimit.maxTokensPerMinute) {
    const waitTime = this.requestTimestamps[0] - oneMinuteAgo;
    console.warn(`Token limit reached. Waiting ${waitTime}ms to proceed.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.enforceRateLimit(estimatedTokens);
  }

  // Record the request
  this.requestTimestamps.push(now);
  this.tokenCounts.push(estimatedTokens);
}


//


[{
	"resource": "/c:/Users/Mik/Documents/GitHub/Mastermind_os/use me as a template to build upon/src/lib/memory/__tests__/performance.test.ts",
	"owner": "Jest (Mastermind_os)",
	"severity": 8,
	"message": "  ● Test suite failed to run\n\n    Jest encountered an unexpected token\n\n    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.\n\n    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.\n\n    By default \"node_modules\" folder is ignored by transformers.\n\n    Here's what you can do:\n     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.\n     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript\n     • To have some of your \"node_modules\" files transformed, you can specify a custom \"transformIgnorePatterns\" in your config.\n     • If you need a custom transformation specify a \"transform\" option in your config.\n     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the \"moduleNameMapper\" config option.\n\n    You'll find more details and examples of these config options in the docs:\n    https://jestjs.io/docs/configuration\n    For information about custom transformations, see:\n    https://jestjs.io/docs/code-transformation\n\n    Details:\n\n    C:\\Users\\Mik\\Documents\\GitHub\\Mastermind_os\\use me as a template to build upon\\src\\lib\\utils\\env.ts:24\n            return import.meta.env[key] || defaultValue;\n                          ^^^^\n\n    SyntaxError: Cannot use 'import.meta' outside a module\n\n      101 | }\n      102 |\n    > 103 | import { getEnvVar } from '../lib/utils/env';\n          | ^\n      104 |\n      105 | // Get environment variables\n      106 | const getEnvVars = (): EnvVars => {\n\n      at Runtime.createScriptFromCode (../../../../node_modules/jest-runtime/build/index.js:1505:14)\n      at Object.<anonymous> (src/stores/configStore.ts:103:1)\n      at Object.<anonymous> (src/lib/memory/MemoryManager.ts:1:1)\n      at Object.<anonymous> (src/lib/memory/__tests__/performance.test.ts:1:1)\n",
	"source": "Jest",
	"startLineNumber": 1,
	"startColumn": 1,
	"endLineNumber": 1,
	"endColumn": 1
}]
</task>
<environment_details>
# VSCode Visible Files
use me as a template to build upon/src/lib/memory/__tests__/error-recovery.test.ts

# VSCode Open Tabs
use me as a template to build upon/.env
use me as a template to build upon/src/lib/memory/MemoryManager.ts
use me as a template to build upon/src/lib/memory/test.ts
use me as a template to build upon/src/lib/nexus/CentralNexus.ts
use me as a template to build upon/src/lib/storage/db.ts
use me as a template to build upon/src/lib/storage/__tests__/db.test.ts
use me as a template to build upon/src/lib/memory/__tests__/performance.test.ts
use me as a template to build upon/src/test-env.d.ts
use me as a template to build upon/src/setupTests.ts
use me as a template to build upon/src/lib/utils/env.ts
use me as a template to build upon/tsconfig.test.json
use me as a template to build upon/jest.config.js
use me as a template to build upon/src/lib/memory/__tests__/error-recovery.test.ts
use me as a template to build upon/src/stores/configStore.ts
use me as a template to build upon/src/lib/memory/__tests__/memory.test.ts
use me as a template to build upon/src/lib/utils/testConfig.ts
use me as a template to build upon/.env.example

# Current Working Directory (c:/Users/Mik/Documents/GitHub/Mastermind_os) Files
.gitattributes
.gitignore
agent_system.md
API_Validity_and_Testing.md
central_nexus.md
chat.html
Cline_Validation_Update.md
conversations.json
distributed_computing.md
Error_Handling.md
Memory_Management.md
modular_architecture.md
README.md
Testing_Framework.md
visualization_and_interface.md
use me as a template to build upon/
use me as a template to build upon/.env
use me as a template to build upon/.env.example
use me as a template to build upon/.gitignore
use me as a template to build upon/eslint.config.js
use me as a template to build upon/index.html
use me as a template to build upon/jest.config.js
use me as a template to build upon/package-lock.json
use me as a template to build upon/package.json
use me as a template to build upon/postcss.config.js
use me as a template to build upon/tailwind.config.js
use me as a template to build upon/tsconfig.app.json
use me as a template to build upon/tsconfig.json
use me as a template to build upon/tsconfig.node.json
use me as a template to build upon/tsconfig.test.json
use me as a template to build upon/vite.config.ts
use me as a template to build upon/docs/
use me as a template to build upon/docs/FEATURES.md
use me as a template to build upon/docs/MEMORY.md
use me as a template to build upon/docs/OVERVIEW.md
use me as a template to build upon/docs/ROADMAP.md
use me as a template to build upon/src/
use me as a template to build upon/src/App.tsx
use me as a template to build upon/src/env.d.ts
use me as a template to build upon/src/index.css
use me as a template to build upon/src/main.tsx
use me as a template to build upon/src/setupTests.ts
use me as a template to build upon/src/types.ts
use me as a template to build upon/src/vite-env.d.ts
use me as a template to build upon/src/components/
use me as a template to build upon/src/components/Chat.tsx
use me as a template to build upon/src/components/CodeGenerator.tsx
use me as a template to build upon/src/components/ConfigPanel.tsx
use me as a template to build upon/src/components/Console.tsx
use me as a template to build upon/src/components/CreateAgentDialog.tsx
use me as a template to build upon/src/components/Dashboard.tsx
use me as a template to build upon/src/components/Desktop.tsx
use me as a template to build upon/src/components/FileDropzone.tsx
use me as a template to build upon/src/components/FileUpload.tsx
use me as a template to build upon/src/components/InstructionsEditor.tsx
use me as a template to build upon/src/components/KnowledgeBaseEditor.tsx
use me as a template to build upon/src/components/Layout.tsx
use me as a template to build upon/src/components/MessageList.tsx
use me as a template to build upon/src/components/NetworkMonitor.tsx
use me as a template to build upon/src/components/NexusTerminal.tsx
use me as a template to build upon/src/components/PermissionsEditor.tsx
use me as a template to build upon/src/components/Settings.tsx
use me as a template to build upon/src/components/Sidebar.tsx
use me as a template to build upon/src/components/SystemMonitor.tsx
use me as a template to build upon/src/components/Taskbar.tsx
use me as a template to build upon/src/components/Toolbar.tsx
use me as a template to build upon/src/components/Visualizer.tsx
use me as a template to build upon/src/components/Window.tsx
use me as a template to build upon/src/components/ui/
use me as a template to build upon/src/components/ui/tabs.tsx
use me as a template to build upon/src/components/visualizations/
use me as a template to build upon/src/components/visualizations/CircuitBoard.tsx
use me as a template to build upon/src/components/visualizations/ForceGraph.tsx
use me as a template to build upon/src/components/visualizations/HexagonGrid.tsx
use me as a template to build upon/src/components/visualizations/MetricFlows.tsx
use me as a template to build upon/src/components/visualizations/NeuralNetwork.tsx
use me as a template to build upon/src/components/visualizations/TreeView.tsx
use me as a template to build upon/src/components/windows/
use me as a template to build upon/src/components/windows/AgentWindow.tsx
use me as a template to build upon/src/components/windows/ExecutorWindow.tsx
use me as a template to build upon/src/components/windows/JohnnyWindow.tsx
use me as a template to build upon/src/components/windows/ModuleWindow.tsx
use me as a template to build upon/src/components/windows/SystemWindow.tsx
use me as a template to build upon/src/lib/
use me as a template to build upon/src/lib/utils.ts
use me as a template to build upon/src/lib/__mocks__/
use me as a template to build upon/src/lib/__mocks__/env.ts
use me as a template to build upon/src/lib/ai/
use me as a template to build upon/src/lib/ai/factory.ts
use me as a template to build upon/src/lib/ai/MemoryEnabledProvider.ts
use me as a template to build upon/src/lib/ai/types.ts
use me as a template to build upon/src/lib/ai/mock/
use me as a template to build upon/src/lib/ai/mock/localEmbeddings.ts
use me as a template to build upon/src/lib/ai/providers/
use me as a template to build upon/src/lib/ai/providers/anthropic.ts
use me as a template to build upon/src/lib/ai/providers/BaseProvider.ts
use me as a template to build upon/src/lib/ai/providers/gemini.ts
use me as a template to build upon/src/lib/ai/providers/ollama.ts
use me as a template to build upon/src/lib/ai/providers/openai.ts
use me as a template to build upon/src/lib/config/
use me as a template to build upon/src/lib/config/agentConfig.ts
use me as a template to build upon/src/lib/config/permissions.ts
use me as a template to build upon/src/lib/config/systemConfig.ts
use me as a template to build upon/src/lib/events/
use me as a template to build upon/src/lib/events/EventEmitter.ts
use me as a template to build upon/src/lib/fs/
use me as a template to build upon/src/lib/fs/permissions.ts
use me as a template to build upon/src/lib/knowledge/
use me as a template to build upon/src/lib/knowledge/KnowledgeManager.ts
use me as a template to build upon/src/lib/knowledge/types.ts
use me as a template to build upon/src/lib/memory/
use me as a template to build upon/src/lib/memory/ChromaStore.ts
use me as a template to build upon/src/lib/memory/chromaTypes.ts
use me as a template to build upon/src/lib/memory/IndexedDBStore.ts
use me as a template to build upon/src/lib/memory/MemoryManager.ts
use me as a template to build upon/src/lib/memory/test.ts
use me as a template to build upon/src/lib/memory/types.ts
use me as a template to build upon/src/lib/memory/__tests__/
use me as a template to build upon/src/lib/memory/__tests__/error-recovery.test.ts
use me as a template to build upon/src/lib/memory/__tests__/memory.test.ts
use me as a template to build upon/src/lib/memory/__tests__/performance.test.ts
use me as a template to build upon/src/lib/modules/
use me as a template to build upon/src/lib/modules/moduleManager.ts
use me as a template to build upon/src/lib/modules/types.ts
use me as a template to build upon/src/lib/modules/examples/
use me as a template to build upon/src/lib/modules/examples/chatLogProcessor.ts
use me as a template to build upon/src/lib/modules/examples/codeAnalysis.ts
use me as a template to build upon/src/lib/modules/examples/dataAnalyzer.ts
use me as a template to build upon/src/lib/modules/examples/documentSorter.ts
use me as a template to build upon/src/lib/modules/examples/logParser.ts
use me as a template to build upon/src/lib/network/
use me as a template to build upon/src/lib/network/cluster.ts
use me as a template to build upon/src/lib/network/discovery.ts
use me as a template to build upon/src/lib/network/networkManager.ts
use me as a template to build upon/src/lib/network/types.ts
use me as a template to build upon/src/lib/nexus/
use me as a template to build upon/src/lib/nexus/CentralNexus.ts
use me as a template to build upon/src/lib/nexus/JohnnyGoGetter.ts
use me as a template to build upon/src/lib/nexus/SirExecutor.ts
use me as a template to build upon/src/lib/nexus/types.ts
use me as a template to build upon/src/lib/nexus/Worker.ts
use me as a template to build upon/src/lib/nexus/WorkerPool.ts
use me as a template to build upon/src/lib/nexus/__tests__/
use me as a template to build upon/src/lib/nexus/__tests__/CentralNexus.test.ts
use me as a template to build upon/src/lib/nexus/__tests__/integration.test.ts
use me as a template to build upon/src/lib/nexus/__tests__/setup.ts
use me as a template to build upon/src/lib/security/
use me as a template to build upon/src/lib/security/systemAccess.ts
use me as a template to build upon/src/lib/storage/
use me as a template to build upon/src/lib/storage/db.ts
use me as a template to build upon/src/lib/storage/__tests__/
use me as a template to build upon/src/lib/storage/__tests__/db.test.ts
use me as a template to build upon/src/lib/utils/
use me as a template to build upon/src/lib/utils/browserCheck.ts
use me as a template to build upon/src/lib/utils/env.ts
use me as a template to build upon/src/lib/utils/errors.ts
use me as a template to build upon/src/lib/utils/testConfig.ts
use me as a template to build upon/src/stores/
use me as a template to build upon/src/stores/configStore.ts
use me as a template to build upon/src/stores/logStore.ts
use me as a template to build upon/src/stores/moduleStore.ts
use me as a template to build upon/src/stores/nexusStore.ts
use me as a template to build upon/src/stores/testConfigStore.ts
use me as a template to build upon/src/stores/windowStore.ts
use me as a template to build upon/src/types/
use me as a template to build upon/src/types/window.ts
</environment_details>

---

**Assistant:**

<thinking>
The error suggests there's an issue with the test script execution. Looking at the package.json, the test script is defined as "jest", but it's not being recognized. This could be due to Jest not being properly installed or configured. I'll check if Jest is installed by looking at the package-lock.json file.
</thinking>

<read_file>
<path>use me as a template to build upon/package-lock.json</path>
</read_file>

---

**User:**

[read_file for 'use me as a template to build upon/package-lock.json'] Result:
{
  "name": "ai-virtual-os",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "ai-virtual-os",
      "version": "0.0.0",
      "dependencies": {
        "@anthropic-ai/sdk": "^0.33.1",
        "@dnd-kit/core": "^6.1.0",
        "@dnd-kit/sortable": "^8.0.0",
        "@dnd-kit/utilities": "^3.2.2",
        "@langchain/openai": "^0.3.16",
        "@radix-ui/react-dialog": "^1.0.5",
        "@radix-ui/react-dropdown-menu": "^2.0.6",
        "@radix-ui/react-slot": "^1.0.2",
        "@radix-ui/react-tabs": "^1.0.4",
        "@xenova/transformers": "^2.15.0",
        "chromadb": "^1.9.4",
        "class-variance-authority": "^0.7.0",
        "clsx": "^2.1.0",
        "cmdk": "^0.2.1",
        "d3": "^7.8.5",
        "idb": "^8.0.0",
        "konva": "^9.3.3",
        "langchain": "^0.3.8",
        "lucide-react": "^0.344.0",
        "mongodb": "^6.3.0",
        "openai": "^4.28.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-dropzone": "^14.2.3",
        "react-force-graph-2d": "^1.25.3",
        "react-konva": "^18.2.10",
        "react-markdown": "^9.0.1",
        "react-rnd": "^10.4.1",
        "react-router-dom": "^6.22.1",
        "react-window": "^1.8.10",
        "tailwind-merge": "^2.2.1",
        "tailwindcss-animate": "^1.0.7",
        "three": "^0.161.0",
        "zod": "^3.22.4",
        "zustand": "^4.5.5"
      },
      "devDependencies": {
        "@babel/preset-env": "^7.26.0",
        "@types/d3": "^7.4.3",
        "@types/jest": "^29.5.11",
        "@types/node": "^20.11.20",
        "@types/react": "^18.2.57",
        "@types/react-dom": "^18.2.19",
        "@types/react-window": "^1.8.8",
        "@types/three": "^0.161.2",
        "@typescript-eslint/eslint-plugin": "^7.0.2",
        "@typescript-eslint/parser": "^7.0.2",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.18",
        "babel-jest": "^29.7.0",
        "babel-plugin-transform-vite-meta-env": "^1.0.3",
        "dotenv": "^16.4.7",
        "eslint": "^8.56.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-react-refresh": "^0.4.5",
        "jest": "^29.7.0",
        "jest-environment-jsdom": "^29.7.0",
        "postcss": "^8.4.35",
        "tailwindcss": "^3.4.1",
        "ts-jest": "^29.1.1",
        "ts-node": "^10.9.2",
        "tsx": "^4.19.2",
        "typescript": "^5.3.3",
        "vite": "^5.1.4"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@ampproject/remapping": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@ampproject/remapping/-/remapping-2.3.0.tgz",
      "integrity": "sha512-30iZtAPgz+LTIYoeivqYo853f02jBYSd5uGnGpkFV0M3xOt9aN73erkgYAmZU43x4VfqcnLxW9Kpg3R5LC4YYw==",
      "dev": true,
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@anthropic-ai/sdk": {
      "version": "0.33.1",
      "resolved": "https://registry.npmjs.org/@anthropic-ai/sdk/-/sdk-0.33.1.tgz",
      "integrity": "sha512-VrlbxiAdVRGuKP2UQlCnsShDHJKWepzvfRCkZMpU+oaUdKLpOfmylLMRojGrAgebV+kDtPjewCVP0laHXg+vsA==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "^18.11.18",
        "@types/node-fetch": "^2.6.4",
        "abort-controller": "^3.0.0",
        "agentkeepalive": "^4.2.1",
        "form-data-encoder": "1.7.2",
        "formdata-node": "^4.3.2",
        "node-fetch": "^2.6.7"
      }
    },
    "node_modules/@anthropic-ai/sdk/node_modules/@types/node": {
      "version": "18.19.68",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-18.19.68.tgz",
      "integrity": "sha512-QGtpFH1vB99ZmTa63K4/FU8twThj4fuVSBkGddTp7uIL/cuoLWIUSL2RcOaigBhfR+hg5pgGkBnkoOxrTVBMKw==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~5.26.4"
      }
    },
    "node_modules/@anthropic-ai/sdk/node_modules/undici-types": {
      "version": "5.26.5",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-5.26.5.tgz",
      "integrity": "sha512-JlCMO+ehdEIKqlFxk6IfVoAUVmgz7cU7zD/h9XZ0qzeosSHmUJVOzSQvvYSYWXkFXC+IfLKSIffhv0sVZup6pA==",
      "license": "MIT"
    },
    "node_modules/@babel/code-frame": {
      "version": "7.26.2",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.26.2.tgz",
      "integrity": "sha512-RJlIHRueQgwWitWgF8OdFYGZX328Ax5BCemNGlqHfplnRT9ESi8JkFlvaVYbS+UubVY6dpv87Fs2u5M29iNFVQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.25.9",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.0.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.26.3.tgz",
      "integrity": "sha512-nHIxvKPniQXpmQLb0vhY3VaFb3S0YrTAwpOWJZh1wn3oJPjJk9Asva204PsBdmAE8vpzfHudT8DB0scYvy9q0g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.25.7",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.25.7.tgz",
      "integrity": "sha512-yJ474Zv3cwiSOO9nXJuqzvwEeM+chDuQ8GJirw+pZ91sCGCyOZ3dJkVE09fTV0VEVzXyLWhh3G/AolYTPX7Mow==",
      "dev": true,
      "dependencies": {
        "@ampproject/remapping": "^2.2.0",
        "@babel/code-frame": "^7.25.7",
        "@babel/generator": "^7.25.7",
        "@babel/helper-compilation-targets": "^7.25.7",
        "@babel/helper-module-transforms": "^7.25.7",
        "@babel/helpers": "^7.25.7",
        "@babel/parser": "^7.25.7",
        "@babel/template": "^7.25.7",
        "@babel/traverse": "^7.25.7",
        "@babel/types": "^7.25.7",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.26.3.tgz",
      "integrity": "sha512-6FF/urZvD0sTeO7k6/B15pMLC4CHUv1426lzr3N01aHJTl046uCAh9LXW/fzeXXjPNCJ6iABW5XaWOsIZB93aQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.26.3",
        "@babel/types": "^7.26.3",
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.25",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.25.9.tgz",
      "integrity": "sha512-gv7320KBUFJz1RnylIg5WWYPRXKZ884AGkYpgpWW02TH66Dl+HaC1t1CKd0z3R4b6hdYEcmrNZHUmfCP+1u3/g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.25.9.tgz",
      "integrity": "sha512-j9Db8Suy6yV/VHa4qzrj9yZfZxhLWQdVnRlXxmKLYlhWUVB1sB2G5sxuWYXk/whHD9iW76PmNzxZ4UCnTQTVEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.25.9",
        "@babel/helper-validator-option": "^7.25.9",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-create-class-features-plugin": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-class-features-plugin/-/helper-create-class-features-plugin-7.25.9.tgz",
      "integrity": "sha512-UTZQMvt0d/rSz6KI+qdu7GQze5TIajwTS++GUozlw8VBJDEOAqSXwm1WvmYEZwqdqSGQshRocPDqrt4HBZB3fQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.25.9",
        "@babel/helper-member-expression-to-functions": "^7.25.9",
        "@babel/helper-optimise-call-expression": "^7.25.9",
        "@babel/helper-replace-supers": "^7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.25.9",
        "@babel/traverse": "^7.25.9",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-create-regexp-features-plugin": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-regexp-features-plugin/-/helper-create-regexp-features-plugin-7.26.3.tgz",
      "integrity": "sha512-G7ZRb40uUgdKOQqPLjfD12ZmGA54PzqDFUv2BKImnC9QIfGhIHKvVML0oN8IUiDq4iRqpq74ABpvOaerfWdong==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.25.9",
        "regexpu-core": "^6.2.0",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-define-polyfill-provider": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-define-polyfill-provider/-/helper-define-polyfill-provider-0.6.3.tgz",
      "integrity": "sha512-HK7Bi+Hj6H+VTHA3ZvBis7V/6hu9QuTrnMXNybfUf2iiuU/N97I8VjB+KbhFF8Rld/Lx5MzoCwPCpPjfK+n8Cg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.22.6",
        "@babel/helper-plugin-utils": "^7.22.5",
        "debug": "^4.1.1",
        "lodash.debounce": "^4.0.8",
        "resolve": "^1.14.2"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-member-expression-to-functions/-/helper-member-expression-to-functions-7.25.9.tgz",
      "integrity": "sha512-wbfdZ9w5vk0C0oyHqAJbc62+vet5prjj01jjJ8sKn3j9h3MQQlflEdXYvuqRWjHnM12coDEqiC1IRCi0U/EKwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.25.9",
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.25.9.tgz",
      "integrity": "sha512-tnUA4RsrmflIM6W6RFTLFSXITtl0wKjgpnLgXyowocVPrbYrLUXSBXDgTs8BlbmIzIdlBySRQjINYs2BAkiLtw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.25.9",
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.26.0.tgz",
      "integrity": "sha512-xO+xu6B5K2czEnQye6BHA7DolFFmS3LB7stHZFaOLb1pAwO1HWLS8fXA+eh0A2yIvltPVmx3eNNDBJA2SLHXFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.25.9",
        "@babel/helper-validator-identifier": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-optimise-call-expression": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-optimise-call-expression/-/helper-optimise-call-expression-7.25.9.tgz",
      "integrity": "sha512-FIpuNaz5ow8VyrYcnXQTDRGvV6tTjkNtCK/RYNDXGSLlUD6cBuQTSw43CShGxjvfBTfcUA/r6UhUCbtYqkhcuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.25.9.tgz",
      "integrity": "sha512-kSMlyUVdWe25rEsRGviIgOWnoT/nfABVWlqt9N19/dIPWViAOW2s9wznP5tURbs/IDuNk4gPy3YdYRgH3uxhBw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-remap-async-to-generator": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-remap-async-to-generator/-/helper-remap-async-to-generator-7.25.9.tgz",
      "integrity": "sha512-IZtukuUeBbhgOcaW2s06OXTzVNJR0ybm4W5xC1opWFFJMZbwRj5LCk+ByYH7WdZPZTt8KnFwA8pvjN2yqcPlgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.25.9",
        "@babel/helper-wrap-function": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-replace-supers": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-replace-supers/-/helper-replace-supers-7.25.9.tgz",
      "integrity": "sha512-IiDqTOTBQy0sWyeXyGSC5TBJpGFXBkRynjBeXsvbhQFKj2viwJC76Epz35YLU1fpe/Am6Vppb7W7zM4fPQzLsQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-member-expression-to-functions": "^7.25.9",
        "@babel/helper-optimise-call-expression": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-skip-transparent-expression-wrappers/-/helper-skip-transparent-expression-wrappers-7.25.9.tgz",
      "integrity": "sha512-K4Du3BFa3gvyhzgPcntrkDgZzQaq6uozzcpGbOO1OEJaI+EJdqWIMTLgFgQf6lrfiDFo5FU+BxKepI9RmZqahA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.25.9",
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.25.9.tgz",
      "integrity": "sha512-4A/SCr/2KLd5jrtOMFzaKjVtAei3+2r/NChoBNoZ3EyP/+GlhoaEGoWOZUmFmoITP7zOJyHIMm+DYRd8o3PvHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.25.9.tgz",
      "integrity": "sha512-Ed61U6XJc3CVRfkERJWDz4dJwKe7iLmmJsbOGu9wSloNSFttHV0I8g6UAgb7qnK5ly5bGLPd4oXZlxCdANBOWQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.25.9.tgz",
      "integrity": "sha512-e/zv1co8pp55dNdEcCynfj9X7nyUKUXoUEwfXqaZt0omVOmDe9oOTdKStH4GmAw6zxMFs50ZayuMfHDKlO7Tfw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-wrap-function/-/helper-wrap-function-7.25.9.tgz",
      "integrity": "sha512-ETzz9UTjQSTmw39GboatdymDq4XIQbR8ySgVrylRhPOFpsd+JrKHIuF0de7GCWmem+T4uC5z7EZguod7Wj4A4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.25.9",
        "@babel/traverse": "^7.25.9",
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.25.7",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.25.7.tgz",
      "integrity": "sha512-Sv6pASx7Esm38KQpF/U/OXLwPPrdGHNKoeblRxgZRLXnAtnkEe4ptJPDtAZM7fBLadbc1Q07kQpSiGQ0Jg6tRA==",
      "dev": true,
      "dependencies": {
        "@babel/template": "^7.25.7",
        "@babel/types": "^7.25.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.26.3.tgz",
      "integrity": "sha512-WJ/CvmY8Mea8iDXo6a7RK2wbmJITT5fN3BEkRuFlxVyNx8jOKIIhmC4fSkTcPcf8JyavbBwIe6OpiCOBXt/IcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.26.3"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-firefox-class-in-computed-class-key": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-firefox-class-in-computed-class-key/-/plugin-bugfix-firefox-class-in-computed-class-key-7.25.9.tgz",
      "integrity": "sha512-ZkRyVkThtxQ/J6nv3JFYv1RYY+JT5BvU0y3k5bWrmuG4woXypRa4PXmm9RhOwodRkYFWqC0C0cqcJ4OqR7kW+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-safari-class-field-initializer-scope": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-class-field-initializer-scope/-/plugin-bugfix-safari-class-field-initializer-scope-7.25.9.tgz",
      "integrity": "sha512-MrGRLZxLD/Zjj0gdU15dfs+HH/OXvnw/U4jJD8vpcP2CJQapPEv1IWwjc/qMg7ItBlPwSv1hRBbb7LeuANdcnw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression/-/plugin-bugfix-safari-id-destructuring-collision-in-function-expression-7.25.9.tgz",
      "integrity": "sha512-2qUwwfAFpJLZqxd02YW9btUCZHl+RFvdDkNfZwaIJrvB8Tesjsk8pEQkTvGwZXLqXUx/2oyY3ySRhm6HOXuCug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining/-/plugin-bugfix-v8-spread-parameters-in-optional-chaining-7.25.9.tgz",
      "integrity": "sha512-6xWgLZTJXwilVjlnV7ospI3xi+sl8lN8rXXbBD6vYn3UYDlGsag8wrZkKcSI8G6KgqKP7vNFaDgeDnfAABq61g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.25.9",
        "@babel/plugin-transform-optional-chaining": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.13.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly/-/plugin-bugfix-v8-static-class-fields-redefine-readonly-7.25.9.tgz",
      "integrity": "sha512-aLnMXYPnzwwqhYSCyXfKkIkYgJ8zv9RK+roo9DkTXz38ynIhd9XCbN08s3MGvqL2MYGVUGdRQLL/JqBIeJhJBg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-proposal-private-property-in-object": {
      "version": "7.21.0-placeholder-for-preset-env.2",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-property-in-object/-/plugin-proposal-private-property-in-object-7.21.0-placeholder-for-preset-env.2.tgz",
      "integrity": "sha512-SOSkfJDddaM7mak6cPEpswyTRnuRltl429hMraQEglW+OkovnCzsiszTmsrlY//qLFjCpQDFRvjdm2wA5pPm9w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-async-generators": {
      "version": "7.8.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-async-generators/-/plugin-syntax-async-generators-7.8.4.tgz",
      "integrity": "sha512-tycmZxkGfZaxhMRbXlPXuVFpdWlXpir2W4AMhSJgRKzk/eDlIXOhb2LHWoLpDF7TEHylV5zNhykX6KAgHJmTNw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-bigint": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-bigint/-/plugin-syntax-bigint-7.8.3.tgz",
      "integrity": "sha512-wnTnFlG+YxQm3vDxpGE57Pj0srRU4sHE/mDkt1qv2YJJSeUAec2ma4WLUnUPeKjyrfntVwe/N6dCXpU+zL3Npg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-properties": {
      "version": "7.12.13",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-properties/-/plugin-syntax-class-properties-7.12.13.tgz",
      "integrity": "sha512-fm4idjKla0YahUNgFNLCB0qySdsoPiZP3iQE3rky0mBUtMZ23yDJ9SJdg6dXTSDnulOVqiF3Hgr9nbXvXTQZYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.12.13"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-static-block": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-static-block/-/plugin-syntax-class-static-block-7.14.5.tgz",
      "integrity": "sha512-b+YyPmr6ldyNnM6sqYeMWE+bgJcJpO6yS4QD7ymxgH34GBPNDM/THBh8iunyvKIZztiwLH4CJZ0RxTk9emgpjw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-assertions": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-assertions/-/plugin-syntax-import-assertions-7.26.0.tgz",
      "integrity": "sha512-QCWT5Hh830hK5EQa7XzuqIkQU9tT/whqbDz7kuaZMHFl1inRRg7JnuAEOQ0Ur0QUl0NufCk1msK2BeY79Aj/eg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-attributes": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-attributes/-/plugin-syntax-import-attributes-7.26.0.tgz",
      "integrity": "sha512-e2dttdsJ1ZTpi3B9UYGLw41hifAubg19AtCu/2I/F1QNVclOBr1dYpTdmdyZ84Xiz43BS/tCUkMAZNLv12Pi+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-meta": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-meta/-/plugin-syntax-import-meta-7.10.4.tgz",
      "integrity": "sha512-Yqfm+XDx0+Prh3VSeEQCPU81yC+JWZ2pDPFSS4ZdpfZhp4MkFMaDC1UqseovEKwSUpnIL7+vK+Clp7bfh0iD7g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-json-strings": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-json-strings/-/plugin-syntax-json-strings-7.8.3.tgz",
      "integrity": "sha512-lY6kdGpWHvjoe2vk4WrAapEuBR69EMxZl+RoGRhrFGNYVK8mOPAW8VfbT/ZgrFbXlDNiiaxQnAtgVCZ6jv30EA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-jsx": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-jsx/-/plugin-syntax-jsx-7.25.9.tgz",
      "integrity": "sha512-ld6oezHQMZsZfp6pWtbjaNDF2tiiCYYDqQszHt5VV437lewP9aSi2Of99CK0D0XB21k7FLgnLcmQKyKzynfeAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-logical-assignment-operators": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-logical-assignment-operators/-/plugin-syntax-logical-assignment-operators-7.10.4.tgz",
      "integrity": "sha512-d8waShlpFDinQ5MtvGU9xDAOzKH47+FFoney2baFIoMr952hKOLp1HR7VszoZvOsV/4+RRszNY7D17ba0te0ig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-nullish-coalescing-operator": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-nullish-coalescing-operator/-/plugin-syntax-nullish-coalescing-operator-7.8.3.tgz",
      "integrity": "sha512-aSff4zPII1u2QD7y+F8oDsz19ew4IGEJg9SVW+bqwpwtfFleiQDMdzA/R+UlWDzfnHFCxxleFT0PMIrR36XLNQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-numeric-separator": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-numeric-separator/-/plugin-syntax-numeric-separator-7.10.4.tgz",
      "integrity": "sha512-9H6YdfkcK/uOnY/K7/aA2xpzaAgkQn37yzWUMRK7OaPOqOpGS1+n0H5hxT9AUw9EsSjPW8SVyMJwYRtWs3X3ug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-object-rest-spread": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-object-rest-spread/-/plugin-syntax-object-rest-spread-7.8.3.tgz",
      "integrity": "sha512-XoqMijGZb9y3y2XskN+P1wUGiVwWZ5JmoDRwx5+3GmEplNyVM2s2Dg8ILFQm8rWM48orGy5YpI5Bl8U1y7ydlA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-catch-binding": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-catch-binding/-/plugin-syntax-optional-catch-binding-7.8.3.tgz",
      "integrity": "sha512-6VPD0Pc1lpTqw0aKoeRTMiB+kWhAoT24PA+ksWSBrFtl5SIRVpZlwN3NNPQjehA2E/91FV3RjLWoVTglWcSV3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-chaining": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-chaining/-/plugin-syntax-optional-chaining-7.8.3.tgz",
      "integrity": "sha512-KoK9ErH1MBlCPxV0VANkXW2/dw4vlbGDrFgz8bmUsBGYkFRcbRwMh6cIJubdPrkxRwuGdtCk0v/wPTKbQgBjkg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-private-property-in-object": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-private-property-in-object/-/plugin-syntax-private-property-in-object-7.14.5.tgz",
      "integrity": "sha512-0wVnp9dxJ72ZUJDV27ZfbSj6iHLoytYZmh3rFcxNnvsJF3ktkzLDZPy/mA17HGsaQT3/DQsWYX1f1QGWkCoVUg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-top-level-await": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-top-level-await/-/plugin-syntax-top-level-await-7.14.5.tgz",
      "integrity": "sha512-hx++upLv5U1rgYfwe1xBQUhRmU41NEvpUvrp8jkrSCdvGSnM5/qdRMtylJ6PG5OFkBaHkbTAKTnd3/YyESRHFw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-typescript": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.25.9.tgz",
      "integrity": "sha512-hjMgRy5hb8uJJjUcdWunWVcoi9bGpJp8p5Ol1229PoN6aytsLwNMgmdftO23wnCLMfVmTwZDWMPNq/D1SY60JQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-unicode-sets-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-unicode-sets-regex/-/plugin-syntax-unicode-sets-regex-7.18.6.tgz",
      "integrity": "sha512-727YkEAPwSIQTv5im8QHz3upqp92JTWhidIC81Tdx4VJYIte/VndKf1qKrfnnhPLiPghStWfvC/iFaMCQu7Nqg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-arrow-functions": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.25.9.tgz",
      "integrity": "sha512-6jmooXYIwn9ca5/RylZADJ+EnSxVUS5sjeJ9UPk6RWRzXCmOJCy6dqItPJFpw2cuCangPK4OYr5uhGKcmrm5Qg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-async-generator-functions": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-generator-functions/-/plugin-transform-async-generator-functions-7.25.9.tgz",
      "integrity": "sha512-RXV6QAzTBbhDMO9fWwOmwwTuYaiPbggWQ9INdZqAYeSHyG7FzQ+nOZaUUjNwKv9pV3aE4WFqFm1Hnbci5tBCAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-remap-async-to-generator": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-async-to-generator": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-to-generator/-/plugin-transform-async-to-generator-7.25.9.tgz",
      "integrity": "sha512-NT7Ejn7Z/LjUH0Gv5KsBCxh7BH3fbLTV0ptHvpeMvrt3cPThHfJfst9Wrb7S8EvJ7vRTFI7z+VAvFVEQn/m5zQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-remap-async-to-generator": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-block-scoped-functions": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoped-functions/-/plugin-transform-block-scoped-functions-7.25.9.tgz",
      "integrity": "sha512-toHc9fzab0ZfenFpsyYinOX0J/5dgJVA2fm64xPewu7CoYHWEivIWKxkK2rMi4r3yQqLnVmheMXRdG+k239CgA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-block-scoping": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoping/-/plugin-transform-block-scoping-7.25.9.tgz",
      "integrity": "sha512-1F05O7AYjymAtqbsFETboN1NvBdcnzMerO+zlMyJBEz6WkMdejvGWw9p05iTSjC85RLlBseHHQpYaM4gzJkBGg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-class-properties": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-class-properties/-/plugin-transform-class-properties-7.25.9.tgz",
      "integrity": "sha512-bbMAII8GRSkcd0h0b4X+36GksxuheLFjP65ul9w6C3KgAamI3JqErNgSrosX6ZPj+Mpim5VvEbawXxJCyEUV3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-class-static-block": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-class-static-block/-/plugin-transform-class-static-block-7.26.0.tgz",
      "integrity": "sha512-6J2APTs7BDDm+UMqP1useWqhcRAXo0WIoVj26N7kPFB6S73Lgvyka4KTZYIxtgYXiN5HTyRObA72N2iu628iTQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.12.0"
      }
    },
    "node_modules/@babel/plugin-transform-classes": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-classes/-/plugin-transform-classes-7.25.9.tgz",
      "integrity": "sha512-mD8APIXmseE7oZvZgGABDyM34GUmK45Um2TXiBUt7PnuAxrgoSVf123qUzPxEr/+/BHrRn5NMZCdE2m/1F8DGg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.25.9",
        "@babel/helper-compilation-targets": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-replace-supers": "^7.25.9",
        "@babel/traverse": "^7.25.9",
        "globals": "^11.1.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-classes/node_modules/globals": {
      "version": "11.12.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-11.12.0.tgz",
      "integrity": "sha512-WOBp/EEGUiIsJSp7wcv/y6MO+lV9UoncWqxuFfm8eBwzWNgyfBd6Gz+IeKQ9jCmyhoH99g15M3T+QaVHFjizVA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/plugin-transform-computed-properties": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-computed-properties/-/plugin-transform-computed-properties-7.25.9.tgz",
      "integrity": "sha512-HnBegGqXZR12xbcTHlJ9HGxw1OniltT26J5YpfruGqtUHlz/xKf/G2ak9e+t0rVqrjXa9WOhvYPz1ERfMj23AA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/template": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-destructuring": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-destructuring/-/plugin-transform-destructuring-7.25.9.tgz",
      "integrity": "sha512-WkCGb/3ZxXepmMiX101nnGiU+1CAdut8oHyEOHxkKuS1qKpU2SMXE2uSvfz8PBuLd49V6LEsbtyPhWC7fnkgvQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-dotall-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dotall-regex/-/plugin-transform-dotall-regex-7.25.9.tgz",
      "integrity": "sha512-t7ZQ7g5trIgSRYhI9pIJtRl64KHotutUJsh4Eze5l7olJv+mRSg4/MmbZ0tv1eeqRbdvo/+trvJD/Oc5DmW2cA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-duplicate-keys": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-keys/-/plugin-transform-duplicate-keys-7.25.9.tgz",
      "integrity": "sha512-LZxhJ6dvBb/f3x8xwWIuyiAHy56nrRG3PeYTpBkkzkYRRQ6tJLu68lEF5VIqMUZiAV7a8+Tb78nEoMCMcqjXBw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-duplicate-named-capturing-groups-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-named-capturing-groups-regex/-/plugin-transform-duplicate-named-capturing-groups-regex-7.25.9.tgz",
      "integrity": "sha512-0UfuJS0EsXbRvKnwcLjFtJy/Sxc5J5jhLHnFhy7u4zih97Hz6tJkLU+O+FMMrNZrosUPxDi6sYxJ/EA8jDiAog==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-dynamic-import": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dynamic-import/-/plugin-transform-dynamic-import-7.25.9.tgz",
      "integrity": "sha512-GCggjexbmSLaFhqsojeugBpeaRIgWNTcgKVq/0qIteFEqY2A+b9QidYadrWlnbWQUrW5fn+mCvf3tr7OeBFTyg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-exponentiation-operator": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-exponentiation-operator/-/plugin-transform-exponentiation-operator-7.26.3.tgz",
      "integrity": "sha512-7CAHcQ58z2chuXPWblnn1K6rLDnDWieghSOEmqQsrBenH0P9InCUtOJYD89pvngljmZlJcz3fcmgYsXFNGa1ZQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-export-namespace-from": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-export-namespace-from/-/plugin-transform-export-namespace-from-7.25.9.tgz",
      "integrity": "sha512-2NsEz+CxzJIVOPx2o9UsW1rXLqtChtLoVnwYHHiB04wS5sgn7mrV45fWMBX0Kk+ub9uXytVYfNP2HjbVbCB3Ww==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-for-of": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-for-of/-/plugin-transform-for-of-7.25.9.tgz",
      "integrity": "sha512-LqHxduHoaGELJl2uhImHwRQudhCM50pT46rIBNvtT/Oql3nqiS3wOwP+5ten7NpYSXrrVLgtZU3DZmPtWZo16A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-function-name": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-function-name/-/plugin-transform-function-name-7.25.9.tgz",
      "integrity": "sha512-8lP+Yxjv14Vc5MuWBpJsoUCd3hD6V9DgBon2FVYL4jJgbnVQ9fTgYmonchzZJOVNgzEgbxp4OwAf6xz6M/14XA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-json-strings": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-json-strings/-/plugin-transform-json-strings-7.25.9.tgz",
      "integrity": "sha512-xoTMk0WXceiiIvsaquQQUaLLXSW1KJ159KP87VilruQm0LNNGxWzahxSS6T6i4Zg3ezp4vA4zuwiNUR53qmQAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-literals": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-literals/-/plugin-transform-literals-7.25.9.tgz",
      "integrity": "sha512-9N7+2lFziW8W9pBl2TzaNht3+pgMIRP74zizeCSrtnSKVdUl8mAjjOP2OOVQAfZ881P2cNjDj1uAMEdeD50nuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-logical-assignment-operators": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-logical-assignment-operators/-/plugin-transform-logical-assignment-operators-7.25.9.tgz",
      "integrity": "sha512-wI4wRAzGko551Y8eVf6iOY9EouIDTtPb0ByZx+ktDGHwv6bHFimrgJM/2T021txPZ2s4c7bqvHbd+vXG6K948Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-member-expression-literals": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-member-expression-literals/-/plugin-transform-member-expression-literals-7.25.9.tgz",
      "integrity": "sha512-PYazBVfofCQkkMzh2P6IdIUaCEWni3iYEerAsRWuVd8+jlM1S9S9cz1dF9hIzyoZ8IA3+OwVYIp9v9e+GbgZhA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-amd": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-amd/-/plugin-transform-modules-amd-7.25.9.tgz",
      "integrity": "sha512-g5T11tnI36jVClQlMlt4qKDLlWnG5pP9CSM4GhdRciTNMRgkfpo5cR6b4rGIOYPgRRuFAvwjPQ/Yk+ql4dyhbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-commonjs": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.26.3.tgz",
      "integrity": "sha512-MgR55l4q9KddUDITEzEFYn5ZsGDXMSsU9E+kh7fjRXTIC3RHqfCo8RPRbyReYJh44HQ/yomFkqbOFohXvDCiIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.26.0",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-systemjs": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-systemjs/-/plugin-transform-modules-systemjs-7.25.9.tgz",
      "integrity": "sha512-hyss7iIlH/zLHaehT+xwiymtPOpsiwIIRlCAOwBB04ta5Tt+lNItADdlXw3jAWZ96VJ2jlhl/c+PNIQPKNfvcA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-validator-identifier": "^7.25.9",
        "@babel/traverse": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-umd": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-umd/-/plugin-transform-modules-umd-7.25.9.tgz",
      "integrity": "sha512-bS9MVObUgE7ww36HEfwe6g9WakQ0KF07mQF74uuXdkoziUPfKyu/nIm663kz//e5O1nPInPFx36z7WJmJ4yNEw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-transforms": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-named-capturing-groups-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-named-capturing-groups-regex/-/plugin-transform-named-capturing-groups-regex-7.25.9.tgz",
      "integrity": "sha512-oqB6WHdKTGl3q/ItQhpLSnWWOpjUJLsOCLVyeFgeTktkBSCiurvPOsyt93gibI9CmuKvTUEtWmG5VhZD+5T/KA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-new-target": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-new-target/-/plugin-transform-new-target-7.25.9.tgz",
      "integrity": "sha512-U/3p8X1yCSoKyUj2eOBIx3FOn6pElFOKvAAGf8HTtItuPyB+ZeOqfn+mvTtg9ZlOAjsPdK3ayQEjqHjU/yLeVQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-nullish-coalescing-operator": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-nullish-coalescing-operator/-/plugin-transform-nullish-coalescing-operator-7.25.9.tgz",
      "integrity": "sha512-ENfftpLZw5EItALAD4WsY/KUWvhUlZndm5GC7G3evUsVeSJB6p0pBeLQUnRnBCBx7zV0RKQjR9kCuwrsIrjWog==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-numeric-separator": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-numeric-separator/-/plugin-transform-numeric-separator-7.25.9.tgz",
      "integrity": "sha512-TlprrJ1GBZ3r6s96Yq8gEQv82s8/5HnCVHtEJScUj90thHQbwe+E5MLhi2bbNHBEJuzrvltXSru+BUxHDoog7Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-object-rest-spread": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-rest-spread/-/plugin-transform-object-rest-spread-7.25.9.tgz",
      "integrity": "sha512-fSaXafEE9CVHPweLYw4J0emp1t8zYTXyzN3UuG+lylqkvYd7RMrsOQ8TYx5RF231be0vqtFC6jnx3UmpJmKBYg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/plugin-transform-parameters": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-object-super": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-super/-/plugin-transform-object-super-7.25.9.tgz",
      "integrity": "sha512-Kj/Gh+Rw2RNLbCK1VAWj2U48yxxqL2x0k10nPtSdRa0O2xnHXalD0s+o1A6a0W43gJ00ANo38jxkQreckOzv5A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-replace-supers": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-optional-catch-binding": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-optional-catch-binding/-/plugin-transform-optional-catch-binding-7.25.9.tgz",
      "integrity": "sha512-qM/6m6hQZzDcZF3onzIhZeDHDO43bkNNlOX0i8n3lR6zLbu0GN2d8qfM/IERJZYauhAHSLHy39NF0Ctdvcid7g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-optional-chaining": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-optional-chaining/-/plugin-transform-optional-chaining-7.25.9.tgz",
      "integrity": "sha512-6AvV0FsLULbpnXeBjrY4dmWF8F7gf8QnvTEoO/wX/5xm/xE1Xo8oPuD3MPS+KS9f9XBEAWN7X1aWr4z9HdOr7A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-parameters": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-parameters/-/plugin-transform-parameters-7.25.9.tgz",
      "integrity": "sha512-wzz6MKwpnshBAiRmn4jR8LYz/g8Ksg0o80XmwZDlordjwEk9SxBzTWC7F5ef1jhbrbOW2DJ5J6ayRukrJmnr0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-private-methods": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-private-methods/-/plugin-transform-private-methods-7.25.9.tgz",
      "integrity": "sha512-D/JUozNpQLAPUVusvqMxyvjzllRaF8/nSrP1s2YGQT/W4LHK4xxsMcHjhOGTS01mp9Hda8nswb+FblLdJornQw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-private-property-in-object": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-private-property-in-object/-/plugin-transform-private-property-in-object-7.25.9.tgz",
      "integrity": "sha512-Evf3kcMqzXA3xfYJmZ9Pg1OvKdtqsDMSWBDzZOPLvHiTt36E75jLDQo5w1gtRU95Q4E5PDttrTf25Fw8d/uWLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.25.9",
        "@babel/helper-create-class-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-property-literals": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-property-literals/-/plugin-transform-property-literals-7.25.9.tgz",
      "integrity": "sha512-IvIUeV5KrS/VPavfSM/Iu+RE6llrHrYIKY1yfCzyO/lMXHQ+p7uGhonmGVisv6tSBSVgWzMBohTcvkC9vQcQFA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-self": {
      "version": "7.25.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-self/-/plugin-transform-react-jsx-self-7.25.7.tgz",
      "integrity": "sha512-JD9MUnLbPL0WdVK8AWC7F7tTG2OS6u/AKKnsK+NdRhUiVdnzyR1S3kKQCaRLOiaULvUiqK6Z4JQE635VgtCFeg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-react-jsx-source": {
      "version": "7.25.7",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-react-jsx-source/-/plugin-transform-react-jsx-source-7.25.7.tgz",
      "integrity": "sha512-S/JXG/KrbIY06iyJPKfxr0qRxnhNOdkNXYBl/rmwgDd72cQLH9tEGkDm/yJPGvcSIUoikzfjMios9i+xT/uv9w==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-regenerator": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regenerator/-/plugin-transform-regenerator-7.25.9.tgz",
      "integrity": "sha512-vwDcDNsgMPDGP0nMqzahDWE5/MLcX8sv96+wfX7as7LoF/kr97Bo/7fI00lXY4wUXYfVmwIIyG80fGZ1uvt2qg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "regenerator-transform": "^0.15.2"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-regexp-modifiers": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regexp-modifiers/-/plugin-transform-regexp-modifiers-7.26.0.tgz",
      "integrity": "sha512-vN6saax7lrA2yA/Pak3sCxuD6F5InBjn9IcrIKQPjpsLvuHYLVroTxjdlVRHjjBWxKOqIwpTXDkOssYT4BFdRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-reserved-words": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-reserved-words/-/plugin-transform-reserved-words-7.25.9.tgz",
      "integrity": "sha512-7DL7DKYjn5Su++4RXu8puKZm2XBPHyjWLUidaPEkCUBbE7IPcsrkRHggAOOKydH1dASWdcUBxrkOGNxUv5P3Jg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-shorthand-properties": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-shorthand-properties/-/plugin-transform-shorthand-properties-7.25.9.tgz",
      "integrity": "sha512-MUv6t0FhO5qHnS/W8XCbHmiRWOphNufpE1IVxhK5kuN3Td9FT1x4rx4K42s3RYdMXCXpfWkGSbCSd0Z64xA7Ng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-spread": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-spread/-/plugin-transform-spread-7.25.9.tgz",
      "integrity": "sha512-oNknIB0TbURU5pqJFVbOOFspVlrpVwo2H1+HUIsVDvp5VauGGDP1ZEvO8Nn5xyMEs3dakajOxlmkNW7kNgSm6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-sticky-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-sticky-regex/-/plugin-transform-sticky-regex-7.25.9.tgz",
      "integrity": "sha512-WqBUSgeVwucYDP9U/xNRQam7xV8W5Zf+6Eo7T2SRVUFlhRiMNFdFz58u0KZmCVVqs2i7SHgpRnAhzRNmKfi2uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-template-literals": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-template-literals/-/plugin-transform-template-literals-7.25.9.tgz",
      "integrity": "sha512-o97AE4syN71M/lxrCtQByzphAdlYluKPDBzDVzMmfCobUjjhAryZV0AIpRPrxN0eAkxXO6ZLEScmt+PNhj2OTw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-typeof-symbol": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typeof-symbol/-/plugin-transform-typeof-symbol-7.25.9.tgz",
      "integrity": "sha512-v61XqUMiueJROUv66BVIOi0Fv/CUuZuZMl5NkRoCVxLAnMexZ0A3kMe7vvZ0nulxMuMp0Mk6S5hNh48yki08ZA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-escapes": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-escapes/-/plugin-transform-unicode-escapes-7.25.9.tgz",
      "integrity": "sha512-s5EDrE6bW97LtxOcGj1Khcx5AaXwiMmi4toFWRDP9/y0Woo6pXC+iyPu/KuhKtfSrNFd7jJB+/fkOtZy6aIC6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-property-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-property-regex/-/plugin-transform-unicode-property-regex-7.25.9.tgz",
      "integrity": "sha512-Jt2d8Ga+QwRluxRQ307Vlxa6dMrYEMZCgGxoPR8V52rxPyldHu3hdlHspxaqYmE7oID5+kB+UKUB/eWS+DkkWg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-regex/-/plugin-transform-unicode-regex-7.25.9.tgz",
      "integrity": "sha512-yoxstj7Rg9dlNn9UQxzk4fcNivwv4nUYz7fYXBaKxvw/lnmPuOm/ikoELygbYq68Bls3D/D+NBPHiLwZdZZ4HA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-sets-regex": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-sets-regex/-/plugin-transform-unicode-sets-regex-7.25.9.tgz",
      "integrity": "sha512-8BYqO3GeVNHtx69fdPshN3fnzUNLrWdHhk/icSwigksJGczKSizZ+Z6SBCxTs723Fr5VSNorTIK7a+R2tISvwQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/preset-env": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/preset-env/-/preset-env-7.26.0.tgz",
      "integrity": "sha512-H84Fxq0CQJNdPFT2DrfnylZ3cf5K43rGfWK4LJGPpjKHiZlk0/RzwEus3PDDZZg+/Er7lCA03MVacueUuXdzfw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.26.0",
        "@babel/helper-compilation-targets": "^7.25.9",
        "@babel/helper-plugin-utils": "^7.25.9",
        "@babel/helper-validator-option": "^7.25.9",
        "@babel/plugin-bugfix-firefox-class-in-computed-class-key": "^7.25.9",
        "@babel/plugin-bugfix-safari-class-field-initializer-scope": "^7.25.9",
        "@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": "^7.25.9",
        "@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": "^7.25.9",
        "@babel/plugin-bugfix-v8-static-class-fields-redefine-readonly": "^7.25.9",
        "@babel/plugin-proposal-private-property-in-object": "7.21.0-placeholder-for-preset-env.2",
        "@babel/plugin-syntax-import-assertions": "^7.26.0",
        "@babel/plugin-syntax-import-attributes": "^7.26.0",
        "@babel/plugin-syntax-unicode-sets-regex": "^7.18.6",
        "@babel/plugin-transform-arrow-functions": "^7.25.9",
        "@babel/plugin-transform-async-generator-functions": "^7.25.9",
        "@babel/plugin-transform-async-to-generator": "^7.25.9",
        "@babel/plugin-transform-block-scoped-functions": "^7.25.9",
        "@babel/plugin-transform-block-scoping": "^7.25.9",
        "@babel/plugin-transform-class-properties": "^7.25.9",
        "@babel/plugin-transform-class-static-block": "^7.26.0",
        "@babel/plugin-transform-classes": "^7.25.9",
        "@babel/plugin-transform-computed-properties": "^7.25.9",
        "@babel/plugin-transform-destructuring": "^7.25.9",
        "@babel/plugin-transform-dotall-regex": "^7.25.9",
        "@babel/plugin-transform-duplicate-keys": "^7.25.9",
        "@babel/plugin-transform-duplicate-named-capturing-groups-regex": "^7.25.9",
        "@babel/plugin-transform-dynamic-import": "^7.25.9",
        "@babel/plugin-transform-exponentiation-operator": "^7.25.9",
        "@babel/plugin-transform-export-namespace-from": "^7.25.9",
        "@babel/plugin-transform-for-of": "^7.25.9",
        "@babel/plugin-transform-function-name": "^7.25.9",
        "@babel/plugin-transform-json-strings": "^7.25.9",
        "@babel/plugin-transform-literals": "^7.25.9",
        "@babel/plugin-transform-logical-assignment-operators": "^7.25.9",
        "@babel/plugin-transform-member-expression-literals": "^7.25.9",
        "@babel/plugin-transform-modules-amd": "^7.25.9",
        "@babel/plugin-transform-modules-commonjs": "^7.25.9",
        "@babel/plugin-transform-modules-systemjs": "^7.25.9",
        "@babel/plugin-transform-modules-umd": "^7.25.9",
        "@babel/plugin-transform-named-capturing-groups-regex": "^7.25.9",
        "@babel/plugin-transform-new-target": "^7.25.9",
        "@babel/plugin-transform-nullish-coalescing-operator": "^7.25.9",
        "@babel/plugin-transform-numeric-separator": "^7.25.9",
        "@babel/plugin-transform-object-rest-spread": "^7.25.9",
        "@babel/plugin-transform-object-super": "^7.25.9",
        "@babel/plugin-transform-optional-catch-binding": "^7.25.9",
        "@babel/plugin-transform-optional-chaining": "^7.25.9",
        "@babel/plugin-transform-parameters": "^7.25.9",
        "@babel/plugin-transform-private-methods": "^7.25.9",
        "@babel/plugin-transform-private-property-in-object": "^7.25.9",
        "@babel/plugin-transform-property-literals": "^7.25.9",
        "@babel/plugin-transform-regenerator": "^7.25.9",
        "@babel/plugin-transform-regexp-modifiers": "^7.26.0",
        "@babel/plugin-transform-reserved-words": "^7.25.9",
        "@babel/plugin-transform-shorthand-properties": "^7.25.9",
        "@babel/plugin-transform-spread": "^7.25.9",
        "@babel/plugin-transform-sticky-regex": "^7.25.9",
        "@babel/plugin-transform-template-literals": "^7.25.9",
        "@babel/plugin-transform-typeof-symbol": "^7.25.9",
        "@babel/plugin-transform-unicode-escapes": "^7.25.9",
        "@babel/plugin-transform-unicode-property-regex": "^7.25.9",
        "@babel/plugin-transform-unicode-regex": "^7.25.9",
        "@babel/plugin-transform-unicode-sets-regex": "^7.25.9",
        "@babel/preset-modules": "0.1.6-no-external-plugins",
        "babel-plugin-polyfill-corejs2": "^0.4.10",
        "babel-plugin-polyfill-corejs3": "^0.10.6",
        "babel-plugin-polyfill-regenerator": "^0.6.1",
        "core-js-compat": "^3.38.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/preset-modules": {
      "version": "0.1.6-no-external-plugins",
      "resolved": "https://registry.npmjs.org/@babel/preset-modules/-/preset-modules-0.1.6-no-external-plugins.tgz",
      "integrity": "sha512-HrcgcIESLm9aIR842yhJ5RWan/gebQUJ6E/E5+rf0y9o6oj7w0Br+sWuL6kEQ/o/AdfvR1Je9jG18/gnpwjEyA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@babel/types": "^7.4.4",
        "esutils": "^2.0.2"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0 || ^8.0.0-0 <8.0.0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.26.0",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.26.0.tgz",
      "integrity": "sha512-FDSOghenHTiToteC/QRlv2q3DhPZ/oOXTBoirfWNx1Cx3TMVcGWQtMMmQcSvb/JjpNeGzx8Pq/b4fKEJuWm1sw==",
      "dependencies": {
        "regenerator-runtime": "^0.14.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.25.9.tgz",
      "integrity": "sha512-9DGttpmPvIxBb/2uwpVo3dqJ+O6RooAFOS+lB+xDqoE2PVCE8nfoHMdZLpfCQRLwvohzXISPZcgxt80xLfsuwg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.25.9",
        "@babel/parser": "^7.25.9",
        "@babel/types": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.26.4",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.26.4.tgz",
      "integrity": "sha512-fH+b7Y4p3yqvApJALCPJcwb0/XaOSgtK4pzV6WVjPR5GLFQBRI7pfoX2V2iM48NXvX07NUxxm1Vw98YjqTcU5w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.26.2",
        "@babel/generator": "^7.26.3",
        "@babel/parser": "^7.26.3",
        "@babel/template": "^7.25.9",
        "@babel/types": "^7.26.3",
        "debug": "^4.3.1",
        "globals": "^11.1.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse/node_modules/globals": {
      "version": "11.12.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-11.12.0.tgz",
      "integrity": "sha512-WOBp/EEGUiIsJSp7wcv/y6MO+lV9UoncWqxuFfm8eBwzWNgyfBd6Gz+IeKQ9jCmyhoH99g15M3T+QaVHFjizVA==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.26.3",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.26.3.tgz",
      "integrity": "sha512-vN5p+1kl59GVKMvTHt55NzzmYVxprfJD+ql7U9NFIfKCBkYE55LYtS+WtPlaYOyzydrKI8Nezd+aZextrd+FMA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.25.9",
        "@babel/helper-validator-identifier": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@bcoe/v8-coverage": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/@bcoe/v8-coverage/-/v8-coverage-0.2.3.tgz",
      "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@cfworker/json-schema": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/@cfworker/json-schema/-/json-schema-4.0.3.tgz",
      "integrity": "sha512-ZykIcDTVv5UNmKWSTLAs3VukO6NDJkkSKxrgUTDPBkAlORVT3H9n5DbRjRl8xIotklscHdbLIa0b9+y3mQq73g==",
      "license": "MIT",
      "peer": true
    },
    "node_modules/@cspotcode/source-map-support": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/@cspotcode/source-map-support/-/source-map-support-0.8.1.tgz",
      "integrity": "sha512-IchNf6dN4tHoMFIn/7OE8LWZ19Y6q/67Bmf6vnGREv8RSbBVb9LPJxEcnwrcwX6ixSvaiGoomAUvu4YSxXrVgw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/trace-mapping": "0.3.9"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.9.tgz",
      "integrity": "sha512-3Belt6tdc8bPgAtbcmdtNJlirVoTmEb5e2gC94PnkwEW9jI6CAHUeoG85tjWP5WquqfavoMtMwiG4P926ZKKuQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "node_modules/@dnd-kit/accessibility": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@dnd-kit/accessibility/-/accessibility-3.1.0.tgz",
      "integrity": "sha512-ea7IkhKvlJUv9iSHJOnxinBcoOI3ppGnnL+VDJ75O45Nss6HtZd8IdN8touXPDtASfeI2T2LImb8VOZcL47wjQ==",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8.0"
      }
    },
    "node_modules/@dnd-kit/core": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/@dnd-kit/core/-/core-6.1.0.tgz",
      "integrity": "sha512-J3cQBClB4TVxwGo3KEjssGEXNJqGVWx17aRTZ1ob0FliR5IjYgTxl5YJbKTzA6IzrtelotH19v6y7uoIRUZPSg==",
      "dependencies": {
        "@dnd-kit/accessibility": "^3.1.0",
        "@dnd-kit/utilities": "^3.2.2",
        "tslib": "^2.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8.0",
        "react-dom": ">=16.8.0"
      }
    },
    "node_modules/@dnd-kit/sortable": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/@dnd-kit/sortable/-/sortable-8.0.0.tgz",
      "integrity": "sha512-U3jk5ebVXe1Lr7c2wU7SBZjcWdQP+j7peHJfCspnA81enlu88Mgd7CC8Q+pub9ubP7eKVETzJW+IBAhsqbSu/g==",
      "dependencies": {
        "@dnd-kit/utilities": "^3.2.2",
        "tslib": "^2.0.0"
      },
      "peerDependencies": {
        "@dnd-kit/core": "^6.1.0",
        "react": ">=16.8.0"
      }
    },
    "node_modules/@dnd-kit/utilities": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/@dnd-kit/utilities/-/utilities-3.2.2.tgz",
      "integrity": "sha512-+MKAJEOfaBe5SmV6t34p80MMKhjvUz0vRrvVJbPT0WElzaOJ/1xs+D+KDv+tD/NE5ujfrChEcshd4fLn0wpiqg==",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.21.5.tgz",
      "integrity": "sha512-1SDgH6ZSPTlggy1yI6+Dbkiz8xzpHJEVAlF/AM1tHPLsf5STom9rwtjE4hKAF20FfXXNTFqEYXyJNWh1GiZedQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.21.5.tgz",
      "integrity": "sha512-vCPvzSjpPHEi1siZdlvAlsPxXl7WbOVUBBAowWug4rJHb68Ox8KualB+1ocNvT5fjv6wpkX6o/iEpbDrf68zcg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.21.5.tgz",
      "integrity": "sha512-c0uX9VAUBQ7dTDCjq+wdyGLowMdtR/GoC2U5IYk/7D1H1JYC0qseD7+11iMP2mRLN9RcCMRcjC4YMclCzGwS/A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.21.5.tgz",
      "integrity": "sha512-D7aPRUUNHRBwHxzxRvp856rjUHRFW1SdQATKXH2hqA0kAZb1hKmi02OpYRacl0TxIGz/ZmXWlbZgjwWYaCakTA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },

      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.23.1",
        "@esbuild/android-arm": "0.23.1",
        "@esbuild/android-arm64": "0.23.1",
        "@esbuild/android-x64": "0.23.1",
        "@esbuild/darwin-arm64": "0.23.1",
        "@esbuild/darwin-x64": "0.23.1",
        "@esbuild/freebsd-arm64": "0.23.1",
        "@esbuild/freebsd-x64": "0.23.1",
        "@esbuild/linux-arm": "0.23.1",
        "@esbuild/linux-arm64": "0.23.1",
        "@esbuild/linux-ia32": "0.23.1",
        "@esbuild/linux-loong64": "0.23.1",
        "@esbuild/linux-mips64el": "0.23.1",
        "@esbuild/linux-ppc64": "0.23.1",
        "@esbuild/linux-riscv64": "0.23.1",
        "@esbuild/linux-s390x": "0.23.1",
        "@esbuild/linux-x64": "0.23.1",
        "@esbuild/netbsd-x64": "0.23.1",
        "@esbuild/openbsd-arm64": "0.23.1",
        "@esbuild/openbsd-x64": "0.23.1",
        "@esbuild/sunos-x64": "0.23.1",
        "@esbuild/win32-arm64": "0.23.1",
        "@esbuild/win32-ia32": "0.23.1",
        "@esbuild/win32-x64": "0.23.1"
      }
    },
    