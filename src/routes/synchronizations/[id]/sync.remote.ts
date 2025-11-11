import { command } from '$app/server';
import { z } from 'zod/mini';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { syncService } from '$lib/server/sync/service';

/**
 * Trigger a manual sync for a configuration
 */
export const sync = command(z.string(), async (configId: string) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'synchronizations');
	return await syncService.syncEvents(configId);
});
