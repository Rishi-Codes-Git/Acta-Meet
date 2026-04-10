import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/email';

const router = Router();

// Generate and send OTP for 2FA setup
router.post('/enable-2fa', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get user
    const userResult = await query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Store OTP temporarily
    await query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, expiresAt, userId]
    );

    // Send email
    const emailSent = await emailService.sendOTP(user.email, otp, user.name);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Verify OTP and enable 2FA
router.post('/verify-2fa', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: 'User ID and OTP required' });
    }

    // Get user
    const userResult = await query(
      'SELECT otp_code, otp_expires_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify OTP
    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(401).json({ error: 'OTP expired' });
    }

    // Enable 2FA and clear OTP
    await query(
      'UPDATE users SET two_factor_enabled = true, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Disable 2FA
router.post('/disable-2fa', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await query(
      'UPDATE users SET two_factor_enabled = false, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: '2FA disabled' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

export default router;
