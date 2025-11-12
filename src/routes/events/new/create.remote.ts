import { form } from '$app/server';
import { command } from '$app/server';
import { z } from 'zod/mini';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { listEvents } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { syncService } from '$lib/server/sync/service';

/**
 * Schema for creating a new event
 * Simplified version with core fields - can be extended based on UI needs
 */
const createEventSchema = z.object({
	summary: z.string().check(z.minLength(1)),
	description: z.optional(z.string()),
	location: z.optional(z.string()),
	startDate: z.optional(z.string()), // yyyy-mm-dd for all-day events
	startDateTime: z.optional(z.string()), // ISO 8601 string for timed events
	startTimeZone: z.optional(z.string()),
	endDate: z.optional(z.string()),
	endDateTime: z.optional(z.string()),
	endTimeZone: z.optional(z.string()),
	eventType: z.optional(z.string()),
	visibility: z.optional(z.string()),
	transparency: z.optional(z.string()),
	colorId: z.optional(z.string()),
	recurrence: z.optional(z.array(z.string())), // RRULE strings
	attendees: z.optional(z.array(z.object({
		email: z.string(),
		displayName: z.optional(z.string()),
		optional: z.optional(z.boolean()),
		responseStatus: z.optional(z.string()),
	}))),
	reminders: z.optional(z.object({
		useDefault: z.boolean(),
		overrides: z.optional(z.array(z.object({
			method: z.string(),
			minutes: z.number(),
		}))),
	})),
	guestsCanInviteOthers: z.optional(z.boolean()),
	guestsCanModify: z.optional(z.boolean()),
	guestsCanSeeOtherGuests: z.optional(z.boolean()),
});

/**
 * Command function for creating a new event
 */
export const createEvent = command(createEventSchema, async (data) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'events');

	// Validate date/time ranges
	// For all-day events
	if (data.startDate && data.endDate) {
		if (data.endDate < data.startDate) {
			throw new Error('End date must be the same as or after the start date');
		}
	}
	
	// For date-time events
	if (data.startDateTime && data.endDateTime) {
		const startDateTime = new Date(data.startDateTime);
		const endDateTime = new Date(data.endDateTime);
		
		if (endDateTime <= startDateTime) {
			throw new Error('End date and time must be after the start date and time');
		}
	}

	// Generate a unique ID for the event
	const id = crypto.randomUUID();

	// Convert ISO string dates to Date objects if provided
	const startDateTime = data.startDateTime ? new Date(data.startDateTime) : null;
	const endDateTime = data.endDateTime ? new Date(data.endDateTime) : null;

	// Insert the event
	await db.insert(event).values({
		id,
		userId: user.id,
		summary: data.summary,
		description: data.description || null,
		location: data.location || null,
		startDate: data.startDate || null,
		startDateTime,
		startTimeZone: data.startTimeZone || null,
		endDate: data.endDate || null,
		endDateTime,
		endTimeZone: data.endTimeZone || null,
		eventType: data.eventType || 'default',
		status: 'confirmed',
		visibility: data.visibility || 'default',
		transparency: data.transparency || 'opaque',
		colorId: data.colorId || null,
		recurrence: data.recurrence as any || null,
		attendees: data.attendees as any || null,
		reminders: data.reminders as any || null,
		guestsCanInviteOthers: data.guestsCanInviteOthers ?? true,
		guestsCanModify: data.guestsCanModify ?? false,
		guestsCanSeeOtherGuests: data.guestsCanSeeOtherGuests ?? true,
		attendeesOmitted: false,
		anyoneCanAddSelf: false,
		locked: false,
		privateCopy: false,
		sequence: 0,
	});

	// Trigger sync to external providers (non-blocking)
	syncService.syncSpecificEvents(user.id, [id]).catch((error) => {
		console.error('[createEvent] Failed to sync event to providers:', error);
	});

	return { success: true, id };
});
