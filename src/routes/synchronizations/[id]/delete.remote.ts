import { command } from '$app/server';
import { z } from 'zod/mini';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { db } from '$lib/server/db';
import { syncConfig } from '$lib/server/db/sync-schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Delete a sync configuration
 */
export const remove = command(z.string(), async (id: string) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'synchronizations');

	// Verify ownership
	const [existing] = await db
		.select()
		.from(syncConfig)
		.where(and(eq(syncConfig.id, id), eq(syncConfig.userId, user.id)));

	if (!existing) {
		throw new Error('Sync configuration not found');
	}

	// Delete (cascade will handle related records)
	await db.delete(syncConfig).where(eq(syncConfig.id, id));

	return { success: true };
});

/**
 * Bulk delete sync configurations
 */
export const removeBulk = command(z.array(z.string()), async (ids: string[]) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'synchronizations');

	if (ids.length === 0) {
		return { success: true, deleted: 0 };
	}

	// Delete all matching configs (ownership checked via where clause)
	const result = await db
		.delete(syncConfig)
		.where(and(inArray(syncConfig.id, ids), eq(syncConfig.userId, user.id)));

	return { success: true };
});
