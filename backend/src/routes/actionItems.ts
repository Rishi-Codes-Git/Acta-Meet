import { Router, Response } from 'express';
import { query } from '../db';
import { AuthRequest, optionalAuth, authMiddleware } from '../middleware/auth';
import { canCreateActionItems } from '../middleware/permissions';
import { notifyTaskAssigned, notifyTaskUpdated } from '../services/notificationService';
import { triggerTaskCreatedAutomation, triggerTaskUpdatedAutomation } from '../services/n8nAutomation';
import { trelloService } from '../services/trello';

const router = Router();

// Get all action items (with user filtering)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, assignee, meeting_id, my_tasks, limit = 50, offset = 0 } = req.query;
    
    let sql = `
      SELECT ai.*, 
             m.title as meeting_title,
             u.name as assignee_user_name,
             u.email as assignee_email,
             ab.name as assigned_by_name
      FROM action_items ai 
      LEFT JOIN meetings m ON ai.meeting_id = m.id
      LEFT JOIN users u ON ai.assignee_id = u.id
      LEFT JOIN users ab ON ai.assigned_by = ab.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    // Filter for "My Tasks" - tasks assigned to current user
    if (my_tasks === 'true' && req.userId) {
      sql += ` AND ai.assignee_id = $${paramIndex}`;
      params.push(req.userId);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND ai.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      sql += ` AND ai.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    if (assignee) {
      sql += ` AND (ai.assignee_name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
      params.push(`%${assignee}%`);
      paramIndex++;
    }
    
    if (meeting_id) {
      sql += ` AND ai.meeting_id = $${paramIndex}`;
      params.push(meeting_id);
      paramIndex++;
    }
    
    sql += ` ORDER BY 
      CASE ai.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      ai.deadline ASC NULLS LAST,
      ai.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get action items error:', error);
    res.status(500).json({ error: 'Failed to get action items' });
  }
});

// Get MY action items (requires auth)
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query;
    
    let sql = `
      SELECT ai.*, 
             m.title as meeting_title,
             ab.name as assigned_by_name
      FROM action_items ai 
      LEFT JOIN meetings m ON ai.meeting_id = m.id
      LEFT JOIN users ab ON ai.assigned_by = ab.id
      WHERE ai.assignee_id = $1
    `;
    const params: any[] = [req.userId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND ai.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      sql += ` AND ai.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    sql += ` ORDER BY 
      CASE 
        WHEN ai.deadline < NOW() AND ai.status != 'completed' THEN 0
        ELSE 1 
      END,
      CASE ai.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      ai.deadline ASC NULLS LAST`;
    
    const result = await query(sql, params);
    
    // Separate into categories
    const overdue = result.rows.filter((r: any) => 
      r.deadline && new Date(r.deadline) < new Date() && r.status !== 'completed'
    );
    const pending = result.rows.filter((r: any) => 
      r.status === 'pending' && !overdue.includes(r)
    );
    const inProgress = result.rows.filter((r: any) => r.status === 'in_progress');
    const completed = result.rows.filter((r: any) => r.status === 'completed');
    
    res.json({
      all: result.rows,
      overdue,
      pending,
      in_progress: inProgress,
      completed,
      counts: {
        total: result.rows.length,
        overdue: overdue.length,
        pending: pending.length,
        in_progress: inProgress.length,
        completed: completed.length
      }
    });
  } catch (error) {
    console.error('Get my action items error:', error);
    res.status(500).json({ error: 'Failed to get action items' });
  }
});

// Get tasks assigned BY me
router.get('/assigned-by-me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT ai.*, 
             m.title as meeting_title,
             u.name as assignee_user_name,
             u.email as assignee_email
      FROM action_items ai 
      LEFT JOIN meetings m ON ai.meeting_id = m.id
      LEFT JOIN users u ON ai.assignee_id = u.id
      WHERE ai.assigned_by = $1
      ORDER BY ai.created_at DESC
    `, [req.userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get assigned by me error:', error);
    res.status(500).json({ error: 'Failed to get action items' });
  }
});

// Get single action item
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT ai.*, 
             m.title as meeting_title,
             u.name as assignee_user_name,
             u.email as assignee_email,
             ab.name as assigned_by_name
      FROM action_items ai 
      JOIN meetings m ON ai.meeting_id = m.id
      LEFT JOIN users u ON ai.assignee_id = u.id
      LEFT JOIN users ab ON ai.assigned_by = ab.id
      WHERE ai.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get action item error:', error);
    res.status(500).json({ error: 'Failed to get action item' });
  }
});

// Update action item
router.put('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, assignee_name, assignee_id, priority, status, deadline } = req.body;
    
    // Get current item for comparison
    const current = await query('SELECT * FROM action_items WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    
    const oldItem = current.rows[0];
    
    const result = await query(
      `UPDATE action_items SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assignee_name = COALESCE($3, assignee_name),
        assignee_id = COALESCE($4, assignee_id),
        priority = COALESCE($5, priority),
        status = COALESCE($6, status),
        deadline = COALESCE($7, deadline),
        completed_at = ${status === 'completed' ? 'NOW()' : 'completed_at'},
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, description, assignee_name, assignee_id, priority, status, deadline, id]
    );
    
    const updated = result.rows[0];
    
    // Notify if assignee changed
    if (assignee_id && assignee_id !== oldItem.assignee_id) {
      await notifyTaskAssigned(assignee_id, updated.title, id);
    }
    
    // Notify if status changed
    if (status && status !== oldItem.status && updated.assignee_id) {
      await notifyTaskUpdated(updated.assignee_id, updated.title, id, status);
    }

    const changedFields: string[] = [];
    if (title !== undefined && title !== oldItem.title) changedFields.push('title');
    if (description !== undefined && description !== oldItem.description) changedFields.push('description');
    if (assignee_name !== undefined && assignee_name !== oldItem.assignee_name) changedFields.push('assignee_name');
    if (assignee_id !== undefined && assignee_id !== oldItem.assignee_id) changedFields.push('assignee_id');
    if (priority !== undefined && priority !== oldItem.priority) changedFields.push('priority');
    if (status !== undefined && status !== oldItem.status) changedFields.push('status');
    if (deadline !== undefined && deadline !== oldItem.deadline) changedFields.push('deadline');
    if (changedFields.length > 0) {
      await triggerTaskUpdatedAutomation(updated.id, changedFields, 'manual_update');
    }
    
    // Sync to Trello if card exists
    if (oldItem.trello_card_id && (title || description)) {
      await trelloService.updateCard(
        oldItem.trello_card_id,
        title || oldItem.title,
        description || oldItem.description
      );
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Update action item error:', error);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

// Update status only (quick update)
router.patch('/:id/status', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'in_progress', 'completed', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await query(
      `UPDATE action_items SET 
        status = $1,
        completed_at = ${status === 'completed' ? 'NOW()' : 'NULL'},
        updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    
    const updated = result.rows[0];
    
    // Notify assignee about status change
    if (updated.assignee_id) {
      await notifyTaskUpdated(updated.assignee_id, updated.title, id, status);
    }

    await triggerTaskUpdatedAutomation(updated.id, ['status'], 'status_patch');
    
    res.json(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete action item
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Delete request for action item: ${id}`);
    
    // Simple delete without permission check first
    const result = await query('DELETE FROM action_items WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Action item not found: ${id}`);
      return res.status(404).json({ error: 'Action item not found' });
    }
    
    console.log(`✅ Action item deleted: ${id}`);
    res.json({ message: 'Action item deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('❌ Delete action item error:', error);
    console.error('Stack:', (error as any)?.stack);
    res.status(500).json({ error: 'Failed to delete action item', details: String(error) });
  }
});

// Create action item manually (with user assignment)
router.post('/', authMiddleware, canCreateActionItems, async (req: AuthRequest, res: Response) => {
  try {
    const { meeting_id, title, description, assignee_name, assignee_id, priority, deadline } = req.body;
    
    console.log('🔍 Creating action item with:', { meeting_id, title, description, assignee_name, assignee_id, priority, deadline });
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // If assignee_name is provided but not assignee_id, look up the user
    let resolvedAssigneeId = assignee_id;
    let resolvedAssigneeName = assignee_name;
    
    if (assignee_name && !assignee_id) {
      const userResult = await query(
        `SELECT id, name, email FROM users 
         WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)
         LIMIT 1`,
        [`%${assignee_name}%`]
      );
      
      if (userResult.rows.length > 0) {
        resolvedAssigneeId = userResult.rows[0].id;
        resolvedAssigneeName = userResult.rows[0].name;
        console.log(`✅ Resolved assignee: ${resolvedAssigneeName} (${resolvedAssigneeId})`);
      } else {
        console.log(`⚠️ Could not find user matching: ${assignee_name}`);
      }
    }
    
    const result = await query(
      `INSERT INTO action_items (meeting_id, title, description, assignee_name, assignee_id, assigned_by, priority, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [meeting_id || null, title, description || null, resolvedAssigneeName || null, resolvedAssigneeId || null, req.userId, priority || 'medium', deadline || null, 'pending']
    );
    
    console.log('✅ Action item created:', result.rows[0].id);
    
    const actionItem = result.rows[0];
    
    // Notify assignee
    if (resolvedAssigneeId) {
      console.log('📧 Notifying assignee:', resolvedAssigneeId);
      await notifyTaskAssigned(resolvedAssigneeId, title, actionItem.id);
    }

    console.log('🤖 Triggering automation');
    await triggerTaskCreatedAutomation(actionItem.id, 'manual_create');
    
    // Create Trello card automatically
    console.log('🔗 Creating Trello card');
    const trelloCard = await trelloService.createCardForActionItem(title, description);
    if (trelloCard) {
      // Store Trello card ID for future updates
      await query(
        'UPDATE action_items SET trello_card_id = $1 WHERE id = $2',
        [trelloCard.id, actionItem.id]
      );
      console.log(`✅ Trello card linked to action item: ${actionItem.id}`);
    }
    
    res.status(201).json(actionItem);
  } catch (error) {
    console.error('❌ Create action item error:', error);
    console.error('Stack:', (error as any)?.stack);
    res.status(500).json({ error: 'Failed to create action item', details: String(error) });
  }
});

export default router;
