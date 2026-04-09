import axios from 'axios';

const TRELLO_API_URL = 'https://api.trello.com/1';

export interface TrelloOAuthToken {
  access_token: string;
  user: {
    id: string;
    fullName: string;
  };
}

/**
 * Generate Trello OAuth authorization URL
 */
export function getTrelloAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    key: process.env.TRELLO_API_KEY || '',
    token: process.env.TRELLO_API_TOKEN || '',
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: 'read,write,account',
    name: 'Acta',
    expiration: 'never',
  });

  return `https://trello.com/1/oauth/authorize?${params.toString()}`;
}

/**
 * Verify Trello token is valid
 */
export async function verifyTrelloToken(token: string): Promise<boolean> {
  try {
    const response = await axios.get(`${TRELLO_API_URL}/member/me`, {
      params: {
        key: process.env.TRELLO_API_KEY || '',
        token,
      },
    });

    return !!response.data.id;
  } catch {
    return false;
  }
}

/**
 * Get Trello user info
 */
export async function getTrelloUserInfo(token: string): Promise<any> {
  const response = await axios.get(`${TRELLO_API_URL}/member/me`, {
    params: {
      key: process.env.TRELLO_API_KEY || '',
      token,
    },
  });

  return response.data;
}

/**
 * Get all Trello boards for user
 */
export async function getTrelloBoards(token: string): Promise<any[]> {
  const response = await axios.get(`${TRELLO_API_URL}/member/me/boards`, {
    params: {
      key: process.env.TRELLO_API_KEY || '',
      token,
      filter: 'open',
    },
  });

  return response.data || [];
}

/**
 * Get lists in a Trello board
 */
export async function getTrelloLists(token: string, boardId: string): Promise<any[]> {
  const response = await axios.get(`${TRELLO_API_URL}/boards/${boardId}/lists`, {
    params: {
      key: process.env.TRELLO_API_KEY || '',
      token,
    },
  });

  return response.data || [];
}

/**
 * Create Trello card from action item
 */
export async function createTrelloCard(
  token: string,
  listId: string,
  actionItem: any
): Promise<string> {
  const response = await axios.post(
    `${TRELLO_API_URL}/cards`,
    {
      idList: listId,
      name: actionItem.title,
      desc: actionItem.description || '',
      due: actionItem.deadline,
      labels: [mapPriorityToTrelloLabel(actionItem.priority)],
    },
    {
      params: {
        key: process.env.TRELLO_API_KEY || '',
        token,
      },
    }
  );

  return response.data.id;
}

/**
 * Update Trello card from action item
 */
export async function updateTrelloCard(
  token: string,
  cardId: string,
  updates: any
): Promise<void> {
  const payload: any = {};

  if (updates.title) payload.name = updates.title;
  if (updates.description) payload.desc = updates.description;
  if (updates.deadline) payload.due = updates.deadline;
  if (updates.status) payload.idList = mapStatusToTrelloListId(updates.status);

  await axios.put(`${TRELLO_API_URL}/cards/${cardId}`, payload, {
    params: {
      key: process.env.TRELLO_API_KEY || '',
      token,
    },
  });
}

/**
 * Get Trello card details
 */
export async function getTrelloCard(token: string, cardId: string): Promise<any> {
  const response = await axios.get(`${TRELLO_API_URL}/cards/${cardId}`, {
    params: {
      key: process.env.TRELLO_API_KEY || '',
      token,
    },
  });

  return response.data;
}

/**
 * Register webhook with Trello
 */
export async function registerTrelloWebhook(
  token: string,
  idModel: string,
  webhookUrl: string
): Promise<string> {
  const response = await axios.post(
    `${TRELLO_API_URL}/webhooks`,
    {
      idModel,
      callbackURL: webhookUrl,
      description: 'Acta Action Items Sync',
    },
    {
      params: {
        key: process.env.TRELLO_API_KEY || '',
        token,
      },
    }
  );

  return response.data.id;
}

// Priority mapping (Acta → Trello label)
function mapPriorityToTrelloLabel(priority: string): string {
  const map: { [key: string]: string } = {
    high: 'red',
    medium: 'yellow',
    low: 'green',
  };
  return map[priority] || 'yellow';
}

// Priority mapping (Trello → Acta)
export function mapPriorityFromTrello(trelloLabel: string): string {
  const map: { [key: string]: string } = {
    red: 'high',
    yellow: 'medium',
    green: 'low',
  };
  return map[trelloLabel] || 'medium';
}

// Status mapping (Acta → Trello - simplified)
function mapStatusToTrelloListId(status: string): string {
  // This would need to be mapped based on actual board setup
  // For now, return empty string - will be set during creation
  return '';
}

// Status mapping (Trello → Acta)
export function mapStatusFromTrello(trelloListName: string): string {
  const map: { [key: string]: string } = {
    'To Do': 'pending',
    'In Progress': 'in_progress',
    'In Review': 'in_progress',
    Done: 'completed',
    Blocked: 'blocked',
  };
  return map[trelloListName] || 'pending';
}
