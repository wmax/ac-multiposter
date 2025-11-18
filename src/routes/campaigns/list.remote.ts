import { query } from '$app/server';
import { campaign } from '$lib/server/db/schema';
import { listQuery } from '$lib/server/db/query-helpers';

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
	const results = await listQuery({
		table: campaign,
		featureName: 'campaigns',
		transform: (row) => ({
			id: row.id,
			userId: row.userId,
			name: row.name,
			content: row.content as Record<string, any>,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		}),
	});
	return results;
});
