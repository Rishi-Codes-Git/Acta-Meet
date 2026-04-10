import bcrypt from 'bcrypt';
import { pool } from './index';

async function createRoleUsers() {
  try {
    console.log('🔄 Creating role-based user accounts...\n');
    
    const users = [
      { email: 'manager@acta.app', name: 'Manager', role: 'manager', password: 'Manager@123' },
      { email: 'associate@acta.app', name: 'Associate', role: 'associate', password: 'Associate@123' },
      { email: 'teamlead@acta.app', name: 'Team Lead', role: 'team_lead', password: 'TeamLead@123' },
    ];
    
    for (const user of users) {
      // Check if exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        console.log(`⚠️  ${user.role} account already exists`);
        continue;
      }
      
      // Hash password
      const password_hash = await bcrypt.hash(user.password, 10);
      
      // Create user
      await pool.query(
        'INSERT INTO users (email, name, role, password_hash) VALUES ($1, $2, $3, $4)',
        [user.email, user.name, user.role, password_hash]
      );
      
      console.log(`✅ ${user.role.toUpperCase()} created`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createRoleUsers();
