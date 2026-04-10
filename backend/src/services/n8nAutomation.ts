import { query } from '../db';
import { config } from '../config';

interface AutomationTaskPayload {
  actionItemId: string;
  meetingId: string;
  meetingTitle: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  assigneeId: string | null;
  assignedById: string | null;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function loadTaskPayload(actionItemId: string): Promise<AutomationTaskPayload> {
  const result = await query(
    `SELECT ai.id, ai.meeting_id, ai.title, ai.description, ai.status, ai.priority, ai.deadline,
            ai.assignee_name, ai.assignee_id, ai.assigned_by,
            m.title AS meeting_title,
            u.email AS assignee_email
     FROM action_items ai
     LEFT JOIN meetings m ON m.id = ai.meeting_id
     LEFT JOIN users u ON u.id = ai.assignee_id
     WHERE ai.id = $1`,
    [actionItemId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Action item not found for automation: ${actionItemId}`);
  }

  const row = result.rows[0];
  return {
    actionItemId: row.id,
    meetingId: row.meeting_id,
    meetingTitle: row.meeting_title,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    deadline: row.deadline,
    assigneeName: row.assignee_name,
    assigneeEmail: row.assignee_email,
    assigneeId: row.assignee_id,
    assignedById: row.assigned_by,
  };
}

async function postToN8n(path: string, payload: Record<string, unknown>): Promise<void> {
  if (!config.n8n.enabled) return;
  if (!config.n8n.webhookUrl) {
    throw new Error('N8N is enabled but N8N_WEBHOOK_URL is not configured');
  }

  const baseUrl = normalizeBaseUrl(config.n8n.webhookUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const webhookUrl = `${baseUrl}${normalizedPath}`;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`n8n webhook failed (${response.status}): ${responseText}`);
  }
}

export async function triggerTaskCreatedAutomation(actionItemId: string, source: string): Promise<void> {
  const task = await loadTaskPayload(actionItemId);

  await postToN8n(config.n8n.taskCreatedPath, {
    source,
    event: 'task.created',
    timestamp: new Date().toISOString(),
    task,
    integrations: ['jira', 'trello'],
  });
}

export async function triggerTaskUpdatedAutomation(
  actionItemId: string,
  changedFields: string[],
  source: string
): Promise<void> {
  const task = await loadTaskPayload(actionItemId);

  await postToN8n(config.n8n.taskUpdatedPath, {
    source,
    event: 'task.updated',
    timestamp: new Date().toISOString(),
    changedFields,
    task,
    integrations: ['jira', 'trello'],
  });
}
