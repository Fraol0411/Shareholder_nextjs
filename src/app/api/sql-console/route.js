import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST: Execute a raw SQL query (admin only)
export async function POST(request) {
  try {
    // ── Auth: verify JWT from Authorization header ──
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: no token provided.' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    } catch {
      return NextResponse.json({ message: 'Unauthorized: invalid or expired token.' }, { status: 401 });
    }

    // ── Role check: only admins may run raw SQL ──
    if (decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: admin privileges required.' }, { status: 403 });
    }

    // ── Parse & validate the query ──
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ message: 'SQL query is required.' }, { status: 400 });
    }

    // node-postgres rejects multi-statement strings via the extended protocol,
    // but enforce it explicitly for a clearer error message.
    const trimmed = query.trim().replace(/;\s*$/, '');
    if (trimmed.includes(';')) {
      return NextResponse.json(
        { message: 'Only a single SQL statement is allowed per execution.' },
        { status: 400 }
      );
    }

    // ── Execute ──
    const startedAt = Date.now();
    const result = await pool.query(trimmed);
    const durationMs = Date.now() - startedAt;

    const isSelectLike = Array.isArray(result.rows) && result.command === 'SELECT';

    return NextResponse.json(
      {
        success: true,
        command: result.command,
        rowCount: result.rowCount,
        durationMs,
        fields: result.fields ? result.fields.map((f) => f.name) : [],
        rows: isSelectLike ? result.rows : [],
      },
      { status: 200 }
    );
  } catch (error) {
    // PostgreSQL errors carry useful detail (code, position, hint)
    return NextResponse.json(
      {
        success: false,
        message: 'Query execution failed.',
        error: error.message,
        code: error.code || null,
        detail: error.detail || null,
        hint: error.hint || null,
      },
      { status: 500 }
    );
  }
}
