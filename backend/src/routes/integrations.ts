import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { encryptToken, decryptToken, maskToken } from '../services/encryptionService';
import * as jiraOAuth from '../services/jiraOAuth';
import * as trelloOAuth from '../services/trelloOAuth';

const router = Router();

// Get integration status for current user
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const [jiraResult, trelloResult] = await Promise.all([
      query('SELECT id, workspace_url, created_at FROM jira_connections WHERE user_id = $1', [
        userId,
      ]),
      query('SELECT id, workspace_name, created_at FROM trello_connections WHERE user_id = $1', [
        userId,
      ]),
    ]);

    res.json({
      jira: jiraResult.rows.length > 0 ? jiraResult.rows[0] : null,
      trello: trelloResult.rows.length > 0 ? trelloResult.rows[0] : null,
    });
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

// Jira OAuth - Start authorization
router.get('/jira/oauth/start', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/settings/integrations/jira/callback`;
    const authUrl = jiraOAuth.getJiraAuthUrl(redirectUri);
    res.json({ authUrl });
  } catch (error) {
    console.error('Jira OAuth start error:', error);
    res.status(500).json({ error: 'Failed to start Jira OAuth' });
  }
});

// Jira OAuth - Handle callback
router.post('/jira/oauth/callback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.userId;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/settings/integrations/jira/callback`;
    const token = await jiraOAuth.exchangeJiraCode(code, redirectUri);

    // Get user info to find workspace URL
    const userInfo = await jiraOAuth.getJiraUserInfo(token.access_token);
    const clouds = await jiraOAuth.getJiraClouds(token.access_token);

    if (clouds.length === 0) {
      return res.status(400).json({ error: 'No Jira Cloud instances found' });
    }

    const workspaceUrl = clouds[0].url;

    // Encrypt tokens before storing
    const encryptedToken = encryptToken(token.access_token);
    const encryptedRefresh = token.refresh_token ? encryptToken(token.refresh_token) : null;

    // Store connection (upsert)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000);

    await query(
      `INSERT INTO jira_connections (user_id, workspace_url, oauth_token, oauth_refresh_token, token_expires_at, scope)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, workspace_url) DO UPDATE
       SET oauth_token = EXCLUDED.oauth_token,
           oauth_refresh_token = EXCLUDED.oauth_refresh_token,
           token_expires_at = EXCLUDED.token_expires_at,
           updated_at = NOW()`,
      [
        userId,
        workspaceUrl,
        encryptedToken,
        encryptedRefresh,
        expiresAt,
        'read:me read:jira-work write:jira-work manage:jira-webhook',
      ]
    );

    res.json({ success: true, workspaceUrl });
  } catch (error) {
    console.error('Jira OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete Jira OAuth' });
  }
});

// Get Jira projects
router.get('/jira/projects', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const connResult = await query(
      'SELECT workspace_url, oauth_token FROM jira_connections WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (connResult.rows.length === 0) {
      return res.status(400).json({ error: 'Jira not connected' });
    }

    const { workspace_url, oauth_token } = connResult.rows[0];
    const decryptedToken = decryptToken(oauth_token);

    const projects = await jiraOAuth.getJiraProjects(decryptedToken, workspace_url);

    res.json({ projects });
  } catch (error) {
    console.error('Get Jira projects error:', error);
    res.status(500).json({ error: 'Failed to fetch Jira projects' });
  }
});

// Trello OAuth - Start authorization
router.get('/trello/oauth/start', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/settings/integrations/trello/callback`;
    const authUrl = trelloOAuth.getTrelloAuthUrl(redirectUri);
    res.json({ authUrl });
  } catch (error) {
    console.error('Trello OAuth start error:', error);
    res.status(500).json({ error: 'Failed to start Trello OAuth' });
  }
});

// Trello OAuth - Handle callback
router.post('/trello/oauth/callback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify token
    const isValid = await trelloOAuth.verifyTrelloToken(token);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Trello token' });
    }

    const userInfo = await trelloOAuth.getTrelloUserInfo(token);

    // Encrypt token
    const encryptedToken = encryptToken(token);

    // Store connection (upsert)
    await query(
      `INSERT INTO trello_connections (user_id, oauth_token, workspace_id, workspace_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
       SET oauth_token = EXCLUDED.oauth_token,
           workspace_id = EXCLUDED.workspace_id,
           workspace_name = EXCLUDED.workspace_name,
           updated_at = NOW()`,
      [userId, encryptedToken, userInfo.id, userInfo.fullName]
    );

    res.json({ success: true, workspaceId: userInfo.id });
  } catch (error) {
    console.error('Trello OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete Trello OAuth' });
  }
});

// Get Trello boards
router.get('/trello/boards', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const connResult = await query(
      'SELECT oauth_token FROM trello_connections WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (connResult.rows.length === 0) {
      return res.status(400).json({ error: 'Trello not connected' });
    }

    const { oauth_token } = connResult.rows[0];
    const decryptedToken = decryptToken(oauth_token);

    const boards = await trelloOAuth.getTrelloBoards(decryptedToken);

    res.json({ boards });
  } catch (error) {
    console.error('Get Trello boards error:', error);
    res.status(500).json({ error: 'Failed to fetch Trello boards' });
  }
});

// Disconnect Jira
router.post('/jira/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    await query('DELETE FROM jira_connections WHERE user_id = $1', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect Jira error:', error);
    res.status(500).json({ error: 'Failed to disconnect Jira' });
  }
});

// Disconnect Trello
router.post('/trello/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    await query('DELETE FROM trello_connections WHERE user_id = $1', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Disconnect Trello error:', error);
    res.status(500).json({ error: 'Failed to disconnect Trello' });
  }
});

export default router;
