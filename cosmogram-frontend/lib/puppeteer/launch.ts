import type { NextApiRequest, NextApiResponse } from "next";
import { Worker, isMainThread, parentPort } from "worker_threads";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

interface RequestInfo {
  count: number;
  lastRequest: number;
}

// Simple rate limiter
const requestCounts = new Map<string, RequestInfo>();
const RATE_LIMIT = 5; // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD) {
  throw new Error("Database credentials not configured in environment variables");
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const TMP_DIR = path.join(process.cwd(), "tmp", "puppeteer");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  let ip: string;
  const ipSource = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Handle case where ip could be string or string[]
  if (Array.isArray(ipSource)) {
    ip = ipSource[0]; // Take first IP if array
  } else {
    ip = ipSource?.toString() || ''; // Convert to string if needed
  }

  const currentTime = Date.now();
  
  if (ip) {
    const requestInfo = requestCounts.get(ip) || { count: 0, lastRequest: 0 };
    
    // Reset count if window has passed
    if (currentTime - requestInfo.lastRequest > RATE_LIMIT_WINDOW) {
      requestInfo.count = 0;
      requestInfo.lastRequest = currentTime;
    }
    
    // Check if limit exceeded
    if (requestInfo.count >= RATE_LIMIT) {
      return res.status(429).json({ 
        error: "Too many requests. Please try again later." 
      });
    }
    
    requestInfo.count++;
    requestCounts.set(ip, requestInfo);
  }

  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "Missing tool ID." });

  try {
    const result = await pool.query("SELECT script FROM mastermind_tools WHERE id = $1", [id]);
    const code = result.rows?.[0]?.script;

    if (!code) return res.status(404).json({ error: "No script found for this tool." });

    // Validate script content
    if (code.length > 10000) {
      return res.status(400).json({ error: "Script too large (max 10KB)." });
    }

    // Block dangerous operations
    const dangerousPatterns = [
      /require\s*\(\s*['"]child_process['"]\s*\)/,
      /require\s*\(\s*['"]fs['"]\s*\)/,
      /process\.exit/,
      /eval\s*\(/,
      /Function\s*\(/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return res.status(400).json({ error: "Script contains prohibited operations." });
      }
    }

    // Ensure tmp directory exists
    fs.mkdirSync(TMP_DIR, { recursive: true });

    // Write the script file
    const filename = `tool-${id}.js`;
    const filepath = path.join(TMP_DIR, filename);
    fs.writeFileSync(filepath, code);

    // Execute in worker thread with timeout
    const worker = new Worker(filepath, {
      workerData: {},
      resourceLimits: {
        maxOldGenerationSizeMb: 50,
        maxYoungGenerationSizeMb: 25,
      },
      execArgv: ['--unhandled-rejections=strict']
    });

    const timeout = setTimeout(() => {
      worker.terminate();
      fs.unlink(filepath, () => {});
      return res.status(500).json({ error: "Script execution timed out" });
    }, 5000);

    worker.on('message', (message) => {
      clearTimeout(timeout);
      fs.unlink(filepath, () => {});
      res.status(200).json({ success: true, output: message });
    });

    worker.on('error', (err) => {
      clearTimeout(timeout);
      fs.unlink(filepath, () => {});
      console.error("Worker error:", err.message);
      res.status(500).json({ error: err.message });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
  } catch (e: any) {
    console.error("Server error:", e.message);
    res.status(500).json({ error: e.message });
  }
}
