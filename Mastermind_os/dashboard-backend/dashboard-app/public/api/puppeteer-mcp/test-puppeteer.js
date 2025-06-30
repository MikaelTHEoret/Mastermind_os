// Test script for Puppeteer MCP server
const path = require('path');
const fs = require('fs');

// Get the absolute path to the test HTML file
const testPagePath = path.resolve(__dirname, 'test-page.html');
const fileUrl = `file://${testPagePath.replace(/\\/g, '/')}`;

console.log('Starting Puppeteer MCP test...');
console.log(`Test page URL: ${fileUrl}`);

// Function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    try {
        // Step 1: Navigate to the test page
        console.log('\n1. Navigating to test page...');
        const navigateResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_navigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl, launchOptions: { headless: false } })
        });
        
        if (!navigateResponse.ok) {
            throw new Error(`Failed to navigate: ${navigateResponse.statusText}`);
        }
        
        console.log('Navigation successful');
        await wait(2000);
        
        // Step 2: Take a screenshot of the initial page
        console.log('\n2. Taking initial screenshot...');
        const screenshotResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'initial-page', width: 800, height: 600 })
        });
        
        if (!screenshotResponse.ok) {
            throw new Error(`Failed to take screenshot: ${screenshotResponse.statusText}`);
        }
        
        console.log('Initial screenshot taken');
        await wait(1000);
        
        // Step 3: Fill out the form
        console.log('\n3. Filling out the form...');
        const fillResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_fill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selector: '#nameInput', value: 'Puppeteer MCP Test' })
        });
        
        if (!fillResponse.ok) {
            throw new Error(`Failed to fill form: ${fillResponse.statusText}`);
        }
        
        console.log('Form filled successfully');
        await wait(1000);
        
        // Step 4: Click the "Click Me" button
        console.log('\n4. Clicking the button...');
        const clickResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selector: '#clickButton' })
        });
        
        if (!clickResponse.ok) {
            throw new Error(`Failed to click button: ${clickResponse.statusText}`);
        }
        
        console.log('Button clicked successfully');
        await wait(1000);
        
        // Step 5: Submit the form
        console.log('\n5. Submitting the form...');
        const submitResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selector: '#testForm button' })
        });
        
        if (!submitResponse.ok) {
            throw new Error(`Failed to submit form: ${submitResponse.statusText}`);
        }
        
        console.log('Form submitted successfully');
        await wait(1000);
        
        // Step 6: Take a final screenshot showing the changes
        console.log('\n6. Taking final screenshot...');
        const finalScreenshotResponse = await fetch('http://localhost:3000/mcp/tool/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/puppeteer_screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'final-page', width: 800, height: 600 })
        });
        
        if (!finalScreenshotResponse.ok) {
            throw new Error(`Failed to take final screenshot: ${finalScreenshotResponse.statusText}`);
        }
        
        console.log('Final screenshot taken');
        
        // Step 7: Get console logs
        console.log('\n7. Retrieving console logs...');
        const logsResponse = await fetch('http://localhost:3000/mcp/resource/github.com/modelcontextprotocol/servers/tree/main/src/puppeteer/console://logs');
        
        if (!logsResponse.ok) {
            throw new Error(`Failed to get console logs: ${logsResponse.statusText}`);
        }
        
        const logs = await logsResponse.text();
        console.log('Console logs from browser:');
        console.log(logs);
        
        console.log('\nTest completed successfully!');
        console.log('Screenshots are available as MCP resources:');
        console.log('- screenshot://initial-page');
        console.log('- screenshot://final-page');
        
    } catch (error) {
        console.error('Error during test:', error);
    }
}

// Run the test
runTest();
