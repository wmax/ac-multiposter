import { auth } from '$lib/auth';
import type { RequestEvent } from '@sveltejs/kit';
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
async function getAuthenticatedUser(event: RequestEvent) {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return session.user;
}

/**
 * Ensure the user has access to the Campaigns feature.
 * Checks `user.claims` JSON string for campaigns:true or `user.roles` array includes "admin".
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

export async function _listCampaigns(event: RequestEvent): Promise<Campaign[]> {
	const user = await getAuthenticatedUser(event);
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
}

/**
 * Create a new campaign
 */
export async function _createCampaign(
	event: RequestEvent,
	data: { name: string; content: Record<string, any> }
): Promise<Campaign> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);
	
	if (!data.name || typeof data.name !== 'string') {
		throw new Error('Campaign name is required');
	}
	
	const result = await db
		.insert(campaign)
		.values({
			id: crypto.randomUUID(),
			userId: user.id,
			name: data.name,
			content: data.content,
		})
		.returning();
	
	const row = result[0];
	return {
		id: row.id,
		userId: row.userId,
		name: row.name,
		content: row.content as Record<string, any>,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

/**
 * Get a single campaign by ID
 */
export async function _getCampaign(
	event: RequestEvent,
	campaignId: string
): Promise<Campaign | null> {
	const user = await getAuthenticatedUser(event);
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
}

/**
 * Update an existing campaign
 */
export async function _updateCampaign(
	event: RequestEvent,
	campaignId: string,
	data: { name?: string; content?: Record<string, any> }
): Promise<Campaign> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);
	
	// Get current campaign
	const current = await _getCampaign(event, campaignId);
	if (!current) {
		throw new Error('Campaign not found');
	}
	
	const name = data.name ?? current.name;
	const content = data.content ?? current.content;
	
	const result = await db
		.update(campaign)
		.set({
			name,
			content,
			updatedAt: new Date(),
		})
		.where(and(eq(campaign.id, campaignId), eq(campaign.userId, user.id)))
		.returning();
	
	const updated = result[0];
	if (!updated) {
		throw new Error('Failed to update campaign');
	}
	
	return {
		id: updated.id,
		userId: updated.userId,
		name: updated.name,
		content: updated.content as Record<string, any>,
		createdAt: updated.createdAt.toISOString(),
		updatedAt: updated.updatedAt.toISOString(),
	};
}

/**
 * Delete one or more campaigns
 */
export async function _deleteCampaigns(
	event: RequestEvent,
	campaignIds: string[]
): Promise<void> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);
	
	if (campaignIds.length === 0) {
		throw new Error('No campaigns to delete');
	}
	
	await db
		.delete(campaign)
		.where(and(eq(campaign.userId, user.id), inArray(campaign.id, campaignIds)));
}
