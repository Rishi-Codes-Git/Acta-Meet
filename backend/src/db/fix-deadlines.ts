import { query } from './index';

async function fixDeadlines() {
  try {
    console.log('Fixing action item deadlines...');
    
    // Update all action items with deadlines in the past to 7 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const result = await query(
      `UPDATE action_items 
       SET deadline = $1
       WHERE deadline < NOW() AND status != 'completed'
       RETURNING id, title, deadline`,
      [futureDateStr]
    );
    
    console.log(`Updated ${result.rows.length} action items with past deadlines`);
    
    // Also check for NULL deadlines and set them to 7 days from now
    const nullResult = await query(
      `UPDATE action_items 
       SET deadline = $1
       WHERE deadline IS NULL AND status != 'completed'
       RETURNING id, title, deadline`,
      [futureDateStr]
    );
    
    console.log(`Updated ${nullResult.rows.length} action items with NULL deadlines`);
    
    console.log('Deadline fix complete!');
  } catch (error) {
    console.error('Failed to fix deadlines:', error);
    process.exit(1);
  }
}

fixDeadlines();
