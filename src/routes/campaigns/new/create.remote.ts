import { z } from 'zod/mini';
import { form } from '$app/server';
import { db } from '$lib/server/db';
import { campaign } from '$lib/server/db/schema';
import type { Campaign } from '../list.remote';
import { listCampaigns } from '../list.remote';
import { getAuthenticatedUser, ensureAccess } from '$lib/authorization';

/**
 * Form: Create a new campaign
 */
const createCampaignSchema = z.object({
	name: z.string().check(z.minLength(1, 'Campaign name is required')),
	content: z.any(), // Will be validated as JSON object
});

export const createCampaign = form(createCampaignSchema, async (data) => {
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
