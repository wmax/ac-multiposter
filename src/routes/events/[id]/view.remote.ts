import { query } from '$app/server';
import { z } from 'zod/mini';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Event } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';

/**
 * Query: Get a single event by ID
 */
export const getEvent = query(z.string(), async (eventId) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'events');

	const events = await db
		.select()
		.from(event)
		.where(and(eq(event.id, eventId), eq(event.userId, user.id)));

	return events[0] as Event | null;
});
