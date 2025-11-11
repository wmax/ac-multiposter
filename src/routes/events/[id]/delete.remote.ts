import { command } from '$app/server';
import { z } from 'zod/mini';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { listEvents } from '../list.remote';
import { getAuthenticatedUser } from '../auth';
import { ensureAccess } from '$lib/authorization';

/**
 * Command: Delete one or more events
 * Accepts an array of event IDs
 */
export const deleteEvents = command(
	z.array(z.string()).check(z.minLength(1)),
	async (eventIds) => {
		const user = await getAuthenticatedUser();
		ensureAccess(user, 'events');

		// Delete the events
		await db
			.delete(event)
			.where(and(inArray(event.id, eventIds), eq(event.userId, user.id)));

		// Refresh the list
		await listEvents().refresh();

		return { success: true, count: eventIds.length };
	}
);
