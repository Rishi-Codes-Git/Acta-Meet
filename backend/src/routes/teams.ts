import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Create team
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    
    // Create team
    const teamResult = await query(
      'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.userId]
    );
    
    const team = teamResult.rows[0];
    
    // Add creator as admin member
    await query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
      [team.id, req.userId, 'admin']
    );
    
    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get all teams (user is member of)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT t.*, 
             tm.role as my_role,
             (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY t.name
    `, [req.userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Get team by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const teamResult = await query('SELECT * FROM teams WHERE id = $1', [id]);
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const membersResult = await query(`
      SELECT tm.*, u.name, u.email, u.avatar_url
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY u.name
    `, [id]);
    
    res.json({
      ...teamResult.rows[0],
      members: membersResult.rows
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team' });
  }
});

// Add member to team
router.post('/:id/members', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;
    
    // Check if already a member
    const existing = await query(
      'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, user_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already in team' });
    }
    
    const result = await query(
      'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [id, user_id, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    
    await query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get team members (for assignment dropdown)
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT u.id, u.name, u.email, u.avatar_url, tm.role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY u.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

export default router;
