import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const router = Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(config.upload.dir, 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '.png';
    const uniqueName = `avatar_${Date.now()}${extension}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type. Only PNG, JPG, and WEBP are allowed.'));
  },
});

// Get all users (for assigning tasks)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, team_id } = req.query;
    
    let sql = 'SELECT id, email, name, role, avatar_url, created_at FROM users WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (team_id) {
      sql += ` AND id IN (SELECT user_id FROM team_members WHERE team_id = $${paramIndex})`;
      params.push(team_id);
      paramIndex++;
    }
    
    sql += ' ORDER BY name ASC LIMIT 100';
    
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, email, name, role, avatar_url, created_at FROM users WHERE id = $1',
      [id]
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

// Update user profile
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Users can only update their own profile (unless admin)
    if (req.userId !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const { name, avatar_url, two_factor_enabled } = req.body;
    
    const result = await query(
      `UPDATE users SET 
        name = COALESCE($1, name),
        avatar_url = COALESCE($2, avatar_url),
        two_factor_enabled = COALESCE($3, two_factor_enabled),
        updated_at = NOW()
       WHERE id = $4 
       RETURNING id, email, name, role, avatar_url, two_factor_enabled, created_at`,
      [name, avatar_url, two_factor_enabled, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Upload avatar
router.post('/:id/avatar', authMiddleware, avatarUpload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file provided' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const result = await query(
      `UPDATE users SET
        avatar_url = $1,
        updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, name, role, avatar_url, created_at`,
      [avatarUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Get user's teams
router.get('/:id/teams', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT t.*, tm.role as member_role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Get user's action item stats
router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue
      FROM action_items
      WHERE assignee_id = $1
    `, [id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
