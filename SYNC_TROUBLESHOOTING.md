# Synchronization Troubleshooting Guide

## Common Issue: "No refresh token is set"

### Why This Happens

Google OAuth access tokens expire after 1 hour. To continue accessing the Google Calendar API after the token expires, a **refresh token** is required. The refresh token allows the application to automatically get a new access token without user intervention.

The refresh token is only provided when:
1. The OAuth request includes `access_type=offline`
2. The OAuth request includes `prompt=consent` (or the user hasn't previously authorized the app)
3. The user grants the requested scopes (calendar access)

### The Fix Applied

**Updated Better Auth Configuration** (`src/lib/auth.ts`):
```typescript
google: { 
    clientId: env.GOOGLE_CLIENT_ID || "",
    clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar"  // Calendar access
    ],
    accessType: "offline",  // Request refresh token
    prompt: "consent"       // Force consent screen to get refresh token
}
```

**Enhanced Error Handling** in Google Calendar Provider:
- Clear error message when refresh token is missing
- Automatic token refresh when access token expires
- Better logging for debugging OAuth issues

### For Existing Users

If you created a synchronization **before** this fix was applied, you need to:

1. **Delete** the existing synchronization configuration
2. **Sign out** from the application
3. **Sign back in** with Google
4. When creating a new synchronization:
   - You'll see a new OAuth consent screen
   - Make sure to **grant calendar access** when prompted
   - The system will now store the refresh token

### For New Users

New users will automatically get the refresh token when they:
1. Sign in with Google for the first time
2. Grant calendar access permissions
3. Create a synchronization configuration

### Verification

After signing in, check the terminal logs when creating a sync:
```
[GoogleCalendarProvider] Credentials status: {
  hasAccessToken: true,
  hasRefreshToken: true,  // This should be true!
  expiresAt: '2025-11-12T...',
  isExpired: false
}
```

### Additional Notes

- The `prompt: "consent"` parameter forces Google to show the consent screen every time, which ensures a refresh token is always provided
- If you want to be less aggressive, you can remove `prompt: "consent"` after all existing users have re-authenticated
- Microsoft OAuth already has `offline_access` scope which provides refresh tokens automatically
