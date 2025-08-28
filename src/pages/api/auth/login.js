// pages/api/auth/login.js
import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body; // ✅ Now using username

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const pool = await connect();

    // 🔍 Find user by username
    const userResult = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username'); // ✅ Match by username

    const user = userResult.recordset[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 🔐 Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '30m' } // High security: 30-minute expiry
    );

    // Remove sensitive data
    const { password_hash, ...userData } = user;

    // ✅ Success
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}