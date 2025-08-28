// libs/db.js
import sql from 'mssql';
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // 👈 Disable encryption (only for local development!)
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

let pool;

export const connect = async () => {
  if (pool && pool.connected) {
    return pool;
  }

  // 🔍 Debug: Log config before connecting
  console.log('DB Config:', {
    server: process.env.DB_SERVER,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });


  if (!config.server || typeof config.server !== 'string') {
    throw new Error('Invalid or missing DB_SERVER. Must be a valid string (e.g., "localhost")');
  }
  if (!config.user) {
    throw new Error('Missing DB_USER');
  }
  if (!config.password) {
    throw new Error('Missing DB_PASS');
  }
  if (!config.database) {
    throw new Error('Missing DB_NAME');
  }

  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('❌ Full DB Connection Error:', err);
    throw err; 
  }
};

export default { connect, sql };