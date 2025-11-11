import type { RequestHandler } from '@sveltejs/kit';
import {
	_listCampaigns,
	_createCampaign,
	_updateCampaign,
	_deleteCampaigns
} from './+page.server';

export const POST: RequestHandler = async (event) => {
	const { action, ...params } = await event.request.json();

	try {
		let result;

		switch (action) {
			case 'listCampaigns':
				result = await _listCampaigns(event);
				break;
			case 'createCampaign':
				result = await _createCampaign(event, params.data);
				break;
			case 'updateCampaign':
				result = await _updateCampaign(event, params.campaignId, params.data);
				break;
			case 'deleteCampaigns':
				result = await _deleteCampaigns(event, params.campaignIds);
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
