import { z } from 'zod/mini';
import { query } from '$app/server';
import { campaign } from '$lib/server/db/schema';
import type { Campaign } from '../list.remote';
import { getQuery } from '$lib/server/db/query-helpers';

/**
 * Query: Get a single campaign by ID
 */
export const readCampaign = query(z.string(), async (campaignId: string): Promise<Campaign | null> => {
	const result = await getQuery({
		table: campaign,
		featureName: 'campaigns',
		id: campaignId,
		transform: (row) => ({
			id: row.id,
			userId: row.userId,
			name: row.name,
			content: row.content as Record<string, any>,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		}),
	});
/* 
	updateCampaign.fields.id.set(result?.id || '');
	updateCampaign.fields.name.set(result?.name || '');
	updateCampaign.fields.content.set(result ? JSON.stringify(result.content, null, 2) : '');
 */
	return result;
});
