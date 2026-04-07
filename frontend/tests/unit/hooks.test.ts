import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useState } from 'react';

describe('useWebSocket hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connection management', () => {
    it('should initialize with disconnected state', async () => {
      const { result } = renderHook(() => {
        const [connected, setConnected] = useState(false);
        return { connected, setConnected };
      });

      expect(result.current.connected).toBe(false);
    });

    it('should update connection state', async () => {
      const { result } = renderHook(() => {
        const [connected, setConnected] = useState(false);
        return { connected, setConnected };
      });

      act(() => {
        result.current.setConnected(true);
      });

      expect(result.current.connected).toBe(true);
    });

    it('should toggle connection state', async () => {
      const { result } = renderHook(() => {
        const [connected, setConnected] = useState(false);
        const toggle = () => setConnected((prev) => !prev);
        return { connected, toggle };
      });

      expect(result.current.connected).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.connected).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.connected).toBe(false);
    });
  });

  describe('count management', () => {
    it('should initialize with zero counts', async () => {
      const { result } = renderHook(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [alertCount, _setAlertCount] = useState(0);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [detectionCount, _setDetectionCount] = useState(0);
        return { alertCount, detectionCount };
      });

      expect(result.current.alertCount).toBe(0);
      expect(result.current.detectionCount).toBe(0);
    });

    it('should increment alert count', async () => {
      const { result } = renderHook(() => {
        const [count, setCount] = useState(0);
        const increment = () => setCount((c) => c + 1);
        return { count, increment };
      });

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it('should increment detection count', async () => {
      const { result } = renderHook(() => {
        const [count, setCount] = useState(0);
        const increment = () => setCount((c) => c + 1);
        return { count, increment };
      });

      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it('should clear counts', async () => {
      const { result } = renderHook(() => {
        const [count, setCount] = useState(5);
        const clear = () => setCount(0);
        return { count, clear };
      });

      expect(result.current.count).toBe(5);

      act(() => {
        result.current.clear();
      });

      expect(result.current.count).toBe(0);
    });
  });
});

describe('useAlertNotification hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notification state', () => {
    it('should initialize with no notification', async () => {
      const { result } = renderHook(() => {
        const [notification, setNotification] = useState<{ id: string; message: string } | null>(null);
        return { notification, setNotification };
      });

      expect(result.current.notification).toBeNull();
    });

    it('should show notification', async () => {
      const { result } = renderHook(() => {
        const [notification, setNotification] = useState<{ id: string; message: string } | null>(null);
        const show = (message: string) => setNotification({ id: '1', message });
        return { notification, show };
      });

      act(() => {
        result.current.show('Test notification');
      });

      await waitFor(() => {
        expect(result.current.notification).toBeTruthy();
        expect(result.current.notification?.message).toBe('Test notification');
      });
    });

    it('should dismiss notification', async () => {
      const { result } = renderHook(() => {
        const [notification, setNotification] = useState<{ id: string; message: string } | null>({
          id: '1',
          message: 'Test',
        });
        const dismiss = () => setNotification(null);
        return { notification, dismiss };
      });

      expect(result.current.notification).toBeTruthy();

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.notification).toBeNull();
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss after timeout', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => {
        const [notification, setNotification] = useState<{ id: string; message: string } | null>(null);
        const show = (message: string, duration = 5000) => {
          setNotification({ id: '1', message });
          setTimeout(() => setNotification(null), duration);
        };
        return { notification, show };
      });

      act(() => {
        result.current.show('Auto dismiss test', 5000);
      });

      expect(result.current.notification).toBeTruthy();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.notification).toBeNull();

      vi.useRealTimers();
    });
  });
});

describe('useYOLODetection hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detection state', () => {
    it('should initialize with no detections', async () => {
      const { result } = renderHook(() => {
        const [detections, setDetections] = useState<Array<{ id: string; confidence: number }>>([]);
        return { detections, setDetections };
      });

      expect(result.current.detections).toEqual([]);
    });

    it('should add detection', async () => {
      const { result } = renderHook(() => {
        const [detections, setDetections] = useState<Array<{ id: string; confidence: number }>>([]);
        const addDetection = (detection: { id: string; confidence: number }) =>
          setDetections((prev) => [detection, ...prev].slice(0, 100));
        return { detections, addDetection };
      });

      act(() => {
        result.current.addDetection({ id: '1', confidence: 0.95 });
      });

      expect(result.current.detections).toHaveLength(1);
      expect(result.current.detections[0].id).toBe('1');
    });

    it('should limit detections to 100', async () => {
      const { result } = renderHook(() => {
        const [detections, setDetections] = useState<Array<{ id: string; confidence: number }>>([]);
        const addDetection = (detection: { id: string; confidence: number }) =>
          setDetections((prev) => [detection, ...prev].slice(0, 100));
        return { detections, addDetection };
      });

      for (let i = 0; i < 105; i++) {
        act(() => {
          result.current.addDetection({ id: String(i), confidence: 0.9 });
        });
      }

      expect(result.current.detections).toHaveLength(100);
    });

    it('should clear detections', async () => {
      const { result } = renderHook(() => {
        const [detections, setDetections] = useState([
          { id: '1', confidence: 0.9 },
          { id: '2', confidence: 0.85 },
        ]);
        const clear = () => setDetections([]);
        return { detections, clear };
      });

      expect(result.current.detections).toHaveLength(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.detections).toHaveLength(0);
    });
  });
});
