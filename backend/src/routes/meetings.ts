import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest, optionalAuth } from '../middleware/auth';
import { generateMoM, getMoM } from '../services/momGenerator';
import { CreateMeetingRequest } from '../types';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get all meetings
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search, limit = 20, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM meetings WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (req.userId) {
      sql += ` AND (
        created_by = $${paramIndex}
        OR EXISTS (
          SELECT 1
          FROM participants p
          LEFT JOIN users me ON me.id = $${paramIndex}
          WHERE p.meeting_id = meetings.id
            AND (
              p.user_id = $${paramIndex}
              OR (me.email IS NOT NULL AND LOWER(p.email) = LOWER(me.email))
            )
        )
      )`;
      params.push(req.userId);
      paramIndex++;
    }
    
    if (type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR objective ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY meeting_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) FROM meetings WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset
    let countParamIndex = 1;
    
    if (req.userId) {
      countSql += ` AND (
        created_by = $${countParamIndex}
        OR EXISTS (
          SELECT 1
          FROM participants p
          LEFT JOIN users me ON me.id = $${countParamIndex}
          WHERE p.meeting_id = meetings.id
            AND (
              p.user_id = $${countParamIndex}
              OR (me.email IS NOT NULL AND LOWER(p.email) = LOWER(me.email))
            )
        )
      )`;
      countParamIndex++;
    }
    if (type) {
      countSql += ` AND type = $${countParamIndex}`;
      countParamIndex++;
    }
    if (status) {
      countSql += ` AND status = $${countParamIndex}`;
      countParamIndex++;
    }
    if (search) {
      countSql += ` AND (title ILIKE $${countParamIndex} OR objective ILIKE $${countParamIndex})`;
    }
    
    const countResult = await query(countSql, countParams);
    
    res.json({
      meetings: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to get meetings' });
  }
});

// Get single meeting with all related data
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const [meetingResult, participantsResult, agendaResult, discussionResult, decisionsResult, actionItemsResult] = await Promise.all([
      query('SELECT * FROM meetings WHERE id = $1', [id]),
      query('SELECT * FROM participants WHERE meeting_id = $1', [id]),
      query('SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY order_index', [id]),
      query('SELECT * FROM discussion_points WHERE meeting_id = $1', [id]),
      query('SELECT * FROM decisions WHERE meeting_id = $1', [id]),
      query('SELECT * FROM action_items WHERE meeting_id = $1 ORDER BY created_at', [id]),
    ]);
    
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Try to get MoM if it exists (don't fail if it doesn't)
    let mom = null;
    try {
      mom = await getMoM(id);
    } catch (err) {
      // MoM doesn't exist yet, that's okay
    }
    
    res.json({
      ...meetingResult.rows[0],
      participants: participantsResult.rows,
      agenda_items: agendaResult.rows,
      discussion_points: discussionResult.rows,
      decisions: decisionsResult.rows,
      action_items: actionItemsResult.rows,
      mom: mom || null,
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to get meeting' });
  }
});

// Create meeting
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data: CreateMeetingRequest = req.body;
    
    // Create meeting
    const meetingResult = await query(
      `INSERT INTO meetings (title, type, objective, meeting_date, duration_minutes, location, created_by, team_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.title, data.type, data.objective, data.meeting_date, data.duration_minutes, data.location, req.userId, data.team_id]
    );
    
    const meeting = meetingResult.rows[0];
    
    // Add participants (with user_id matching)
    if (data.participants && data.participants.length > 0) {
      for (const p of data.participants) {
        const normalizedName = p.name.trim();
        const normalizedEmail = p.email?.trim().toLowerCase() || null;

        if (!normalizedName) {
          continue;
        }

        // Try to match participant email to existing user
        let userId = p.user_id || null;
        if (!userId && normalizedEmail) {
          const userResult = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
          if (userResult.rows.length > 0) {
            userId = userResult.rows[0].id;
          }
        }
        
        await query(
          `INSERT INTO participants (meeting_id, user_id, name, email, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (meeting_id, email) DO UPDATE
           SET user_id = COALESCE(EXCLUDED.user_id, participants.user_id),
               name = EXCLUDED.name,
               role = EXCLUDED.role`,
          [meeting.id, userId, normalizedName, normalizedEmail, p.role || 'attendee']
        );
      }
    }
    
    // Add agenda items
    if (data.agenda_items && data.agenda_items.length > 0) {
      for (let i = 0; i < data.agenda_items.length; i++) {
        const item = data.agenda_items[i];
        await query(
          'INSERT INTO agenda_items (meeting_id, title, description, order_index) VALUES ($1, $2, $3, $4)',
          [meeting.id, item.title, item.description, i]
        );
      }
    }
    
    // Add discussion points
    if (data.discussion_points && data.discussion_points.length > 0) {
      for (const dp of data.discussion_points) {
        await query(
          'INSERT INTO discussion_points (meeting_id, content, speaker) VALUES ($1, $2, $3)',
          [meeting.id, dp.content, dp.speaker]
        );
      }
    }
    
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update meeting
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, objective, meeting_date, duration_minutes, location } = req.body;
    
    const result = await query(
      `UPDATE meetings SET title = $1, type = $2, objective = $3, meeting_date = $4, 
       duration_minutes = $5, location = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [title, type, objective, meeting_date, duration_minutes, location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM meetings WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Generate MoM
router.post('/:id/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const mom = await generateMoM(id, req.userId);
    
    res.json(mom);
  } catch (error) {
    console.error('Generate MoM error:', error);
    res.status(500).json({ error: 'Failed to generate MoM' });
  }
});

// Get MoM
router.get('/:id/mom', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const mom = await getMoM(id);
    
    if (!mom) {
      return res.status(404).json({ error: 'MoM not found. Generate it first.' });
    }
    
    res.json(mom);
  } catch (error) {
    console.error('Get MoM error:', error);
    res.status(500).json({ error: 'Failed to get MoM' });
  }
});

// Download PDF
router.get('/:id/download/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT pdf_path FROM mom_documents WHERE meeting_id = $1 ORDER BY generated_at DESC LIMIT 1',
      [id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].pdf_path) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    const filePath = result.rows[0].pdf_path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }
    
    res.download(filePath, `meeting_${id}.pdf`);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Download DOCX
router.get('/:id/download/docx', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT docx_path FROM mom_documents WHERE meeting_id = $1 ORDER BY generated_at DESC LIMIT 1',
      [id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].docx_path) {
      return res.status(404).json({ error: 'DOCX not found' });
    }
    
    const filePath = result.rows[0].docx_path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'DOCX file not found' });
    }
    
    res.download(filePath, `meeting_${id}.docx`);
  } catch (error) {
    console.error('Download DOCX error:', error);
    res.status(500).json({ error: 'Failed to download DOCX' });
  }
});

// Add discussion points to existing meeting
router.post('/:id/discussion', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, speaker } = req.body;
    
    const result = await query(
      'INSERT INTO discussion_points (meeting_id, content, speaker) VALUES ($1, $2, $3) RETURNING *',
      [id, content, speaker]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add discussion error:', error);
    res.status(500).json({ error: 'Failed to add discussion point' });
  }
});

export default router;
