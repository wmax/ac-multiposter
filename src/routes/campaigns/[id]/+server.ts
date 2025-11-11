import type { RequestHandler } from '@sveltejs/kit';
import {
	_getCampaignDetail,
	_updateCampaignDetail,
	_deleteCampaignDetail
} from './+page.server';

export const POST: RequestHandler = async (event) => {
	const { action, ...params } = await event.request.json();

	try {
		let result;

		switch (action) {
			case 'getCampaignDetail':
				result = await _getCampaignDetail(event, params.campaignId);
				break;
			case 'updateCampaignDetail':
				result = await _updateCampaignDetail(event, params.campaignId, params.data);
				break;
			case 'deleteCampaignDetail':
				result = await _deleteCampaignDetail(event, params.campaignId);
				break;
			default:
				return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
		}

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		const status = message === 'Unauthorized' ? 401 : 400;
		return new Response(JSON.stringify({ error: message }), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
