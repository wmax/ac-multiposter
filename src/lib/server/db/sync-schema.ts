import { pgTable, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { user } from "./schema";

/**
 * Sync provider configurations - each represents a configured sync connection
 */
export const syncConfig = pgTable("sync_config", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	providerId: text("provider_id").notNull(), // e.g., 'google-calendar-work', 'google-calendar-personal'
	providerType: text("provider_type").notNull(), // 'google-calendar', 'microsoft-calendar', etc.
	direction: text("direction").notNull(), // 'pull', 'push', 'bidirectional'
	enabled: boolean("enabled").default(true).notNull(),
	credentials: jsonb("credentials"), // Encrypted tokens, keys, etc.
	settings: jsonb("settings"), // Provider-specific settings
	lastSyncAt: timestamp("last_sync_at"),
	nextSyncAt: timestamp("next_sync_at"),
	syncToken: text("sync_token"), // For incremental syncs
	webhookId: text("webhook_id"), // Associated webhook subscription ID
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

/**
 * Tracks individual sync operations for auditing and retry
 */
export const syncOperation = pgTable("sync_operation", {
	id: text("id").primaryKey(),
	syncConfigId: text("sync_config_id")
		.notNull()
		.references(() => syncConfig.id, { onDelete: "cascade" }),
	operation: text("operation").notNull(), // 'pull', 'push', 'delete'
	status: text("status").notNull(), // 'pending', 'completed', 'failed'
	entityType: text("entity_type").notNull(), // 'event'
	entityId: text("entity_id"), // Internal entity ID
	externalId: text("external_id"), // Provider's entity ID
	error: text("error"),
	startedAt: timestamp("started_at").defaultNow().notNull(),
	completedAt: timestamp("completed_at"),
	retryCount: integer("retry_count").default(0).notNull(),
});

/**
 * Maps internal events to external provider events
 */
export const syncMapping = pgTable("sync_mapping", {
	id: text("id").primaryKey(),
	eventId: text("event_id").notNull(), // References event.id
	syncConfigId: text("sync_config_id")
		.notNull()
		.references(() => syncConfig.id, { onDelete: "cascade" }),
	externalId: text("external_id").notNull(), // Provider's event ID
	providerId: text("provider_id").notNull(), // Matches syncConfig.providerId
	lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
	etag: text("etag"), // For conflict detection
	metadata: jsonb("metadata"), // Provider-specific metadata
});

/**
 * Webhook subscriptions for push notifications
 */
export const webhookSubscription = pgTable("webhook_subscription", {
	id: text("id").primaryKey(),
	syncConfigId: text("sync_config_id")
		.notNull()
		.references(() => syncConfig.id, { onDelete: "cascade" }),
	providerId: text("provider_id").notNull(),
	resourceId: text("resource_id").notNull(), // Provider's resource identifier
	channelId: text("channel_id").notNull(), // Unique channel identifier
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
