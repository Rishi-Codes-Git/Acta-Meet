import { pool } from './index';

async function addTrelloCardId() {
  try {
    console.log('🔄 Adding trello_card_id column to action_items table...');
    await pool.query(
      `ALTER TABLE action_items 
       ADD COLUMN IF NOT EXISTS trello_card_id VARCHAR(255);`
    );
    console.log('✅ Column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addTrelloCardId();
