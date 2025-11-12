import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  const results: Record<string, unknown> = {};

  // Environment presence checks (booleans only; never expose values)
  results.betterAuthUrlPresent = Boolean(env.BETTER_AUTH_URL);
  results.betterAuthSecretPresent = Boolean(env.BETTER_AUTH_SECRET);
  results.googleClientIdPresent = Boolean(env.GOOGLE_CLIENT_ID);
  results.googleClientSecretPresent = Boolean(env.GOOGLE_CLIENT_SECRET);
  results.databaseUrlPresent = Boolean(env.DATABASE_URL);

  // Host/domain sanity: does request host match BETTER_AUTH_URL host?
  try {
    if (env.BETTER_AUTH_URL) {
      const reqHost = new URL(request.url).host;
      const authHost = new URL(env.BETTER_AUTH_URL).host;
      results.hostMatchesBetterAuthUrl = reqHost === authHost;
      results.requestHost = reqHost; // informational, not secret
      results.configuredAuthHost = authHost; // informational, not secret
    }
  } catch {
    results.hostMatchesBetterAuthUrl = false;
  }

  // Database connectivity quick check
  try {
    if (env.DATABASE_URL) {
      await db.execute(sql`select 1`);
      results.databaseOk = true;
    } else {
      results.databaseOk = false;
    }
  } catch (e) {
    results.databaseOk = false;
    results.databaseError = 'DB check failed';
  }

  // Overall status
  const ok = Boolean(
    results.betterAuthUrlPresent &&
      results.betterAuthSecretPresent &&
      results.googleClientIdPresent &&
      results.googleClientSecretPresent &&
      results.databaseUrlPresent &&
      results.databaseOk !== false &&
      (results.hostMatchesBetterAuthUrl !== false)
  );

  const body = JSON.stringify({ ok, checks: results }, null, 2);
  return new Response(body, {
    status: ok ? 200 : 500,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
};
