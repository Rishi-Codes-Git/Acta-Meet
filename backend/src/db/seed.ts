import bcrypt from 'bcrypt';
import { pool } from './index';

async function createTestUser() {
  try {
    console.log('🔄 Creating test user...');
    
    const email = 'test@acta.app';
    const name = 'Test User';
    const password = 'Test@123456';
    
    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('✅ Test user already exists');
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
    console.log(`✅ Test user created successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Use these credentials to log in`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
