import { Router, Response } from 'express';
import { query } from '../db';
import { AuthRequest, optionalAuth, authMiddleware } from '../middleware/auth';

const router = Router();

// Get dashboard stats
router.get('/stats', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Get meeting stats
    const meetingStats = await query(`
      SELECT 
        COUNT(*) as total_meetings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_meetings,
        COUNT(CASE WHEN meeting_date >= NOW() THEN 1 END) as upcoming_meetings
      FROM meetings
    `);
    
    // Get action item stats
    const actionStats = await query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_actions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_actions,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_actions,
        COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue_actions
      FROM action_items
    `);
    
    // Get MY action item stats (if logged in)
    let myStats = null;
    if (req.userId) {
      const myStatsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue
        FROM action_items
        WHERE assignee_id = $1
      `, [req.userId]);
      myStats = myStatsResult.rows[0];
    }
    
    // Get meeting type distribution
    const typeDistribution = await query(`
      SELECT type, COUNT(*) as count
      FROM meetings
      GROUP BY type
      ORDER BY count DESC
    `);
    
    // Get priority distribution
    const priorityDistribution = await query(`
      SELECT priority, COUNT(*) as count
      FROM action_items
      GROUP BY priority
    `);
    
    res.json({
      meetings: meetingStats.rows[0],
      actions: actionStats.rows[0],
      my_actions: myStats,
      meeting_types: typeDistribution.rows,
      priorities: priorityDistribution.rows,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get MY dashboard (personalized)
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // My action items stats
    const myStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN deadline < NOW() AND status != 'completed' THEN 1 END) as overdue
      FROM action_items
      WHERE assignee_id = $1
    `, [req.userId]);
    
    // My overdue tasks
    const overdue = await query(`
      SELECT ai.*, m.title as meeting_title
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      WHERE ai.assignee_id = $1
        AND ai.deadline < NOW()
        AND ai.status != 'completed'
      ORDER BY ai.deadline ASC
      LIMIT 10
    `, [req.userId]);
    
    // My upcoming deadlines
    const upcoming = await query(`
      SELECT ai.*, m.title as meeting_title
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      WHERE ai.assignee_id = $1
        AND ai.deadline >= NOW()
        AND ai.deadline <= NOW() + INTERVAL '7 days'
        AND ai.status != 'completed'
      ORDER BY ai.deadline ASC
      LIMIT 10
    `, [req.userId]);
    
    // My recent meetings
    const myMeetings = await query(`
      SELECT DISTINCT m.*,
        (SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id AND assignee_id = $1) as my_action_count
      FROM meetings m
      LEFT JOIN participants p ON m.id = p.meeting_id
      LEFT JOIN users me ON me.id = $1
      WHERE m.created_by = $1
         OR p.user_id = $1
         OR (me.email IS NOT NULL AND LOWER(p.email) = LOWER(me.email))
      ORDER BY m.meeting_date DESC
      LIMIT 10
    `, [req.userId]);
    
    // Tasks I assigned to others
    const assignedByMe = await query(`
      SELECT ai.*, m.title as meeting_title, u.name as assignee_user_name
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      LEFT JOIN users u ON ai.assignee_id = u.id
      WHERE ai.assigned_by = $1
        AND ai.status != 'completed'
      ORDER BY ai.created_at DESC
      LIMIT 10
    `, [req.userId]);
    
    res.json({
      stats: myStats.rows[0],
      overdue: overdue.rows,
      upcoming: upcoming.rows,
      my_meetings: myMeetings.rows,
      assigned_by_me: assignedByMe.rows,
    });
  } catch (error) {
    console.error('Get my dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

// Get upcoming deadlines
router.get('/upcoming', async (req: AuthRequest, res: Response) => {
  try {
    const { days = 7 } = req.query;
    
    const result = await query(`
      SELECT ai.*, m.title as meeting_title
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      WHERE ai.deadline IS NOT NULL 
        AND ai.deadline <= NOW() + INTERVAL '${days} days'
        AND ai.status != 'completed'
      ORDER BY ai.deadline ASC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get upcoming error:', error);
    res.status(500).json({ error: 'Failed to get upcoming deadlines' });
  }
});

// Get overdue items
router.get('/overdue', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT ai.*, m.title as meeting_title
      FROM action_items ai
      JOIN meetings m ON ai.meeting_id = m.id
      WHERE ai.deadline < NOW()
        AND ai.status != 'completed'
      ORDER BY ai.deadline ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get overdue error:', error);
    res.status(500).json({ error: 'Failed to get overdue items' });
  }
});

// Get recent meetings
router.get('/recent-meetings', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM action_items WHERE meeting_id = m.id) as action_count,
        (SELECT COUNT(*) FROM participants WHERE meeting_id = m.id) as participant_count
      FROM meetings m
      ORDER BY m.created_at DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get recent meetings error:', error);
    res.status(500).json({ error: 'Failed to get recent meetings' });
  }
});

// Get completion trend (last 30 days)
router.get('/trend', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM action_items
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({ error: 'Failed to get trend data' });
  }
});

export default router;
