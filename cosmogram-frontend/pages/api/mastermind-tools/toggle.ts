import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing tool ID' });

  try {
    const result = await pool.query(`
      UPDATE mastermind_tools
      SET status = CASE WHEN status = 'online' THEN 'offline' ELSE 'online' END
      WHERE id = $1 RETURNING *;
    `, [id]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle tool status', details: err });
  }
}