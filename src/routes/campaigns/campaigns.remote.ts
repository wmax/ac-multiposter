import { z } from 'zod/mini';
import { query, form, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

export interface Campaign {
	id: string;
	userId: string;
	name: string;
	content: Record<string, any>;
	createdAt: string;
	updatedAt: string;
}

/**
 * Get the authenticated user from the request
 */
async function getAuthenticatedUser() {
	const event = getRequestEvent();
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return session.user;
}

/**
 * Ensure the user has access to the Campaigns feature.
 * Checks `user.roles` array includes "admin" or `user.claims` contains campaigns:true.
 */
function ensureCampaignsAccess(user: any) {
	// Check if user has admin role
	if (user?.roles) {
		try {
			const roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
			if (Array.isArray(roles) && roles.includes('admin')) {
				return;
			}
		} catch (e) {
			// Invalid JSON in roles, continue
		}
	}
	
	// Parse claims if present
	if (user?.claims) {
		try {
			const claims = typeof user.claims === 'string' ? JSON.parse(user.claims) : user.claims;
			if (claims?.campaigns === true) {
				return;
			}
		} catch (e) {
			// Invalid JSON in claims, continue to unauthorized
		}
	}
	
	throw new Error('Unauthorized');
}

/**
 * Query: List all campaigns for the current user
 */
export const listCampaigns = query(async (): Promise<Campaign[]> => {
	const user = await getAuthenticatedUser();
	ensureCampaignsAccess(user);
	
	const results = await db
		.select()
		.from(campaign)
		.where(eq(campaign.userId, user.id))
		.orderBy(desc(campaign.createdAt));
	
	return results.map(row => ({
		id: row.id,
		userId: row.userId,
		name: row.name,
		content: row.content as Record<string, any>,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	}));
});

/**
 * Query: Get a single campaign by ID
 */
export const getCampaign = query(z.string(), async (campaignId: string): Promise<Campaign | null> => {
	const user = await getAuthenticatedUser();
	ensureCampaignsAccess(user);
	
	const result = await db
		.select()
		.from(campaign)
		.where(and(eq(campaign.id, campaignId), eq(campaign.userId, user.id)))
		.limit(1);
	
	if (!result.length) return null;
	
	const row = result[0];
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		content: row.content as Record<string, any>,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
});

/**
 * Form: Create a new campaign
 */
const createCampaignSchema = z.object({
	name: z.string().check(z.minLength(1, 'Campaign name is required')),
	content: z.any(), // Will be validated as JSON object
});

export const createCampaign = form(createCampaignSchema, async (data) => {
	const user = await getAuthenticatedUser();
	ensureCampaignsAccess(user);
	
	const result = await db
		.insert(campaign)
		.values({
			id: crypto.randomUUID(),
			userId: user.id,
			name: data.name,
			content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
		})
		.returning();
	
	const row = result[0];
	const newCampaign: Campaign = {
		id: row.id,
		userId: row.userId,
		name: row.name,
		content: row.content as Record<string, any>,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
	
	// Refresh the list query
	await listCampaigns().refresh();
	
	return { success: true, campaign: newCampaign };
});

/**
 * Command: Update an existing campaign
 */
const updateCampaignSchema = z.object({
	id: z.string(),
	name: z.optional(z.string()),
	content: z.optional(z.any()),
});

export const updateCampaign = command(updateCampaignSchema, async (data) => {
	const user = await getAuthenticatedUser();
	ensureCampaignsAccess(user);
	
	// Get current campaign
	const current = await getCampaign(data.id);
	if (!current) {
		throw new Error('Campaign not found');
	}
	
	const name = data.name ?? current.name;
	const content = data.content ? 
		(typeof data.content === 'string' ? JSON.parse(data.content) : data.content) : 
		current.content;
	
	const result = await db
		.update(campaign)
		.set({
			name,
			content,
			updatedAt: new Date(),
		})
		.where(and(eq(campaign.id, data.id), eq(campaign.userId, user.id)))
		.returning();
	
	const updated = result[0];
	if (!updated) {
		throw new Error('Failed to update campaign');
	}
	
	const updatedCampaign: Campaign = {
		id: updated.id,
		userId: updated.userId,
		name: updated.name,
		content: updated.content as Record<string, any>,
		createdAt: updated.createdAt.toISOString(),
		updatedAt: updated.updatedAt.toISOString(),
	};
	
	// Update both queries
	await getCampaign(data.id).set(updatedCampaign);
	await listCampaigns().refresh();
	
	return updatedCampaign;
});

/**
 * Command: Delete one or more campaigns
 */
const deleteCampaignsSchema = z.array(z.string()).check(z.minLength(1, 'Must provide at least one campaign ID'));

export const deleteCampaigns = command(deleteCampaignsSchema, async (campaignIds: string[]) => {
	const user = await getAuthenticatedUser();
	ensureCampaignsAccess(user);
	
	if (campaignIds.length === 0) {
		throw new Error('No campaigns to delete');
	}
	
	await db
		.delete(campaign)
		.where(and(eq(campaign.userId, user.id), inArray(campaign.id, campaignIds)));
	
	// Refresh the list
	await listCampaigns().refresh();
});
