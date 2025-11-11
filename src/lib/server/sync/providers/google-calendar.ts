import type {
	SyncProvider,
	SyncConfig,
	ExternalEvent,
	WebhookSubscription,
	ProviderType,
	SyncDirection
} from '../types';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

/**
 * Google Calendar sync provider implementation
 */
export class GoogleCalendarProvider implements SyncProvider {
	readonly type: ProviderType = 'google-calendar';
	readonly name = 'Google Calendar';
	readonly supportsWebhooks = true;
	readonly supportedDirections: SyncDirection[] = ['pull', 'push', 'bidirectional'];

	private config?: SyncConfig;
	private calendar?: calendar_v3.Calendar;
	private calendarId = 'primary'; // Can be overridden in settings

	async initialize(config: SyncConfig): Promise<void> {
		this.config = config;

		if (config.settings?.calendarId) {
			this.calendarId = config.settings.calendarId as string;
		}

		// Initialize OAuth2 client with stored credentials
		const credentials = config.credentials as {
			accessToken: string;
			refreshToken?: string;
			expiresAt?: number;
		};

		if (!credentials?.accessToken) {
			throw new Error('Missing access token for Google Calendar');
		}

		const oauth2Client = new google.auth.OAuth2(
			process.env.GOOGLE_CLIENT_ID,
			process.env.GOOGLE_CLIENT_SECRET
		);

		oauth2Client.setCredentials({
			access_token: credentials.accessToken,
			refresh_token: credentials.refreshToken,
			expiry_date: credentials.expiresAt
		});

		this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
	}

	async validateConnection(): Promise<boolean> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		try {
			await this.calendar.calendarList.list({ maxResults: 1 });
			return true;
		} catch (error) {
			console.error('Google Calendar connection validation failed:', error);
			return false;
		}
	}

	async pullEvents(syncToken?: string): Promise<{
		events: ExternalEvent[];
		nextSyncToken?: string;
	}> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		try {
			const params: calendar_v3.Params$Resource$Events$List = {
				calendarId: this.calendarId,
				maxResults: 250,
				singleEvents: true, // Expand recurring events
				orderBy: 'updated'
			};

			// Use sync token for incremental sync, otherwise full sync
			if (syncToken) {
				params.syncToken = syncToken;
			} else {
				// For full sync, only get events from the past year to now + 2 years
				const now = new Date();
				const pastYear = new Date(now);
				pastYear.setFullYear(now.getFullYear() - 1);
				const futureYears = new Date(now);
				futureYears.setFullYear(now.getFullYear() + 2);

				params.timeMin = pastYear.toISOString();
				params.timeMax = futureYears.toISOString();
			}

			const response = await this.calendar.events.list(params);

			const events: ExternalEvent[] = (response.data.items || [])
				.filter((e: calendar_v3.Schema$Event) => e.status !== 'cancelled') // Skip cancelled events
				.map((e: calendar_v3.Schema$Event) => this.mapToExternalEvent(e));

			return {
				events,
				nextSyncToken: response.data.nextSyncToken ?? undefined
			};
		} catch (error: any) {
			// Handle sync token invalidation
			if (error.code === 410 && syncToken) {
				console.warn('Sync token expired, performing full sync');
				return this.pullEvents(); // Retry without sync token
			}
			throw error;
		}
	}

	async pushEvent(event: ExternalEvent): Promise<{ externalId: string; etag?: string }> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		const gcalEvent = this.mapToGoogleEvent(event);

		const response = await this.calendar.events.insert({
			calendarId: this.calendarId,
			requestBody: gcalEvent
		});

		return {
			externalId: response.data.id!,
			etag: response.data.etag ?? undefined
		};
	}

	async updateEvent(externalId: string, event: ExternalEvent): Promise<{ etag?: string }> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		const gcalEvent = this.mapToGoogleEvent(event);

		const response = await this.calendar.events.update({
			calendarId: this.calendarId,
			eventId: externalId,
			requestBody: gcalEvent
		});

		return {
			etag: response.data.etag ?? undefined
		};
	}

	async deleteEvent(externalId: string): Promise<void> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		await this.calendar.events.delete({
			calendarId: this.calendarId,
			eventId: externalId
		});
	}

	async setupWebhook(callbackUrl: string): Promise<WebhookSubscription> {
		if (!this.calendar || !this.config) {
			throw new Error('Provider not initialized');
		}

		const channelId = crypto.randomUUID();
		const resourceId = crypto.randomUUID();

		const response = await this.calendar.events.watch({
			calendarId: this.calendarId,
			requestBody: {
				id: channelId,
				type: 'web_hook',
				address: callbackUrl,
				token: this.config.id // Use config ID as verification token
			}
		});

		const expiresAt = new Date(parseInt(response.data.expiration || '0'));

		return {
			id: crypto.randomUUID(),
			syncConfigId: this.config.id,
			providerId: this.config.providerId,
			resourceId: response.data.resourceId || resourceId,
			channelId,
			expiresAt,
			createdAt: new Date()
		};
	}

	async renewWebhook(subscription: WebhookSubscription): Promise<WebhookSubscription> {
		// Google Calendar requires stopping the old channel and creating a new one
		await this.cancelWebhook(subscription);

		// Reconstruct callback URL from environment
		const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:5173';
		const callbackUrl = `${baseUrl}/api/sync/webhook/google-calendar`;

		return this.setupWebhook(callbackUrl);
	}

	async cancelWebhook(subscription: WebhookSubscription): Promise<void> {
		if (!this.calendar) {
			throw new Error('Provider not initialized');
		}

		try {
			await this.calendar.channels.stop({
				requestBody: {
					id: subscription.channelId,
					resourceId: subscription.resourceId
				}
			});
		} catch (error) {
			console.error('Failed to cancel Google Calendar webhook:', error);
			// Don't throw - webhook may have already expired
		}
	}

	async processWebhook(payload: any): Promise<{
		changes: Array<{ externalId: string; changeType: 'created' | 'updated' | 'deleted' }>;
	}> {
		// Google Calendar webhooks don't include change details
		// They just notify that something changed, requiring a sync
		// We'll trigger a pull to get the actual changes
		const { events } = await this.pullEvents(this.config?.syncToken);

		// Map events to changes (all treated as updated for simplicity)
		const changes = events.map((event) => ({
			externalId: event.externalId,
			changeType: 'updated' as const
		}));

		return { changes };
	}

	private mapToExternalEvent(gcalEvent: calendar_v3.Schema$Event): ExternalEvent {
		return {
			externalId: gcalEvent.id!,
			providerId: this.config!.providerId,
			summary: gcalEvent.summary || 'Untitled Event',
			description: gcalEvent.description ?? undefined,
			location: gcalEvent.location ?? undefined,
			startDate: gcalEvent.start?.date ?? undefined,
			startDateTime: gcalEvent.start?.dateTime ? new Date(gcalEvent.start.dateTime) : undefined,
			startTimeZone: gcalEvent.start?.timeZone ?? undefined,
			endDate: gcalEvent.end?.date ?? undefined,
			endDateTime: gcalEvent.end?.dateTime ? new Date(gcalEvent.end.dateTime) : undefined,
			endTimeZone: gcalEvent.end?.timeZone ?? undefined,
			attendees: gcalEvent.attendees?.map((a: calendar_v3.Schema$EventAttendee) => ({
				email: a.email!,
				displayName: a.displayName ?? undefined,
				responseStatus: a.responseStatus ?? undefined
			})),
			recurrence: gcalEvent.recurrence ?? undefined,
			reminders: gcalEvent.reminders
				? {
						useDefault: gcalEvent.reminders.useDefault || false,
						overrides: gcalEvent.reminders.overrides?.map((r: calendar_v3.Schema$EventReminder) => ({
							method: r.method!,
							minutes: r.minutes!
						}))
				  }
				: undefined,
			etag: gcalEvent.etag ?? undefined,
			updatedAt: gcalEvent.updated ? new Date(gcalEvent.updated) : undefined,
			metadata: {
				htmlLink: gcalEvent.htmlLink,
				colorId: gcalEvent.colorId,
				visibility: gcalEvent.visibility,
				transparency: gcalEvent.transparency
			}
		};
	}

	private mapToGoogleEvent(event: ExternalEvent): calendar_v3.Schema$Event {
		const gcalEvent: calendar_v3.Schema$Event = {
			summary: event.summary,
			description: event.description,
			location: event.location,
			start: {},
			end: {},
			attendees: event.attendees?.map((a) => ({
				email: a.email,
				displayName: a.displayName,
				responseStatus: a.responseStatus
			})),
			recurrence: event.recurrence,
			reminders: event.reminders
		};

		// Handle start time
		if (event.startDateTime) {
			gcalEvent.start!.dateTime = event.startDateTime.toISOString();
			gcalEvent.start!.timeZone = event.startTimeZone;
		} else if (event.startDate) {
			gcalEvent.start!.date = event.startDate;
		}

		// Handle end time
		if (event.endDateTime) {
			gcalEvent.end!.dateTime = event.endDateTime.toISOString();
			gcalEvent.end!.timeZone = event.endTimeZone;
		} else if (event.endDate) {
			gcalEvent.end!.date = event.endDate;
		}

		// Apply metadata if available
		if (event.metadata) {
			gcalEvent.colorId = event.metadata.colorId;
			gcalEvent.visibility = event.metadata.visibility;
			gcalEvent.transparency = event.metadata.transparency;
		}

		return gcalEvent;
	}
}
