import { z } from 'zod/mini';
import { query } from '$app/server';
import { event } from '$lib/server/db/schema';
import type { Event } from '../list.remote';
import { getQuery } from '$lib/server/db/query-helpers';

/**
 * Query: Read a single event by ID
 */
export const readEvent = query(z.string(), async (eventId: string): Promise<Event | null> => {
	const result = await getQuery({
		table: event,
		featureName: 'events',
		id: eventId,
		transform: (row) => ({
			id: row.id,
			userId: row.userId,
			summary: row.summary,
			description: row.description,
			location: row.location,
			startDate: row.startDate,
			startDateTime: row.startDateTime,
			startTimeZone: row.startTimeZone,
			endDate: row.endDate,
			endDateTime: row.endDateTime,
			endTimeZone: row.endTimeZone,
			eventType: row.eventType,
			status: row.status,
			visibility: row.visibility,
			transparency: row.transparency,
			colorId: row.colorId,
			recurrence: row.recurrence,
			attendees: row.attendees,
			reminders: row.reminders,
			guestsCanInviteOthers: row.guestsCanInviteOthers,
			guestsCanModify: row.guestsCanModify,
			guestsCanSeeOtherGuests: row.guestsCanSeeOtherGuests,
			createdAt: row.createdAt?.toISOString?.() ?? null,
			updatedAt: row.updatedAt?.toISOString?.() ?? null,
		}),
	});
	return result;
});
