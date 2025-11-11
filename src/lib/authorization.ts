export type Feature = 'calendarSyncs' | 'events' | 'campaigns';

export function parseRoles(user: any): string[] {
  const raw = user?.roles;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseClaims<T extends Record<string, unknown> = Record<string, unknown>>(user: any): T | null {
  const raw = user?.claims;
  if (!raw) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function hasAccess(user: any, feature: Feature): boolean {
  const roles = parseRoles(user);
  if (roles.includes('admin')) return true;
  const claims = parseClaims<Record<string, boolean>>(user);
  return !!claims?.[feature];
}

export function ensureAccess(user: any, feature: Feature) {
  if (hasAccess(user, feature)) return;
  throw new Error('Unauthorized');
}
