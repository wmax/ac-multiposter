const { readFileSync } = require('fs');
const { Client } = require('pg');

(async () => {
  const path = process.argv[2] || './drizzle/0002_set_defaults.sql';
  const sql = readFileSync(path, 'utf8');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set. Set the env var and retry.');
    process.exit(2);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB. Running SQL file:', path);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('SQL file applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error applying SQL file:', err.message || err);
    try { await client.query('ROLLBACK'); } catch(e){}
    process.exit(1);
  } finally {
    await client.end().catch(()=>{});
  }
})();
