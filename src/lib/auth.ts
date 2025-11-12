import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    baseURL: env.BETTER_AUTH_URL || "http://localhost:5173",
    basePath: "/api/auth",
    trustHost: true,
    user: {
        additionalFields: {
            roles: {
                type: "string",
                required: false,
            },
            claims: {
                type: "string",
                required: false,
            },
        },
    },
    socialProviders: { 
        google: { 
            clientId: env.GOOGLE_CLIENT_ID || "",
            clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            scope: [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/calendar"
            ],
            accessType: "offline",
            prompt: "consent"
        },
        microsoft: {
            clientId: env.MICROSOFT_CLIENT_ID || "",
            clientSecret: env.MICROSOFT_CLIENT_SECRET || "",
            scope: ["Calendars.ReadWrite", "offline_access"],
        }
    },
    plugins: [sveltekitCookies(getRequestEvent)],
});