CREATE TABLE "sync_config" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_type" text NOT NULL,
	"direction" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"credentials" jsonb,
	"settings" jsonb,
	"last_sync_at" timestamp,
	"next_sync_at" timestamp,
	"sync_token" text,
	"webhook_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_mapping" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"sync_config_id" text NOT NULL,
	"external_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"etag" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sync_operation" (
	"id" text PRIMARY KEY NOT NULL,
	"sync_config_id" text NOT NULL,
	"operation" text NOT NULL,
	"status" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"external_id" text,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"sync_config_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_config" ADD CONSTRAINT "sync_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_mapping" ADD CONSTRAINT "sync_mapping_sync_config_id_sync_config_id_fk" FOREIGN KEY ("sync_config_id") REFERENCES "public"."sync_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_operation" ADD CONSTRAINT "sync_operation_sync_config_id_sync_config_id_fk" FOREIGN KEY ("sync_config_id") REFERENCES "public"."sync_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscription" ADD CONSTRAINT "webhook_subscription_sync_config_id_sync_config_id_fk" FOREIGN KEY ("sync_config_id") REFERENCES "public"."sync_config"("id") ON DELETE cascade ON UPDATE no action;