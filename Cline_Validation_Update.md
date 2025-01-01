# Updating Cline's Key Validation

1. **Regex Validation for Project-Specific Keys**:
   - Update Cline’s regex to accept `sk-proj-` keys:
   ```javascript
   const isValidKey = /^sk-(proj-[a-zA-Z0-9-]+)?[a-zA-Z0-9]+$/.test(key);
   ```

2. **Endpoint Configuration**:
   - Ensure endpoints are up-to-date:
     ```javascript
     const OPENAI_API_URL = "https://api.openai.com/v1/completions";
     const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/complete";
     ```

3. **Testing Integration**:
   - Use test payloads with updated headers and payloads to confirm communication with endpoints.
   - Validate that endpoints handle `Authorization` and `x-api-key` headers appropriately.