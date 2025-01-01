# API Troubleshooting Guide for Mastermind OS

This guide provides steps to diagnose and fix API-related issues in the Mastermind OS application.

## Quick Diagnosis Steps

1. **Check Environment Variables**:
   ```bash
   # Open .env file and verify:
   OPENAI_API_KEY=sk-...     # Must start with sk-
   ANTHROPIC_API_KEY=sk-ant- # Must start with sk-ant-
   OLLAMA_HOST=http://localhost:11434
   ```

2. **Verify API Keys in Settings**:
   - Open Settings panel in Mastermind OS
   - Check if API keys are properly loaded
   - Look for any error messages in the console (F12)

3. **Test Local Ollama Setup**:
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/version

   # Verify available models
   ollama list

   # If models are missing, pull required models:
   ollama pull mistral
   ```

## Common Issues and Solutions

### 1. API Keys Not Loading

**Symptoms**:
- "Invalid API key" errors in console
- AI providers not responding
- Settings panel showing empty API keys

**Solutions**:
1. Check .env file exists and has correct format:
   ```bash
   # Copy from template if missing
   cp .env.example .env
   ```

2. Verify environment loading in configStore:
   ```typescript
   // src/stores/configStore.ts
   console.log('API Keys:', {
     openai: !!process.env.OPENAI_API_KEY,
     anthropic: !!process.env.ANTHROPIC_API_KEY
   });
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

### 2. Ollama Connection Issues

**Symptoms**:
- "Failed to connect to Ollama" errors
- Timeout errors when using local models
- Empty model list in Settings

**Solutions**:
1. Verify Ollama is running:
   ```bash
   # Windows: Check if Ollama service is running
   tasklist | findstr ollama

   # Start Ollama if needed
   ollama serve
   ```

2. Test API connection:
   ```typescript
   // Add to src/lib/ai/providers/ollama.ts for testing
   async function testConnection() {
     try {
       const response = await fetch('http://localhost:11434/api/version');
       console.log('Ollama status:', await response.json());
     } catch (error) {
       console.error('Ollama connection failed:', error);
     }
   }
   ```

3. Check firewall settings if needed:
   - Allow Ollama through Windows Firewall
   - Default port should be 11434

### 3. Rate Limit Errors

**Symptoms**:
- 429 errors in console
- "Too many requests" messages
- AI responses timing out

**Solutions**:
1. Add rate limiting to providers:
   ```typescript
   // src/lib/ai/providers/BaseProvider.ts
   private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
     if (this.lastRequest) {
       const timeSinceLastRequest = Date.now() - this.lastRequest;
       if (timeSinceLastRequest < this.minRequestInterval) {
         await new Promise(resolve => 
           setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
         );
       }
     }
     this.lastRequest = Date.now();
     return fn();
   }
   ```

2. Implement request queuing:
   ```typescript
   // src/lib/ai/factory.ts
   const requestQueue = new Map<string, Promise<any>>();
   
   export function queueRequest(provider: string, request: Promise<any>) {
     const current = requestQueue.get(provider) || Promise.resolve();
     const next = current.then(() => request);
     requestQueue.set(provider, next);
     return next;
   }
   ```

### 4. Memory/Performance Issues

**Symptoms**:
- Slow response times
- Browser memory warnings
- UI becoming unresponsive

**Solutions**:
1. Enable debug logging:
   ```typescript
   // src/lib/ai/MemoryEnabledProvider.ts
   const DEBUG = true;
   
   class MemoryEnabledProvider extends BaseProvider {
     async complete(params: CompletionParams) {
       if (DEBUG) {
         console.time('completion');
         const memoryUsage = process.memoryUsage();
         console.log('Memory before:', memoryUsage.heapUsed / 1024 / 1024, 'MB');
       }
       
       const result = await super.complete(params);
       
       if (DEBUG) {
         console.timeEnd('completion');
         const memoryUsage = process.memoryUsage();
         console.log('Memory after:', memoryUsage.heapUsed / 1024 / 1024, 'MB');
       }
       
       return result;
     }
   }
   ```

2. Implement cleanup in components:
   ```typescript
   // src/components/Chat.tsx
   useEffect(() => {
     return () => {
       // Cleanup pending requests
       provider.abort();
       // Clear message cache
       messageCache.clear();
     };
   }, []);
   ```

### 5. Testing API Integration

Run these tests to verify API functionality:

```bash
# Run API integration tests
npm test src/lib/ai/providers/__tests__

# Run with debug logging
DEBUG=true npm test src/lib/ai/providers/__tests__
```

Add test cases for your specific issues:

```typescript
// src/lib/ai/providers/__tests__/integration.test.ts
describe('API Integration', () => {
  test('handles connection errors gracefully', async () => {
    const provider = new OpenAIProvider();
    provider.baseURL = 'http://invalid-url';
    
    await expect(provider.complete({
      messages: [{ role: 'user', content: 'test' }]
    })).rejects.toThrow(/connection failed/i);
  });
  
  test('recovers from rate limits', async () => {
    const provider = new OpenAIProvider();
    const requests = Array(5).fill(null).map(() => 
      provider.complete({
        messages: [{ role: 'user', content: 'test' }]
      })
    );
    
    const results = await Promise.allSettled(requests);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    expect(succeeded).toBeGreaterThan(0);
  });
});
```

## Next Steps

If issues persist:

1. Check application logs:
   - Browser console (F12)
   - Network tab for API calls
   - React DevTools for component state

2. Run diagnostics:
   ```bash
   # Test all providers
   npm run test:providers
   
   # Check environment
   npm run validate:env
   
   # Verify build
   npm run build
   ```

3. Common fixes:
   - Clear browser cache and localStorage
   - Restart development server
   - Reinstall dependencies: `npm ci`
   - Reset Ollama: `ollama rm mistral && ollama pull mistral`
