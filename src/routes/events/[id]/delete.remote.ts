import { command } from '$app/server';
import { z } from 'zod/mini';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { listEvents } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { syncService } from '$lib/server/sync/service';

/**
 * Command: Delete one or more events
 * Accepts an array of event IDs
 */
export const deleteEvents = command(
	z.array(z.string()).check(z.minLength(1)),
	async (eventIds) => {
		const user = getAuthenticatedUser();
		ensureAccess(user, 'events');

		// Delete from external providers and mappings (before deleting from DB)
		await syncService.deleteEventMappings(user.id, eventIds).catch((error) => {
			console.error('[deleteEvents] Failed to delete from external providers:', error);
			// Continue with local deletion even if sync fails
		});

		// Delete the events from local database
		await db
			.delete(event)
			.where(and(inArray(event.id, eventIds), eq(event.userId, user.id)));

		// Refresh the list
		await listEvents().refresh();

		return { success: true, count: eventIds.length };
	}
);
