import { describe, it, expect } from 'vitest';
import { roleHasPermission, roleHasAnyPermission, ROLE_PERMISSIONS } from '@/types/rbac';

// Unit tests for the permission utility functions used by usePermission hook.
// The hook itself wraps these with Redux selector + useMemo; we test the logic directly.

describe('roleHasPermission', () => {
  it('admin has alert:read', () => {
    expect(roleHasPermission('admin', 'alert:read')).toBe(true);
  });

  it('admin has role:delete', () => {
    expect(roleHasPermission('admin', 'role:delete')).toBe(true);
  });

  it('viewer does NOT have alert:delete', () => {
    expect(roleHasPermission('viewer', 'alert:delete')).toBe(false);
  });

  it('viewer does NOT have role:delete', () => {
    expect(roleHasPermission('viewer', 'role:delete')).toBe(false);
  });

  it('super_admin has all permissions', () => {
    const allCodes = ROLE_PERMISSIONS['super_admin'];
    for (const code of allCodes) {
      expect(roleHasPermission('super_admin', code)).toBe(true);
    }
  });

  it('unknown role has no permissions', () => {
    expect(roleHasPermission('nonexistent', 'alert:read')).toBe(false);
  });

  it('empty role returns false', () => {
    expect(roleHasPermission('', 'alert:read')).toBe(false);
  });
});

describe('roleHasAnyPermission (useHasAnyPermission logic)', () => {
  it('viewer has at least one of [alert:delete, alert:read]', () => {
    expect(roleHasAnyPermission('viewer', ['alert:delete', 'alert:read'])).toBe(true);
  });

  it('viewer does NOT have any of [alert:delete, role:delete]', () => {
    expect(roleHasAnyPermission('viewer', ['alert:delete', 'role:delete'])).toBe(false);
  });

  it('operator has at least one of [media:upload, system:update]', () => {
    expect(roleHasAnyPermission('operator', ['media:upload', 'system:update'])).toBe(true);
  });

  it('returns false for empty permissions array', () => {
    expect(roleHasAnyPermission('admin', [])).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(roleHasAnyPermission('ghost', ['alert:read'])).toBe(false);
  });
});
