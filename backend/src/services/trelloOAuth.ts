/**
 * Trello OAuth Service - PLACEHOLDERED
 * 
 * This service is currently placeholdered. To enable Trello integration:
 * 1. Set environment variables: TRELLO_API_KEY, TRELLO_API_TOKEN
 * 2. Replace placeholder functions with actual implementation
 * 3. Enable sync logic in actionItems routes
 */

export interface TrelloOAuthToken {
  access_token: string;
  user: {
    id: string;
    fullName: string;
  };
}

export function getTrelloAuthUrl(redirectUri: string): string {
  // PLACEHOLDER: Trello integration coming soon
  throw new Error('Trello integration is currently disabled');
}

export async function verifyTrelloToken(token: string): Promise<boolean> {
  // PLACEHOLDER: Trello integration coming soon
  return false;
}

export async function getTrelloUserInfo(token: string): Promise<any> {
  // PLACEHOLDER: Trello integration coming soon
  throw new Error('Trello integration is currently disabled');
}

export async function getTrelloBoards(token: string): Promise<any[]> {
  // PLACEHOLDER: Trello integration coming soon
  throw new Error('Trello integration is currently disabled');
}

export async function getTrelloLists(token: string, boardId: string): Promise<any[]> {
  // PLACEHOLDER: Trello integration coming soon
  throw new Error('Trello integration is currently disabled');
}

export async function createTrelloCard(
  token: string,
  listId: string,
  actionItem: any
): Promise<string> {
  // PLACEHOLDER: Trello integration coming soon
  console.log('[PLACEHOLDER] Would create Trello card:', actionItem.title);
  return 'placeholder-trello-id';
}

export async function updateTrelloCard(
  token: string,
  cardId: string,
  updates: any
): Promise<void> {
  // PLACEHOLDER: Trello integration coming soon
  console.log('[PLACEHOLDER] Would update Trello card:', cardId);
}

export async function getTrelloCard(token: string, cardId: string): Promise<any> {
  // PLACEHOLDER: Trello integration coming soon
  throw new Error('Trello integration is currently disabled');
}

export async function registerTrelloWebhook(
  token: string,
  idModel: string,
  webhookUrl: string
): Promise<string> {
  // PLACEHOLDER: Trello integration coming soon
  console.log('[PLACEHOLDER] Would register Trello webhook');
  return 'placeholder-webhook-id';
}


// Priority mapping (Acta → Trello label)
function mapPriorityToTrelloLabel(priority: string): string {
  return 'yellow'; // PLACEHOLDER
}

// Priority mapping (Trello → Acta)
export function mapPriorityFromTrello(trelloLabel: string): string {
  return 'medium'; // PLACEHOLDER
}

// Status mapping (Acta → Trello - simplified)
function mapStatusToTrelloListId(status: string): string {
  return ''; // PLACEHOLDER
}

// Status mapping (Trello → Acta)
export function mapStatusFromTrello(trelloListName: string): string {
  return 'pending'; // PLACEHOLDER
}
