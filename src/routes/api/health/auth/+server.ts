import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  const results: Record<string, unknown> = {};

  results.betterAuthUrlPresent = Boolean(env.BETTER_AUTH_URL);
  results.betterAuthSecretPresent = Boolean(env.BETTER_AUTH_SECRET);
  results.googleClientIdPresent = Boolean(env.GOOGLE_CLIENT_ID);
  results.googleClientSecretPresent = Boolean(env.GOOGLE_CLIENT_SECRET);
  results.databaseUrlPresent = Boolean(env.DATABASE_URL);

  try {
    if (env.BETTER_AUTH_URL) {
      const reqHost = new URL(request.url).host;
      const authHost = new URL(env.BETTER_AUTH_URL).host;
      results.hostMatchesBetterAuthUrl = reqHost === authHost;
      results.requestHost = reqHost;
      results.configuredAuthHost = authHost;
    }
  } catch {
    results.hostMatchesBetterAuthUrl = false;
  }

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

  const ok = Boolean(
    results.betterAuthUrlPresent &&
      results.betterAuthSecretPresent &&
      results.googleClientIdPresent &&
      results.googleClientSecretPresent &&
      results.databaseUrlPresent &&
      results.databaseOk !== false &&
      (results.hostMatchesBetterAuthUrl !== false)
  );

  return new Response(JSON.stringify({ ok, checks: results }, null, 2), {
    status: ok ? 200 : 500,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
};
