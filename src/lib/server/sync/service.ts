import type {
	SyncProvider,
	SyncConfig,
	SyncMapping,
	ExternalEvent,
	SyncResult,
	SyncDirection,
	ProviderType
} from './types';
import { db } from '../db';
import {
	syncConfig as syncConfigTable,
	syncOperation as syncOperationTable,
	syncMapping as syncMappingTable,
	webhookSubscription as webhookSubscriptionTable,
	event as eventTable
} from '../db/schema';
import { eq, and, isNull, lt } from 'drizzle-orm';
import { GoogleCalendarProvider } from './providers/google-calendar';
import crypto from 'crypto';

/**
 * Central sync service orchestrator
 * Manages provider instances and coordinates sync operations
 */
export class SyncService {
	private providers = new Map<ProviderType, new () => SyncProvider>();

	constructor() {
		// Register built-in providers
		this.registerProvider('google-calendar', GoogleCalendarProvider);
	}

	/**
	 * Register a new sync provider
	 */
	registerProvider(type: ProviderType, providerClass: new () => SyncProvider): void {
		this.providers.set(type, providerClass);
	}

	/**
	 * Get provider instance for a sync config
	 */
	private async getProviderInstance(config: SyncConfig): Promise<SyncProvider> {
		const ProviderClass = this.providers.get(config.providerType);
		if (!ProviderClass) {
			throw new Error(`Unknown provider type: ${config.providerType}`);
		}

		const provider = new ProviderClass();
		await provider.initialize(config);

		return provider;
	}

	/**
	 * Convert database row to SyncConfig type
	 */
	private rowToConfig(row: typeof syncConfigTable.$inferSelect): SyncConfig {
		return {
			id: row.id,
			userId: row.userId,
			providerId: row.providerId,
			providerType: row.providerType as ProviderType,
			direction: row.direction as SyncDirection,
			enabled: row.enabled,
			credentials: row.credentials as Record<string, any> | undefined,
			settings: row.settings as Record<string, any> | undefined,
			lastSyncAt: row.lastSyncAt ?? undefined,
			nextSyncAt: row.nextSyncAt ?? undefined,
			syncToken: row.syncToken ?? undefined,
			webhookId: row.webhookId ?? undefined,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt
		};
	}

	/**
	 * Sync events for a specific configuration
	 * Handles bidirectional sync (pull from provider, push local changes)
	 */
	async syncEvents(configId: string): Promise<SyncResult> {
		const result: SyncResult = {
			success: true,
			pulled: 0,
			pushed: 0,
			errors: []
		};

		let operationId: string | undefined;

		try {
			// Get sync config
			const [configRow] = await db
				.select()
				.from(syncConfigTable)
				.where(and(eq(syncConfigTable.id, configId), eq(syncConfigTable.enabled, true)));

			if (!configRow) {
				throw new Error(`Sync config not found or disabled: ${configId}`);
			}

			const config = this.rowToConfig(configRow);

			// Create operation record
			operationId = crypto.randomUUID();
			await db.insert(syncOperationTable).values({
				id: operationId,
				syncConfigId: configId,
				operation: 'pull',
				status: 'pending',
				entityType: 'event',
				startedAt: new Date()
			});

			// Initialize provider
			const provider = await this.getProviderInstance(config);

			// Pull events from provider
			if (config.direction === 'pull' || config.direction === 'bidirectional') {
				const pullResult = await this.pullFromProvider(config, provider);
				result.pulled = pullResult.pulled;
				result.errors.push(...pullResult.errors);
			}

			// Push local changes to provider
			if (config.direction === 'push' || config.direction === 'bidirectional') {
				const pushResult = await this.pushToProvider(config, provider);
				result.pushed = pushResult.pushed;
				result.errors.push(...pushResult.errors);
			}

			// Update operation status
			await db
				.update(syncOperationTable)
				.set({
					status: result.errors.length > 0 ? 'failed' : 'completed',
					completedAt: new Date()
				})
				.where(eq(syncOperationTable.id, operationId));

			// Update sync config with last sync time
			await db
				.update(syncConfigTable)
				.set({
					lastSyncAt: new Date(),
					nextSyncAt: this.calculateNextSync(config)
				})
				.where(eq(syncConfigTable.id, configId));

			result.success = result.errors.length === 0;
			return result;
		} catch (error: any) {
			result.success = false;
			result.errors.push({ message: error.message });

			// Update operation as failed if we created one
			if (operationId) {
				await db
					.update(syncOperationTable)
					.set({
						status: 'failed',
						completedAt: new Date(),
						error: error.message
					})
					.where(eq(syncOperationTable.id, operationId));
			}

			throw error;
		}
	}

	/**
	 * Pull events from external provider and update local database
	 */
	private async pullFromProvider(
		config: SyncConfig,
		provider: SyncProvider
	): Promise<{ pulled: number; errors: SyncResult['errors'] }> {
		const result = { pulled: 0, errors: [] as SyncResult['errors'] };

		try {
			// Pull events using sync token if available
			const { events, nextSyncToken } = await provider.pullEvents(config.syncToken);

			for (const externalEvent of events) {
				try {
					await this.processExternalEvent(config, externalEvent);
					result.pulled++;
				} catch (error: any) {
					result.errors.push({
						externalId: externalEvent.externalId,
						message: `Failed to process event ${externalEvent.externalId}: ${error.message}`
					});
				}
			}

			// Store new sync token for incremental syncs
			if (nextSyncToken) {
				await db
					.update(syncConfigTable)
					.set({ syncToken: nextSyncToken })
					.where(eq(syncConfigTable.id, config.id));
			}
		} catch (error: any) {
			result.errors.push({ message: `Pull failed: ${error.message}` });
		}

		return result;
	}

	/**
	 * Push local event changes to external provider
	 */
	private async pushToProvider(
		config: SyncConfig,
		provider: SyncProvider
	): Promise<{ pushed: number; errors: SyncResult['errors'] }> {
		const result = { pushed: 0, errors: [] as SyncResult['errors'] };

		try {
			// Find local events that need to be pushed (no mapping exists)
			const unmappedEvents = await db
				.select({ event: eventTable })
				.from(eventTable)
				.leftJoin(syncMappingTable, eq(eventTable.id, syncMappingTable.eventId))
				.where(and(eq(eventTable.userId, config.userId), isNull(syncMappingTable.eventId)));

			for (const { event } of unmappedEvents) {
				try {
					const externalEvent = this.mapInternalToExternal(event, config.providerType);
					const { externalId, etag } = await provider.pushEvent(externalEvent);

					await db.insert(syncMappingTable).values({
						id: crypto.randomUUID(),
						syncConfigId: config.id,
						eventId: event.id,
						externalId: externalId,
						providerId: config.providerId,
						etag: etag ?? null,
						lastSyncedAt: new Date()
					});

					result.pushed++;
				} catch (error: any) {
					result.errors.push({
						entityId: event.id,
						message: `Failed to push event ${event.id}: ${error.message}`
					});
				}
			}

			// Push updates to already-mapped events
			const mappedEvents = await db
				.select({ event: eventTable, mapping: syncMappingTable })
				.from(eventTable)
				.innerJoin(syncMappingTable, eq(eventTable.id, syncMappingTable.eventId))
				.where(and(eq(eventTable.userId, config.userId), eq(syncMappingTable.syncConfigId, config.id)));

			for (const { event, mapping } of mappedEvents) {
				try {
					// Skip if not modified since last sync
					if (mapping.lastSyncedAt && event.updatedAt <= mapping.lastSyncedAt) {
						continue;
					}

					const externalEvent = this.mapInternalToExternal(event, config.providerType);
					const { etag } = await provider.updateEvent(mapping.externalId, externalEvent);

					await db
						.update(syncMappingTable)
						.set({ etag: etag ?? null, lastSyncedAt: new Date() })
						.where(eq(syncMappingTable.id, mapping.id));

					result.pushed++;
				} catch (error: any) {
					result.errors.push({
						entityId: event.id,
						externalId: mapping.externalId,
						message: `Failed to update event ${event.id}: ${error.message}`
					});
				}
			}
		} catch (error: any) {
			result.errors.push({ message: `Push failed: ${error.message}` });
		}

		return result;
	}

	/**
	 * Process an external event from a provider (create or update local event)
	 */
	private async processExternalEvent(config: SyncConfig, externalEvent: ExternalEvent): Promise<void> {
		const [mapping] = await db
			.select()
			.from(syncMappingTable)
			.where(
				and(
					eq(syncMappingTable.syncConfigId, config.id),
					eq(syncMappingTable.externalId, externalEvent.externalId)
				)
			);

		if (mapping) {
			// Update existing event
			const internalEvent = this.mapExternalToInternal(externalEvent, config.userId);

			await db
				.update(eventTable)
				.set({ ...internalEvent, updatedAt: new Date() })
				.where(eq(eventTable.id, mapping.eventId));

			await db
				.update(syncMappingTable)
				.set({ etag: externalEvent.etag ?? null, lastSyncedAt: new Date() })
				.where(eq(syncMappingTable.id, mapping.id));
		} else {
			// Create new event
			const internalEvent = this.mapExternalToInternal(externalEvent, config.userId);
			const [newEvent] = await db.insert(eventTable).values(internalEvent).returning();

			await db.insert(syncMappingTable).values({
				id: crypto.randomUUID(),
				syncConfigId: config.id,
				eventId: newEvent.id,
				externalId: externalEvent.externalId,
				providerId: config.providerId,
				etag: externalEvent.etag ?? null,
				lastSyncedAt: new Date()
			});
		}
	}

	/**
	 * Handle incoming webhook notification
	 */
	async handleWebhook(
		providerId: ProviderType,
		payload: any
	): Promise<{ configId: string; processed: boolean }> {
		const configs = await db
			.select()
			.from(syncConfigTable)
			.where(and(eq(syncConfigTable.providerType, providerId), eq(syncConfigTable.enabled, true)));

		for (const configRow of configs) {
			// Trigger async sync (don't await - run in background)
			this.syncEvents(configRow.id).catch((error) => {
				console.error(`Webhook-triggered sync failed for config ${configRow.id}:`, error);
			});
		}

		return {
			configId: configs[0]?.id || '',
			processed: true
		};
	}

	/**
	 * Setup webhook for a sync config
	 */
	async setupWebhook(configId: string, callbackUrl: string): Promise<void> {
		const [configRow] = await db.select().from(syncConfigTable).where(eq(syncConfigTable.id, configId));

		if (!configRow) {
			throw new Error(`Sync config not found: ${configId}`);
		}

		const config = this.rowToConfig(configRow);
		const provider = await this.getProviderInstance(config);

		if (!provider.supportsWebhooks) {
			throw new Error(`Provider ${config.providerType} does not support webhooks`);
		}

		// Cancel existing webhooks
		const existingSubscriptions = await db
			.select()
			.from(webhookSubscriptionTable)
			.where(eq(webhookSubscriptionTable.syncConfigId, configId));

		for (const sub of existingSubscriptions) {
			try {
				await provider.cancelWebhook?.(sub);
			} catch (error) {
				console.error('Failed to cancel existing webhook:', error);
			}
			await db.delete(webhookSubscriptionTable).where(eq(webhookSubscriptionTable.id, sub.id));
		}

		// Setup new webhook
		const subscription = await provider.setupWebhook?.(callbackUrl);

		if (subscription) {
			await db.insert(webhookSubscriptionTable).values(subscription);
			await db
				.update(syncConfigTable)
				.set({ webhookId: subscription.channelId })
				.where(eq(syncConfigTable.id, configId));
		}
	}

	/**
	 * Renew expiring webhooks
	 */
	async renewWebhooks(): Promise<void> {
		const expiringDate = new Date();
		expiringDate.setHours(expiringDate.getHours() + 24);

		const expiring = await db
			.select()
			.from(webhookSubscriptionTable)
			.where(lt(webhookSubscriptionTable.expiresAt, expiringDate));

		for (const subscription of expiring) {
			try {
				const [configRow] = await db
					.select()
					.from(syncConfigTable)
					.where(eq(syncConfigTable.id, subscription.syncConfigId));

				if (!configRow) continue;

				const config = this.rowToConfig(configRow);
				const provider = await this.getProviderInstance(config);
				const newSubscription = await provider.renewWebhook?.(subscription);

				if (newSubscription) {
					await db
						.delete(webhookSubscriptionTable)
						.where(eq(webhookSubscriptionTable.id, subscription.id));
					await db.insert(webhookSubscriptionTable).values(newSubscription);
					await db
						.update(syncConfigTable)
						.set({ webhookId: newSubscription.channelId })
						.where(eq(syncConfigTable.id, config.id));
				}
			} catch (error) {
				console.error(`Failed to renew webhook for subscription ${subscription.id}:`, error);
			}
		}
	}

	/**
	 * Map external event to internal event format
	 */
	private mapExternalToInternal(
		external: ExternalEvent,
		userId: string
	): typeof eventTable.$inferInsert {
		return {
			id: crypto.randomUUID(),
			userId,
			summary: external.summary,
			description: external.description ?? null,
			location: external.location ?? null,
			startDate: external.startDate ?? null,
			startDateTime: external.startDateTime ?? null,
			startTimeZone: external.startTimeZone ?? null,
			endDate: external.endDate ?? null,
			endDateTime: external.endDateTime ?? null,
			endTimeZone: external.endTimeZone ?? null,
			attendees: external.attendees ?? null,
			recurrence: external.recurrence ?? null,
			reminders: external.reminders ?? null,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	}

	/**
	 * Map internal event to external event format
	 */
	private mapInternalToExternal(
		internal: typeof eventTable.$inferSelect,
		providerId: ProviderType
	): ExternalEvent {
		return {
			externalId: '',
			providerId,
			summary: internal.summary,
			description: internal.description ?? undefined,
			location: internal.location ?? undefined,
			startDate: internal.startDate ?? undefined,
			startDateTime: internal.startDateTime ?? undefined,
			startTimeZone: internal.startTimeZone ?? undefined,
			endDate: internal.endDate ?? undefined,
			endDateTime: internal.endDateTime ?? undefined,
			endTimeZone: internal.endTimeZone ?? undefined,
			attendees: (internal.attendees as any) ?? undefined,
			recurrence: (internal.recurrence as any) ?? undefined,
			reminders: (internal.reminders as any) ?? undefined
		};
	}

	/**
	 * Calculate next sync time based on config settings
	 */
	private calculateNextSync(config: SyncConfig): Date {
		const now = new Date();
		const intervalMinutes = (config.settings?.syncIntervalMinutes as number) || 60;
		now.setMinutes(now.getMinutes() + intervalMinutes);
		return now;
	}
}

// Export singleton instance
export const syncService = new SyncService();
