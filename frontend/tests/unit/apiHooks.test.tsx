import { describe, it, expect } from 'vitest';

// apiHooks test adapted: alertSlice has been removed during refactoring.
// Alert state is now managed via RTK Query (alertsApi).

describe('alertsApi hooks (migrated from alertSlice)', () => {
  it('should verify alertsApi exports exist', async () => {
    const { alertsApi } = await import('../../src/store/api/alertsApi');
    expect(alertsApi).toBeDefined();
    expect(alertsApi.endpoints).toBeDefined();
  });

  it('should export alert query hooks', async () => {
    const mod = await import('../../src/store/api/alertsApi');
    expect(mod.useGetAlertsQuery).toBeDefined();
  });

  it('should export alert mutation hooks', async () => {
    const mod = await import('../../src/store/api/alertsApi');
    // Verify at least one mutation hook exists
    const keys = Object.keys(mod);
    const mutationHooks = keys.filter(k => k.startsWith('use') && k.includes('Mutation'));
    expect(mutationHooks.length).toBeGreaterThan(0);
  });
});

describe('streamsApi hooks (corrected hook names)', () => {
  it('should verify correct hook names', async () => {
    const mod = await import('../../src/store/api/streamsApi');
    // The old test used useStreamsQuery (wrong), actual hook is useGetStreamsQuery
    expect(mod.useGetStreamsQuery).toBeDefined();
    expect(mod.useGetStreamByIdQuery).toBeDefined();
    expect(mod.useCreateStreamMutation).toBeDefined();
    expect(mod.useUpdateStreamMutation).toBeDefined();
    expect(mod.useDeleteStreamMutation).toBeDefined();
    // Old hooks should NOT exist
    expect('useStreamsQuery' in mod).toBe(false);
  });
});
