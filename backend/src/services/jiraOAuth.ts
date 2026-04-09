import axios from 'axios';
import { config } from '../config';
import { encryptToken } from './encryptionService';

const JIRA_OAUTH_URL = 'https://auth.atlassian.com/oauth';
const JIRA_API_URL = 'https://api.atlassian.com';

export interface JiraOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface JiraOAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface JiraCloud {
  id: string;
  name: string;
  url: string;
}

/**
 * Generate Jira OAuth authorization URL
 */
export function getJiraAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.JIRA_OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read:me read:jira-work write:jira-work manage:jira-webhook offline_access',
    prompt: 'consent',
  });

  return `${JIRA_OAUTH_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeJiraCode(code: string, redirectUri: string): Promise<JiraOAuthToken> {
  const response = await axios.post(`${JIRA_OAUTH_URL}/token`, {
    grant_type: 'authorization_code',
    client_id: process.env.JIRA_OAUTH_CLIENT_ID || '',
    client_secret: process.env.JIRA_OAUTH_CLIENT_SECRET || '',
    code,
    redirect_uri: redirectUri,
  });

  return response.data;
}

/**
 * Refresh Jira access token
 */
export async function refreshJiraToken(refreshToken: string): Promise<JiraOAuthToken> {
  const response = await axios.post(`${JIRA_OAUTH_URL}/token`, {
    grant_type: 'refresh_token',
    client_id: process.env.JIRA_OAUTH_CLIENT_ID || '',
    client_secret: process.env.JIRA_OAUTH_CLIENT_SECRET || '',
    refresh_token: refreshToken,
  });

  return response.data;
}

/**
 * Get authenticated user info
 */
export async function getJiraUserInfo(accessToken: string): Promise<any> {
  const response = await axios.get(`${JIRA_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
}

/**
 * Get all Jira Cloud instances for user
 */
export async function getJiraClouds(accessToken: string): Promise<JiraCloud[]> {
  const response = await axios.get(`${JIRA_API_URL}/oauth/tokens/accessible-resources`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
}

/**
 * Get Jira projects from a specific cloud
 */
export async function getJiraProjects(accessToken: string, cloudUrl: string): Promise<any[]> {
  const response = await axios.get(`${cloudUrl}/rest/api/3/project/search?maxResults=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data.values || [];
}

/**
 * Create Jira issue from action item
 */
export async function createJiraIssue(
  accessToken: string,
  cloudUrl: string,
  projectKey: string,
  actionItem: any
): Promise<string> {
  const response = await axios.post(
    `${cloudUrl}/rest/api/3/issue`,
    {
      fields: {
        project: { key: projectKey },
        summary: actionItem.title,
        description: {
          version: 1,
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: actionItem.description || '' }],
            },
          ],
        },
        issuetype: { name: 'Task' },
        priority: { name: mapPriorityToJira(actionItem.priority) },
        duedate: actionItem.deadline,
      },
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.id;
}

/**
 * Update Jira issue from action item
 */
export async function updateJiraIssue(
  accessToken: string,
  cloudUrl: string,
  issueKey: string,
  updates: any
): Promise<void> {
  const fields: any = {};

  if (updates.title) fields.summary = updates.title;
  if (updates.description)
    fields.description = {
      version: 1,
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: updates.description }] }],
    };
  if (updates.priority) fields.priority = { name: mapPriorityToJira(updates.priority) };
  if (updates.deadline) fields.duedate = updates.deadline;
  if (updates.status) fields.status = { name: mapStatusToJira(updates.status) };

  await axios.put(
    `${cloudUrl}/rest/api/3/issue/${issueKey}`,
    { fields },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

/**
 * Get Jira issue details
 */
export async function getJiraIssue(
  accessToken: string,
  cloudUrl: string,
  issueKey: string
): Promise<any> {
  const response = await axios.get(`${cloudUrl}/rest/api/3/issue/${issueKey}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data;
}

/**
 * Register webhook with Jira
 */
export async function registerJiraWebhook(
  accessToken: string,
  cloudUrl: string,
  webhookUrl: string
): Promise<string> {
  const response = await axios.post(
    `${cloudUrl}/rest/api/3/webhook`,
    {
      name: 'Acta Action Items Sync',
      url: webhookUrl,
      events: ['jira:issue_updated', 'jira:issue_deleted'],
      filters: {
        'issue-related-events-section': {},
      },
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.id;
}

// Priority mapping
function mapPriorityToJira(priority: string): string {
  const map: { [key: string]: string } = {
    high: 'Highest',
    medium: 'Medium',
    low: 'Lowest',
  };
  return map[priority] || 'Medium';
}

// Status mapping (Acta → Jira)
function mapStatusToJira(status: string): string {
  const map: { [key: string]: string } = {
    pending: 'To Do',
    in_progress: 'In Progress',
    completed: 'Done',
    blocked: 'In Progress',
  };
  return map[status] || 'To Do';
}

// Status mapping (Jira → Acta)
export function mapStatusFromJira(jiraStatus: string): string {
  const map: { [key: string]: string } = {
    'To Do': 'pending',
    'In Progress': 'in_progress',
    Done: 'completed',
    'In Review': 'in_progress',
    Backlog: 'pending',
  };
  return map[jiraStatus] || 'pending';
}

// Priority mapping (Jira → Acta)
export function mapPriorityFromJira(jiraPriority: string): string {
  const map: { [key: string]: string } = {
    Highest: 'high',
    High: 'high',
    Medium: 'medium',
    Low: 'low',
    Lowest: 'low',
  };
  return map[jiraPriority] || 'medium';
}
