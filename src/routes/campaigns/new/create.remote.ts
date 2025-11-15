import { form } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import type { Campaign } from '../list.remote';
import { listCampaigns } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { createCampaignSchema } from '$lib/validations/campaign';

export const createCampaign = form(createCampaignSchema, async (data) => {
	try {
		const user = getAuthenticatedUser();
		ensureAccess(user, 'campaigns');
		
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
		if (!row) {
			return { success: false, error: 'Failed to create campaign' };
		}
		
		const newCampaign: Campaign = {
			id: row.id,
			userId: row.userId,
			name: row.name,
			content: row.content as Record<string, any>,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		};
		
		return { success: true, campaign: newCampaign };
	} catch (error: any) {
		return { 
			success: false, 
			error: error?.message || 'An unexpected error occurred' 
		};
	}
});
