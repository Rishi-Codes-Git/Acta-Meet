import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { RolePermissionLevel, MinimumRoleForActionItem, UserRole } from '../types';
import { query } from '../db';

export async function canCreateActionItems(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required to create action items' });
    }

    const result = await query('SELECT role FROM users WHERE id = $1', [req.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userRole: UserRole = result.rows[0].role;
    const permissionLevel = RolePermissionLevel[userRole] ?? 0;

    if (permissionLevel < MinimumRoleForActionItem) {
      return res.status(403).json({ 
        error: `Only ${Object.entries(RolePermissionLevel)
          .filter(([_, level]) => level >= MinimumRoleForActionItem)
          .map(([role]) => role)
          .join(', ')} or higher can create action items` 
      });
    }

    next();
  } catch (err) {
    console.error('Permission check error:', err);
    res.status(500).json({ error: 'Permission check failed' });
  }
}

export async function isTeamAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const teamId = req.params.teamId;
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    const result = await query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.userId]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    console.error('Team admin check error:', err);
    res.status(500).json({ error: 'Permission check failed' });
  }
}

export async function isMeetingOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const meetingId = req.params.meetingId || req.body.meeting_id;
    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID required' });
    }

    const result = await query(
      'SELECT created_by FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (result.rows[0].created_by !== req.userId) {
      return res.status(403).json({ error: 'Only meeting organizer can perform this action' });
    }

    next();
  } catch (err) {
    console.error('Meeting organizer check error:', err);
    res.status(500).json({ error: 'Permission check failed' });
  }
}
