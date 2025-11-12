import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncService } from '$lib/server/sync/service';

/**
 * API endpoint to renew expiring webhooks
 * This should be called periodically (e.g., via a cron job)
 * 
 * To set up a cron job:
 * - Use a service like cron-job.org, EasyCron, or GitHub Actions
 * - Schedule to run daily: curl -X POST https://your-domain.com/api/sync/renew-webhooks
 * - Or use Vercel Cron: https://vercel.com/docs/cron-jobs
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Optional: Add authentication to prevent unauthorized access
		const authHeader = request.headers.get('authorization');
		const expectedToken = process.env.CRON_SECRET;

		if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[RenewWebhooks] Starting webhook renewal process...');
		await syncService.renewWebhooks();
		console.log('[RenewWebhooks] Webhook renewal completed successfully');

		return json({ success: true, message: 'Webhooks renewed successfully' });
	} catch (error: any) {
		console.error('[RenewWebhooks] Error renewing webhooks:', error);
		return json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
};
