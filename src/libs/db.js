// libs/db.js
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME
    ? `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASS)}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`
    : null);

let pool;

export const connect = async () => {
  if (pool) {
    return pool;
  }

  if (!connectionString) {
    throw new Error(
      'Missing database configuration. Set DATABASE_URL or DB_USER, DB_PASS, and DB_NAME.'
    );
  }

  console.log('DB Config:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
  });

  pool = new Pool({
    connectionString,
  });

  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Connected to PostgreSQL');
    return pool;
  } catch (err) {
    console.error('❌ Full DB Connection Error:', err);
    pool = null;
    throw err;
  }
};

export default { connect };
