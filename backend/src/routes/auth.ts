import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '../db';
import { config } from '../config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/email';

const router = Router();

// JWT options
const jwtOptions: SignOptions = {
  expiresIn: '7d',
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }
    
    // Validate role if provided
    const validRoles = ['intern', 'associate', 'team_lead', 'manager', 'executive', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'associate';
    
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, name, password_hash, userRole]
    );
    
    const user = result.rows[0];
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, jwtOptions);
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If user has 2FA enabled, require OTP verification before issuing JWT
    if (user.two_factor_enabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
        [otp, expiresAt, user.id]
      );

      const emailSent = await emailService.sendOTP(user.email, otp, user.name);
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      return res.json({
        requires_2fa: true,
        user_id: user.id,
        email: user.email,
        message: 'OTP sent to your email',
      });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, jwtOptions);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        two_factor_enabled: user.two_factor_enabled,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Complete login for users with 2FA enabled
router.post('/verify-login-2fa', async (req: Request, res: Response) => {
  try {
    const { user_id, otp } = req.body;

    if (!user_id || !otp) {
      return res.status(400).json({ error: 'User ID and OTP are required' });
    }

    const result = await query(
      'SELECT id, email, name, role, created_at, two_factor_enabled, otp_code, otp_expires_at FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    await query(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, jwtOptions);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        two_factor_enabled: user.two_factor_enabled,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Verify login 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify login OTP' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, avatar_url, two_factor_enabled, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
