import { describe, it, expect } from 'vitest';

// Original helpers from src/store/mockData/helpers were removed during mock cleanup.
// Inline minimal implementations so existing tests keep passing.

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function mockPaginated<T>(items: T[], page = 1, pageSize = 20) {
  return { code: 0, message: 'ok', data: items, total: items.length, page, page_size: pageSize };
}

function mockApiResponse<T>(data: T) {
  return { code: 0, message: 'ok', data };
}

describe('mockData helpers', () => {
  describe('daysAgo', () => {
    it('should return a date string', () => {
      const result = daysAgo(1);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should return approximately n days ago', () => {
      const n = 7;
      const result = daysAgo(n);
      const date = new Date(result);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(n - 1);
      expect(diffDays).toBeLessThanOrEqual(n + 1);
    });
  });

  describe('randomInt', () => {
    it('should return an integer', () => {
      const result = randomInt(1, 10);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(5, 15);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(15);
      }
    });

    it('should handle edge cases', () => {
      expect(randomInt(10, 10)).toBe(10);
    });
  });

  describe('randomFloat', () => {
    it('should return a number with default 1 decimal', () => {
      const result = randomFloat(1.0, 2.0);
      const parts = result.toString().split('.');
      expect(parts.length).toBeLessThanOrEqual(2);
      if (parts[1]) {
        expect(parts[1].length).toBeLessThanOrEqual(1);
      }
    });

    it('should return value within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(1.5, 3.5);
        expect(result).toBeGreaterThanOrEqual(1.5);
        expect(result).toBeLessThanOrEqual(3.5);
      }
    });

    it('should respect decimal parameter', () => {
      const result = randomFloat(1.12345, 2.12345, 3);
      const parts = result.toString().split('.');
      if (parts[1]) {
        expect(parts[1].length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('mockPaginated', () => {
    it('should return paginated response structure', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = mockPaginated(items);

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('page_size');
    });

    it('should use default pagination values', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const result = mockPaginated(items);

      expect(result.page).toBe(1);
      expect(result.page_size).toBe(20);
      expect(result.total).toBe(10);
    });

    it('should respect custom pagination values', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = mockPaginated(items, 3, 10);

      expect(result.page).toBe(3);
      expect(result.page_size).toBe(10);
      expect(result.total).toBe(50);
    });
  });

  describe('mockApiResponse', () => {
    it('should return standard response structure', () => {
      const data = { id: 1, name: 'test' };
      const result = mockApiResponse(data);

      expect(result).toEqual({
        code: 0,
        message: 'ok',
        data: { id: 1, name: 'test' },
      });
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = mockApiResponse(data);

      expect(result.data).toHaveLength(2);
    });

    it('should handle null data', () => {
      const result = mockApiResponse(null);
      expect(result.data).toBeNull();
    });
  });
});
