import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { alertRuleAPI } from '@/api/v1/alertRules';

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  // Mock localStorage for token
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'test-token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockJsonResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe('alertRuleAPI', () => {
  describe('list', () => {
    it('sends GET request to /alert-rules', async () => {
      const responseData = {
        code: 200,
        message: 'success',
        data: { items: [], total: 0, page: 1, page_size: 20 },
      };
      mockJsonResponse(responseData);

      const result = await alertRuleAPI.list({ page: 1, page_size: 20 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/alert-rules');
      expect(url).toContain('page=1');
      expect(url).toContain('page_size=20');
      expect(options.method).toBe('GET');
      expect(result.data.items).toEqual([]);
    });

    it('sends filter parameters', async () => {
      mockJsonResponse({ code: 200, data: { items: [], total: 0 } });

      await alertRuleAPI.list({ page: 1, enabled: true, type: 'sensor_threshold' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('enabled=true');
      expect(url).toContain('type=sensor_threshold');
    });
  });

  describe('create', () => {
    it('sends POST request to /alert-rules with body', async () => {
      const newRule = {
        name: 'Test Rule',
        type: 'sensor_threshold',
        conditions: '{"metric":"temperature","operator":"gt","threshold":80}',
        actions: '[{"type":"webhook","target":"https://hook.example.com"}]',
        severity: 'warning' as const,
      };
      const responseData = { code: 201, message: 'created', data: { id: 1, ...newRule } };
      mockJsonResponse(responseData, 201);

      // apiClient.post sends 201, but fetch response.ok is true for 201
      // The mock returns the data directly
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(responseData),
      });

      const result = await alertRuleAPI.create(newRule);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/alert-rules');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.name).toBe('Test Rule');
      expect(body.type).toBe('sensor_threshold');
      expect(result.code).toBe(201);
    });
  });

  describe('toggle', () => {
    it('sends PUT request to /alert-rules/:id/toggle', async () => {
      mockJsonResponse({ code: 200, data: { message: 'toggled', enabled: false } });

      await alertRuleAPI.toggle(5, false);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/alert-rules/5/toggle');
      expect(options.method).toBe('PUT');
      const body = JSON.parse(options.body);
      expect(body.enabled).toBe(false);
    });
  });

  describe('delete', () => {
    it('sends DELETE request to /alert-rules/:id', async () => {
      mockJsonResponse({ code: 200, message: 'success' });

      await alertRuleAPI.delete(3);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/alert-rules/3');
      expect(options.method).toBe('DELETE');
    });
  });
});
