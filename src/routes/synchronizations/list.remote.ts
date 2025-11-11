import { query } from '$app/server';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { db } from '$lib/server/db';
import { syncConfig } from '$lib/server/db/sync-schema';
import { eq, desc } from 'drizzle-orm';

/**
 * List all sync configurations for the current user
 */
export const list = query(async () => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'synchronizations');

	const configs = await db
		.select()
		.from(syncConfig)
		.where(eq(syncConfig.userId, user.id))
		.orderBy(desc(syncConfig.createdAt));

	return configs;
});
