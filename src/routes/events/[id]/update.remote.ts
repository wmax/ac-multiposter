import { command } from '$app/server';
import { z } from 'zod/mini';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { listEvents } from '../list.remote';
import { getEvent } from './view.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';

/**
 * Schema for updating an event
 * All fields are optional except the ID
 */
const updateEventSchema = z.object({
	id: z.string(),
	summary: z.optional(z.string()),
	description: z.optional(z.string()),
	location: z.optional(z.string()),
	startDate: z.optional(z.string()),
	startDateTime: z.optional(z.string()),
	startTimeZone: z.optional(z.string()),
	endDate: z.optional(z.string()),
	endDateTime: z.optional(z.string()),
	endTimeZone: z.optional(z.string()),
	eventType: z.optional(z.string()),
	status: z.optional(z.string()),
	visibility: z.optional(z.string()),
	transparency: z.optional(z.string()),
	colorId: z.optional(z.string()),
	recurrence: z.optional(z.array(z.string())),
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
 * Command: Update an event
 */
export const updateEvent = command(updateEventSchema, async (data) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'events');

	// Build update object with only provided fields
	const updateData: any = {};
	
	if (data.summary !== undefined) updateData.summary = data.summary;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.location !== undefined) updateData.location = data.location;
	if (data.startDate !== undefined) updateData.startDate = data.startDate;
	if (data.startDateTime !== undefined) updateData.startDateTime = data.startDateTime ? new Date(data.startDateTime) : null;
	if (data.startTimeZone !== undefined) updateData.startTimeZone = data.startTimeZone;
	if (data.endDate !== undefined) updateData.endDate = data.endDate;
	if (data.endDateTime !== undefined) updateData.endDateTime = data.endDateTime ? new Date(data.endDateTime) : null;
	if (data.endTimeZone !== undefined) updateData.endTimeZone = data.endTimeZone;
	if (data.eventType !== undefined) updateData.eventType = data.eventType;
	if (data.status !== undefined) updateData.status = data.status;
	if (data.visibility !== undefined) updateData.visibility = data.visibility;
	if (data.transparency !== undefined) updateData.transparency = data.transparency;
	if (data.colorId !== undefined) updateData.colorId = data.colorId;
	if (data.recurrence !== undefined) updateData.recurrence = data.recurrence as any;
	if (data.attendees !== undefined) updateData.attendees = data.attendees as any;
	if (data.reminders !== undefined) updateData.reminders = data.reminders as any;
	if (data.guestsCanInviteOthers !== undefined) updateData.guestsCanInviteOthers = data.guestsCanInviteOthers;
	if (data.guestsCanModify !== undefined) updateData.guestsCanModify = data.guestsCanModify;
	if (data.guestsCanSeeOtherGuests !== undefined) updateData.guestsCanSeeOtherGuests = data.guestsCanSeeOtherGuests;

	// Update the event
	await db
		.update(event)
		.set(updateData)
		.where(and(eq(event.id, data.id), eq(event.userId, user.id)));

	// Refresh both queries
	await getEvent(data.id).refresh();
	await listEvents().refresh();

	return { success: true };
});
