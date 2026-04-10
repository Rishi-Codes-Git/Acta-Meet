import { pool } from './index';

async function addOtpColumns() {
  try {
    console.log('🔄 Adding OTP columns to users table...');
    await pool.query(
      `ALTER TABLE users 
       ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
       ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;`
    );
    console.log('✅ OTP columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addOtpColumns();
