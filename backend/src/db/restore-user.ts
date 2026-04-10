import bcrypt from 'bcrypt';
import { pool } from './index';

async function restoreUser() {
  try {
    console.log('🔄 Restoring user account...');
    
    const email = 'gasithak@gmail.com';
    const name = 'Gasithak';
    const password = 'test@123';
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists in database');
      process.exit(0);
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, name, password_hash]
    );
    
    const user = result.rows[0];
    console.log(`✅ User account restored!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Ready to log in`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring user:', error);
    process.exit(1);
  }
}

restoreUser();
