import { query } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthenticatedUser, ensureCampaignsAccess } from './auth';

export interface Campaign {
	id: string;
	userId: string;
	name: string;
	content: Record<string, any>;
	createdAt: string;
	updatedAt: string;
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
