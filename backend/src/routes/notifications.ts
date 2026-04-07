import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { 
  getUserNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  getUnreadCount 
} from '../services/notificationService';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// Get my notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { unread_only } = req.query;
    const notifications = await getUserNotifications(
      req.userId!, 
      unread_only === 'true'
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id, req.userId!);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.post('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    await markAllNotificationsRead(req.userId!);
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
