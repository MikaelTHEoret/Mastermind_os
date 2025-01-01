# Testing Framework Setup

1. **Set Up Jest for Unit Tests**:
   ```bash
   npm install jest @types/jest ts-jest --save-dev
   ```

2. **Example Unit Test**:
   ```typescript
   describe("Key Validation", () => {
       it("should validate correct keys", () => {
           expect(validateKey("sk-proj-123"));
       });

       it("should reject invalid keys", () => {
           expect(validateKey("invalid"));
       });
   });
   ```

3. **Integration Test for Endpoints**:
   ```typescript
   import axios from "axios";

   describe("API Endpoint Tests", () => {
       it("should fetch a valid response", async () => {
           const response = await axios.post("https://api.openai.com/v1/completions", {
               headers: { Authorization: "Bearer sk-proj-<key>" },
               data: { prompt: "Hello", max_tokens: 5 },
           });
           expect(response.status).toBe(200);
       });
   });
   ```