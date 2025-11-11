import { z } from 'zod/mini';
import { command } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { listCampaigns } from '../list.remote';
import { getAuthenticatedUser } from '../auth';
import { ensureAccess } from '$lib/authorization';

/**
 * Command: Delete one or more campaigns
 */
const deleteCampaignsSchema = z.array(z.string()).check(z.minLength(1, 'Must provide at least one campaign ID'));

export const deleteCampaigns = command(deleteCampaignsSchema, async (campaignIds: string[]) => {
	const user = await getAuthenticatedUser();
	ensureAccess(user, 'campaigns');
	
	if (campaignIds.length === 0) {
		throw new Error('No campaigns to delete');
	}
	
	await db
		.delete(campaign)
		.where(and(eq(campaign.userId, user.id), inArray(campaign.id, campaignIds)));
	
	// Refresh the list
	await listCampaigns().refresh();
});
