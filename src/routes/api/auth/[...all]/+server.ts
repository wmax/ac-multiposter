import { auth } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

// Catch-all auth endpoint to support Better Auth routes like:
// /api/auth/get-session, /api/auth/sign-in, /api/auth/callback/google, etc.
// SvelteKit v2 requires +server.ts naming; placing this inside a
// `[...all]` directory makes it a wildcard for all subpaths.
export const GET: RequestHandler = ({ request }) => auth.handler(request);
export const POST: RequestHandler = ({ request }) => auth.handler(request);
