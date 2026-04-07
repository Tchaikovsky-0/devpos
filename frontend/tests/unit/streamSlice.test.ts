import { describe, it, expect } from 'vitest';

// streamSlice has been removed during refactoring.
// Stream state is now managed via RTK Query (streamsApi).
// This test file verifies the store structure is valid.

describe('streamSlice (migrated to RTK Query)', () => {
  it('should verify streamsApi exports exist', async () => {
    const { streamsApi } = await import('../../src/store/api/streamsApi');
    expect(streamsApi).toBeDefined();
    expect(streamsApi.endpoints).toBeDefined();
  });

  it('should export stream mutation hooks', async () => {
    const mod = await import('../../src/store/api/streamsApi');
    expect(mod.useCreateStreamMutation).toBeDefined();
    expect(mod.useUpdateStreamMutation).toBeDefined();
    expect(mod.useDeleteStreamMutation).toBeDefined();
    expect(mod.useGetStreamsQuery).toBeDefined();
  });

  it('should export getStreams endpoint', async () => {
    const { streamsApi } = await import('../../src/store/api/streamsApi');
    expect(streamsApi.endpoints.getStreams).toBeDefined();
  });
});
