import { query } from './index';

async function assignRoles() {
  try {
    console.log('Assigning roles to users...');
    
    const updates = [
      { email: 'rishiworks5@gmail.com', role: 'team_lead' },
      { email: 'gasithak@gmail.com', role: 'manager' },
      { email: 'kumarpraveen63263@gmail.com', role: 'associate' },
    ];
    
    for (const { email, role } of updates) {
      const result = await query(
        'UPDATE users SET role = $1 WHERE email = $2 RETURNING email, role',
        [role, email]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ ${email} → ${role}`);
      } else {
        console.log(`❌ ${email} not found`);
      }
    }
    
    console.log('Role assignment complete!');
  } catch (error) {
    console.error('Failed to assign roles:', error);
    process.exit(1);
  }
}

assignRoles();
