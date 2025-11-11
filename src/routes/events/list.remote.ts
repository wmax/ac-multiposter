import { query } from '$app/server';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthenticatedUser } from './auth';
import { ensureAccess } from '$lib/authorization';

/**
 * Event interface matching the database schema
 */
export interface Event {
	id: string;
	userId: string;
	googleEventId: string | null;
	googleCalendarId: string | null;
	iCalUID: string | null;
	etag: string | null;
	htmlLink: string | null;
	summary: string;
	description: string | null;
	location: string | null;
	colorId: string | null;
	eventType: string;
	status: string;
	startDate: string | null;
	startDateTime: Date | null;
	startTimeZone: string | null;
	endDate: string | null;
	endDateTime: Date | null;
	endTimeZone: string | null;
	endTimeUnspecified: boolean | null;
	recurrence: string[] | null;
	recurringEventId: string | null;
	originalStartTime: {
		date?: string;
		dateTime?: string;
		timeZone?: string;
	} | null;
	visibility: string | null;
	transparency: string | null;
	creator: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	} | null;
	organizer: {
		id?: string;
		email?: string;
		displayName?: string;
		self?: boolean;
	} | null;
	attendees: Array<{
		id?: string;
		email: string;
		displayName?: string;
		organizer?: boolean;
		self?: boolean;
		resource?: boolean;
		optional?: boolean;
		responseStatus?: string;
		comment?: string;
		additionalGuests?: number;
	}> | null;
	attendeesOmitted: boolean | null;
	guestsCanInviteOthers: boolean | null;
	guestsCanModify: boolean | null;
	guestsCanSeeOtherGuests: boolean | null;
	anyoneCanAddSelf: boolean | null;
	reminders: {
		useDefault: boolean;
		overrides?: Array<{
			method: string;
			minutes: number;
		}>;
	} | null;
	conferenceData: any | null;
	hangoutLink: string | null;
	attachments: Array<{
		fileUrl: string;
		title?: string;
		mimeType?: string;
		iconLink?: string;
		fileId?: string;
	}> | null;
	extendedProperties: {
		private?: Record<string, string>;
		shared?: Record<string, string>;
	} | null;
	workingLocationProperties: any | null;
	outOfOfficeProperties: any | null;
	focusTimeProperties: any | null;
	birthdayProperties: any | null;
	source: {
		url?: string;
		title?: string;
	} | null;
	locked: boolean | null;
	privateCopy: boolean | null;
	sequence: number | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * List all events for the authenticated user
 */
export const listEvents = query(async () => {
	const user = await getAuthenticatedUser();
	ensureAccess(user, 'events');

	const events = await db
		.select()
		.from(event)
		.where(eq(event.userId, user.id))
		.orderBy(desc(event.createdAt));

	return events as Event[];
});
