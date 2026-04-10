import axios from 'axios';

const TRELLO_API_URL = 'https://api.trello.com/1';

const getTrelloParams = () => ({
  key: process.env.TRELLO_KEY,
  token: process.env.TRELLO_TOKEN,
});

export const trelloService = {
  createCard: async (title: string, description: string) => {
    if (!process.env.TRELLO_KEY || !process.env.TRELLO_TOKEN || !process.env.TRELLO_LIST_ID) {
      console.warn('⚠️ Trello credentials not configured, skipping card creation');
      return null;
    }

    try {
      const response = await axios.post(`${TRELLO_API_URL}/cards`, {
        name: title,
        desc: description,
        idList: process.env.TRELLO_LIST_ID,
        ...getTrelloParams(),
      });

      console.log(`✅ Trello card created: ${response.data.id} - ${title}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create Trello card:', error.response?.data || error.message);
      return null;
    }
  },

  updateCard: async (cardId: string, title: string, description: string) => {
    if (!process.env.TRELLO_KEY || !process.env.TRELLO_TOKEN) {
      return null;
    }

    try {
      const response = await axios.put(`${TRELLO_API_URL}/cards/${cardId}`, {
        name: title,
        desc: description,
        ...getTrelloParams(),
      });

      console.log(`✅ Trello card updated: ${cardId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update Trello card:', error.response?.data || error.message);
      return null;
    }
  },

  createCardForActionItem: async (title: string, description?: string) => {
    const desc = description || 'Task created from Acta meeting action item';
    return trelloService.createCard(title, desc);
  },
};

