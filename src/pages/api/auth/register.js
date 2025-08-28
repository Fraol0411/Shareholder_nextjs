// pages/api/auth/register.js
// import { connect } from '@/libs/db';
import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password, role } = req.body;

  // Validation
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (!['staff', 'supervisor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const pool = await connect();

    // Check if username already exists
    const existingUser = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    await pool.request()
      .input('username', username)
      .input('password_hash', passwordHash)
      .input('role', role)
      .query(`
        INSERT INTO users (username, password_hash, role)
        VALUES (@username, @password_hash, @role)
      `);

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}