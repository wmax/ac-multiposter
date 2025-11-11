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
 * Ensure the user has access to the Events feature.
 * Checks `user.roles` array includes "admin" or `user.claims` contains events:true.
 */
// ensureAccess(user, 'events') should be used directly in remotes for feature gating.
