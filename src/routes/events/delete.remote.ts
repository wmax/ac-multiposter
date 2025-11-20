import { z } from 'zod/mini';
import { command } from '$app/server';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { inArray, and, eq } from 'drizzle-orm';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { listEvents } from './list.remote';

const deleteEventsSchema = z.array(z.string());

/**
 * Remote function to delete events by ID array
 */
export const deleteEvents = command(deleteEventsSchema, async (ids: string[]) => {
  const user = getAuthenticatedUser();
  ensureAccess(user, 'events');
  
  if (!Array.isArray(ids) || ids.length === 0) return { count: 0 };

  // Only delete events belonging to the user
  const result = await db.delete(event)
    .where(and(eq(event.userId, user.id), inArray(event.id, ids)))
    .returning({ id: event.id });

  // Refresh the list
  await listEvents().refresh();

  return { count: result.length, ids: result.map(r => r.id) };
});
