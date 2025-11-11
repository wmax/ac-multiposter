import { z } from 'zod/mini';
import { query } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Campaign } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';

/**
 * Query: Get a single campaign by ID
 */
export const getCampaign = query(z.string(), async (campaignId: string): Promise<Campaign | null> => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'campaigns');
	
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
