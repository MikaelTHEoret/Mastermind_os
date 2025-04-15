const { Pool } = require("pg");

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-restless-bush-a51ekyko.us-east-2.aws.neon.tech",
  database: "neondb",
  password: "npg_zlpZTMd4S9Qo",
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const id = 999;
    const module = "Script Forge";
    const script = "const puppeteer = require('puppeteer'); (async () => { const browser = await puppeteer.launch(); const page = await browser.newPage(); await page.goto('https://example.com'); await browser.close(); })();";
    const query = "INSERT INTO mastermind_tools (id, module, script) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET module = EXCLUDED.module, script = EXCLUDED.script;";
    await pool.query(query, [id, module, script]);
    console.log('Test tool injected successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to inject test tool:', error);
    process.exit(1);
  }
})();
