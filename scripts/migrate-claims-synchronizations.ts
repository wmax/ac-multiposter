/**
 * Migration script to rename calendarSyncs claim to synchronizations
 * Run with: pnpm tsx scripts/migrate-claims-synchronizations.ts
 */
import { db } from '../src/lib/server/db';
import { user } from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';

async function migrateClaims() {
	console.log('Starting claims migration: calendarSyncs -> synchronizations');

	try {
		// Update claims where calendarSyncs exists
		// This handles both string and jsonb column types
		const result = await db.execute(sql`
			UPDATE "user"
			SET claims = CASE
				WHEN claims IS NULL THEN NULL
				WHEN claims::text LIKE '%calendarSyncs%' THEN 
					REPLACE(claims::text, '"calendarSyncs"', '"synchronizations"')::jsonb
				ELSE claims
			END
			WHERE claims::text LIKE '%calendarSyncs%'
		`);

		console.log('Migration completed successfully');
		console.log(`Result:`, result);
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}

	process.exit(0);
}

migrateClaims();
