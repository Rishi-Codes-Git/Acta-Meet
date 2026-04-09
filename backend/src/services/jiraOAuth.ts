/**
 * JIRA OAuth Service - PLACEHOLDERED
 * 
 * This service is currently placeholdered. To enable Jira integration:
 * 1. Set environment variables: JIRA_OAUTH_CLIENT_ID, JIRA_OAUTH_CLIENT_SECRET
 * 2. Replace placeholder functions with actual implementation
 * 3. Enable sync logic in actionItems routes
 */

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

export function getJiraAuthUrl(redirectUri: string): string {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function exchangeJiraCode(code: string, redirectUri: string): Promise<JiraOAuthToken> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function refreshJiraToken(refreshToken: string): Promise<JiraOAuthToken> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function getJiraUserInfo(accessToken: string): Promise<any> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function getJiraClouds(accessToken: string): Promise<JiraCloud[]> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function getJiraProjects(accessToken: string, cloudUrl: string): Promise<any[]> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function createJiraIssue(
  accessToken: string,
  cloudUrl: string,
  projectKey: string,
  actionItem: any
): Promise<string> {
  // PLACEHOLDER: Jira integration coming soon
  console.log('[PLACEHOLDER] Would create Jira issue:', actionItem.title);
  return 'placeholder-jira-id';
}

export async function updateJiraIssue(
  accessToken: string,
  cloudUrl: string,
  issueKey: string,
  updates: any
): Promise<void> {
  // PLACEHOLDER: Jira integration coming soon
  console.log('[PLACEHOLDER] Would update Jira issue:', issueKey);
}

export async function getJiraIssue(
  accessToken: string,
  cloudUrl: string,
  issueKey: string
): Promise<any> {
  // PLACEHOLDER: Jira integration coming soon
  throw new Error('Jira integration is currently disabled');
}

export async function registerJiraWebhook(
  accessToken: string,
  cloudUrl: string,
  webhookUrl: string
): Promise<string> {
  // PLACEHOLDER: Jira integration coming soon
  console.log('[PLACEHOLDER] Would register Jira webhook');
  return 'placeholder-webhook-id';
}

// Priority mapping stubs
function mapPriorityToJira(priority: string): string {
  return 'Medium';
}

function mapStatusToJira(status: string): string {
  return 'To Do';
}


// Status mapping (Jira → Acta)
export function mapStatusFromJira(jiraStatus: string): string {
  return 'pending'; // PLACEHOLDER
}

// Priority mapping (Jira → Acta)
export function mapPriorityFromJira(jiraPriority: string): string {
  return 'medium'; // PLACEHOLDER
}
