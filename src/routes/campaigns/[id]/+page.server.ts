import { redirect, error } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

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

/**
 * Get a single campaign by ID for viewing/editing
 */
export async function _getCampaignDetail(event: RequestEvent, campaignId: string): Promise<Campaign> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);

	const result = await db
		.select()
		.from(campaign)
		.where(and(eq(campaign.id, campaignId), eq(campaign.userId, user.id)))
		.limit(1);

	if (!result.length) {
		throw new Error('Campaign not found');
	}

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
export async function _updateCampaignDetail(
	event: RequestEvent,
	campaignId: string,
	data: { name?: string; content?: Record<string, any> }
): Promise<Campaign> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);

	// Get current campaign to merge updates
	const currentResult = await db
		.select()
		.from(campaign)
		.where(and(eq(campaign.id, campaignId), eq(campaign.userId, user.id)))
		.limit(1);

	if (!currentResult.length) {
		throw new Error('Campaign not found');
	}

	const current = currentResult[0];
	const name = data.name ?? current.name;
	const content = data.content ?? (current.content as Record<string, any>);

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
 * Delete a campaign
 */
export async function _deleteCampaignDetail(event: RequestEvent, campaignId: string): Promise<void> {
	const user = await getAuthenticatedUser(event);
	ensureCampaignsAccess(user);

	const result = await db
		.delete(campaign)
		.where(and(eq(campaign.id, campaignId), eq(campaign.userId, user.id)))
		.returning({ id: campaign.id });

	if (result.length === 0) {
		throw new Error('Campaign not found or unauthorized');
	}
}
