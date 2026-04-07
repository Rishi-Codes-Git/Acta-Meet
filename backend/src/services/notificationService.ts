import { query } from '../db';
import { Notification, NotificationType } from '../types';

interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  reference_id?: string;
  reference_type?: string;
}

// Create a notification
export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [params.user_id, params.type, params.title, params.message, params.reference_id, params.reference_type]
  );
  return result.rows[0];
}

// Get notifications for a user
export async function getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  let sql = 'SELECT * FROM notifications WHERE user_id = $1';
  if (unreadOnly) {
    sql += ' AND read = false';
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  
  const result = await query(sql, [userId]);
  return result.rows;
}

// Mark notification as read
export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
}

// Mark all notifications as read
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false',
    [userId]
  );
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
}

// Notify task assignment
export async function notifyTaskAssigned(
  assigneeId: string, 
  taskTitle: string, 
  taskId: string,
  assignedByName?: string
): Promise<void> {
  await createNotification({
    user_id: assigneeId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: assignedByName 
      ? `${assignedByName} assigned you: "${taskTitle}"`
      : `You have been assigned: "${taskTitle}"`,
    reference_id: taskId,
    reference_type: 'action_item'
  });
}

// Notify task status update
export async function notifyTaskUpdated(
  assigneeId: string,
  taskTitle: string,
  taskId: string,
  newStatus: string
): Promise<void> {
  await createNotification({
    user_id: assigneeId,
    type: 'task_updated',
    title: 'Task Updated',
    message: `Task "${taskTitle}" status changed to ${newStatus}`,
    reference_id: taskId,
    reference_type: 'action_item'
  });
}

// Send deadline reminders (called by cron/scheduler)
export async function sendDeadlineReminders(): Promise<number> {
  // Find tasks due in 24 hours that haven't been completed
  const result = await query(`
    SELECT ai.*, u.id as user_id
    FROM action_items ai
    JOIN users u ON ai.assignee_id = u.id
    WHERE ai.deadline = CURRENT_DATE + INTERVAL '1 day'
      AND ai.status NOT IN ('completed', 'blocked')
  `);
  
  for (const task of result.rows) {
    await createNotification({
      user_id: task.user_id,
      type: 'deadline_reminder',
      title: 'Deadline Tomorrow',
      message: `Task "${task.title}" is due tomorrow!`,
      reference_id: task.id,
      reference_type: 'action_item'
    });
  }
  
  return result.rows.length;
}
