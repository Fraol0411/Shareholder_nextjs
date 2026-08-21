// // pages/api/auth/login.js
// import { connect } from '../../../libs/db';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required' });
//   }

//   try {
//     const pool = await connect();

//     const userResult = await pool.query(
//       'SELECT * FROM users WHERE username = $1',
//       [username]
//     );

//     const user = userResult.rows[0];
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password_hash);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign(
//       { id: user.id, username: user.username, role: user.role },
//       process.env.JWT_SECRET || 'your-secret-key-here',
//       { expiresIn: '30m' }
//     );

//     const { password_hash, ...userData } = user;

//     return res.status(200).json({
//       message: 'Login successful',
//       token,
//       user: userData,
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }



import { connect } from '../../../libs/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Accept 'identifier' (or fallback to 'username' for backward compatibility)
  const { username, identifier, password } = req.body;
  const loginId = identifier || username;

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Login ID and password are required' });
  }

  try {
    const pool = await connect();

    // Search across username, phone, reg_no, and national_id
    const userResult = await pool.query(
      `SELECT * FROM users 
       WHERE username = $1 
          OR phone = $1 
          OR reg_no = $1 
          OR national_id = $1 
       LIMIT 1`,
      [loginId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        reg_no: user.reg_no // Included in token for easy backend route protection
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '1d' } // Extended to 1 day for better UX (adjust if needed)
    );

    // Exclude password_hash from the response for security
    const { password_hash, ...userData } = user;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userData, // Contains all columns: id, username, role, name, reg_no, sif_no, phone, national_id, etc.
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}