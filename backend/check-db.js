const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://mom_user:password@localhost:5432/mom_db'
});

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;", (err, res) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log('✅ Tables in database:');
    res.rows.forEach(row => console.log('  -', row.table_name));
    console.log('\nTotal tables:', res.rows.length);
  }
  pool.end();
});
