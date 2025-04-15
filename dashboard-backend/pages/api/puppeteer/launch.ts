import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const pool = new Pool({
  user: "neondb_owner",
  host: "ep-restless-bush-a51ekyko.us-east-2.aws.neon.tech",
  database: "neondb",
  password: "npg_zlpZTMd4S9Qo",
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body;

  try {
    const result = await pool.query("SELECT script FROM mastermind_tools WHERE id = $1", [id]);
    const code = result.rows?.[0]?.script;

    if (!code) return res.status(404).json({ error: "No script found for this tool." });

    const filename = `tmp-script-${id}.js`;
    const filepath = path.join(process.cwd(), filename);
    fs.writeFileSync(filepath, code);

    exec(`node ${filename}`, (err, stdout, stderr) => {
      fs.unlinkSync(filepath); // Clean up temp file
      if (err) return res.status(500).json({ error: stderr || err.message });
      res.status(200).json({ success: true, output: stdout });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
