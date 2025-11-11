import { getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';

/**
 * Get the authenticated user from the request
 */
export async function getAuthenticatedUser() {
	const event = getRequestEvent();
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}
	return session.user;
}

/**
 * Ensure the user has access to the Campaigns feature.
 * Checks `user.roles` array includes "admin" or `user.claims` contains campaigns:true.
 */
export function ensureCampaignsAccess(user: any) {
	// Check if user has admin role
	if (user?.roles) {
		try {
			const roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
			if (Array.isArray(roles) && roles.includes('admin')) {
				return;
			}
		} catch (e) {
			// Invalid JSON in roles, continue
		}
	}
	
	// Parse claims if present
	if (user?.claims) {
		try {
			const claims = typeof user.claims === 'string' ? JSON.parse(user.claims) : user.claims;
			if (claims?.campaigns === true) {
				return;
			}
		} catch (e) {
			// Invalid JSON in claims, continue to unauthorized
		}
	}
	
	throw new Error('Unauthorized');
}
