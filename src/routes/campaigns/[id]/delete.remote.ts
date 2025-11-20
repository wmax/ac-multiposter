import { z } from 'zod/mini';
import { command } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { listCampaigns } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';
import { deleteCampaignIdsSchema } from '$lib/validations/campaign';

/**
 * Command: Delete one or more campaigns
 */

export const deleteCampaigns = command(deleteCampaignIdsSchema, async (campaignIds: string[]) => {
	const user = getAuthenticatedUser();
	ensureAccess(user, 'campaigns');
	
	if (campaignIds.length === 0) {
		throw new Error('No campaigns to delete');
	}
	
	await db
		.delete(campaign)
		.where(and(eq(campaign.userId, user.id), inArray(campaign.id, campaignIds)));
	
	// Refresh the list
	await listCampaigns().refresh();

	return { success: true, count: campaignIds.length };
});
