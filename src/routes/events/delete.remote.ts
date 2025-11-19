import { query } from '$app/server';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';

/**
 * Remote function to delete events by ID array
 */
export const deleteEvents = query(async (ids: string[]) => {
  const user = await getAuthenticatedUser();
  await ensureAccess(user, 'events');
  if (!Array.isArray(ids) || ids.length === 0) return { count: 0 };

  // Only delete events belonging to the user
  const result = await db.delete(event)
    .where(inArray(event.id, ids))
    .returning({ id: event.id });

  return { count: result.length, ids: result.map(r => r.id) };
});
