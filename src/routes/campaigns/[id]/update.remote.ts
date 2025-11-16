import { form } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Campaign } from '../list.remote';
import { getCampaign } from './view.remote';
import { listCampaigns } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { updateCampaignSchema } from '$lib/validations/campaign';

export const updateCampaign = form(updateCampaignSchema, async (data) => {
	try {
		const user = getAuthenticatedUser();
		ensureAccess(user, 'campaigns');
		
		// Get current campaign
		const current = await getCampaign(data.id);
		if (!current) {
			return { success: false, error: 'Campaign not found' };
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
			return { success: false, error: 'Failed to update campaign' };
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
		
		return { updatedCampaign, campaign: updatedCampaign, success: true };
	} catch (error: any) {
		return { 
			success: false, 
			error: error?.message || 'An unexpected error occurred' 
		};
	}
});
