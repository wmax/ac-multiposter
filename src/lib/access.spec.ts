import { describe, it, expect } from 'vitest';
import { hasAccess, parseClaims, parseRoles } from './authorization';

const user = (roles: any, claims: any) => ({ roles, claims });

describe('access utils', () => {
  describe('parseRoles', () => {
    it('returns array when roles is array', () => {
      expect(parseRoles(user(['admin', 'user'], null))).toEqual(['admin', 'user']);
    });
    it('parses JSON string roles', () => {
      expect(parseRoles(user('["admin","user"]', null))).toEqual(['admin', 'user']);
    });
    it('returns [] for invalid JSON', () => {
      expect(parseRoles(user('[invalid', null))).toEqual([]);
    });
    it('returns [] for missing roles', () => {
      expect(parseRoles(user(undefined, null))).toEqual([]);
    });
  });

  describe('parseClaims', () => {
    it('returns object when claims is object', () => {
      const c = { events: true };
      expect(parseClaims(user(null, c))).toEqual(c);
    });
    it('parses JSON string claims', () => {
      const str = '{"events":true,"campaigns":false}';
      expect(parseClaims(user(null, str))).toEqual({ events: true, campaigns: false });
    });
    it('returns null for invalid JSON', () => {
      expect(parseClaims(user(null, '{invalid'))).toBeNull();
    });
    it('returns null for missing claims', () => {
      expect(parseClaims(user(null, undefined))).toBeNull();
    });
  });

  describe('hasAccess', () => {
    it('grants access to admin regardless of claims', () => {
      expect(hasAccess(user(['admin'], { events: false }), 'events')).toBe(true);
      expect(hasAccess(user('["admin"]', '{"events":false}'), 'events')).toBe(true);
    });
    it('grants access when specific claim true', () => {
      expect(hasAccess(user([], { events: true }), 'events')).toBe(true);
      expect(hasAccess(user('[]', '{"events":true}'), 'events')).toBe(true);
    });
    it('denies access when no admin and claim false/missing', () => {
      expect(hasAccess(user([], { events: false }), 'events')).toBe(false);
      expect(hasAccess(user([], { campaigns: true }), 'events')).toBe(false);
      expect(hasAccess(user('[]', '{}'), 'events')).toBe(false);
    });
  });
});
