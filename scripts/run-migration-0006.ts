import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Load DATABASE_URL from .env
const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const dbUrl = envFile
	.split('\n')
	.find((line) => line.startsWith('DATABASE_URL='))
	?.split('=')[1]
	?.trim()
	.replace(/^["']|["']$/g, ''); // Remove quotes

if (!dbUrl) {
	console.error('DATABASE_URL not found in .env');
	process.exit(1);
}

async function runMigration() {
	const pool = new Pool({
		connectionString: dbUrl
	});

	const db = drizzle(pool);

	// Read the migration file
	const migrationSQL = fs.readFileSync(
		path.join(process.cwd(), 'drizzle', '0006_many_maria_hill.sql'),
		'utf8'
	);

	try {
		// Execute the migration
		await pool.query(migrationSQL);
		console.log('✅ Migration 0006_many_maria_hill applied successfully!');
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runMigration();
