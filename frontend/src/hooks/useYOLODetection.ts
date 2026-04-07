// =============================================================================
// useYOLODetection - YOLO 实时检测 Hook
// =============================================================================
// TODO: 待对接真实 YOLO 后端 API。当前在无 WebSocket 连接时使用 Mock 数据。
// YOLO 后端集成由另一个 agent 负责，此 hook 保持现状。
// =============================================================================
// 通过 WebSocket 接收实时 YOLO 检测结果，支持：
// - 实时检测状态管理（按 stream 索引）
// - 告警类别自动识别
// - 检测历史记录（最近 N 条）
// - 防抖（同一 stream 短时间内多次检测合并）
// - Mock 模式（无后端时自动使用模拟数据）
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { wsService, type YOLODetectionMessage } from '@/lib/websocket';
import type { YOLODetection } from '@/components/yolo/YOLOOverlay';

// ── Types ──

export interface DetectionRecord {
  id: string;
  streamId: string;
  timestamp: string;
  detections: YOLODetection[];
  /** 是否包含告警类别 (fire/intrusion/smoke) */
  hasAlert: boolean;
}

export interface YOLODetectionState {
  /** 当前检测结果（按 streamId 索引） */
  currentDetections: Record<string, YOLODetection[]>;
  /** 检测历史记录（最新在前） */
  history: DetectionRecord[];
  /** WebSocket 是否已连接 */
  isConnected: boolean;
  /** 当前活跃检测总数 */
  totalActiveDetections: number;
  /** 告警类检测数量 */
  alertDetectionCount: number;
  /** 最近一次检测时间 */
  lastDetectionTime: string | null;
}

export interface UseYOLODetectionOptions {
  /** 是否自动连接 WebSocket，默认 true */
  autoConnect?: boolean;
  /** 历史记录最大条数，默认 100 */
  maxHistory?: number;
  /** 防抖间隔(ms)，同一 stream 在此间隔内的检测合并，默认 300 */
  debounceMs?: number;
  /** 是否在无 WebSocket 时使用 Mock 模式，默认 true */
  enableMock?: boolean;
  /** Mock 模式配置 */
  mockConfig?: {
    intervalMs?: number;
    streamIds?: string[];
  };
}

// ── Constants ──

const ALERT_CLASSES = new Set(['fire', 'intrusion', 'smoke']);
const MOCK_STREAM_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DETECTION_CLASSES = [
  { class_name: 'crack', label: '裂缝' },
  { class_name: 'corrosion', label: '腐蚀' },
  { class_name: 'fire', label: '火焰' },
  { class_name: 'intrusion', label: '入侵' },
  { class_name: 'person', label: '人员' },
  { class_name: 'vehicle', label: '车辆' },
  { class_name: 'animal', label: '动物' },
  { class_name: 'smoke', label: '烟雾' },
];

// ── Helpers ──

function hasAlertClass(detections: YOLODetection[]): boolean {
  return detections.some((d) => ALERT_CLASSES.has(d.class_name));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateMockDetections(): YOLODetection[] {
  const count = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
  if (count === 0) return [];

  const results: YOLODetection[] = [];
  for (let i = 0; i < count; i++) {
    const cls = DETECTION_CLASSES[Math.floor(Math.random() * DETECTION_CLASSES.length)];
    const confidence = 0.72 + Math.random() * 0.27;
    const x1 = 0.1 + Math.random() * 0.5;
    const y1 = 0.1 + Math.random() * 0.4;
    const x2 = Math.min(0.98, x1 + 0.08 + Math.random() * 0.2);
    const y2 = Math.min(0.95, y1 + 0.08 + Math.random() * 0.2);
    results.push({
      class_name: cls.class_name,
      class: cls.class_name,
      confidence: Math.round(confidence * 100) / 100,
      bbox: [x1, y1, x2, y2],
    });
  }
  return results;
}

// ── Hook ──

export function useYOLODetection(options: UseYOLODetectionOptions = {}): YOLODetectionState {
  const {
    autoConnect = true,
    maxHistory = 100,
    debounceMs = 300,
    enableMock = true,
    mockConfig,
  } = options;

  const [currentDetections, setCurrentDetections] = useState<Record<string, YOLODetection[]>>({});
  const [history, setHistory] = useState<DetectionRecord[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Debounce tracking: streamId -> last update timestamp
  const debounceMapRef = useRef<Map<string, number>>(new Map());
  // Pending debounce timers
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // History size ref for closure
  const maxHistoryRef = useRef(maxHistory);

  useEffect(() => {
    maxHistoryRef.current = maxHistory;
  }, [maxHistory]);

  // Process incoming detection
  const processDetection = useCallback(
    (streamId: string, detections: YOLODetection[], timestamp: string) => {
      const now = Date.now();
      const lastUpdate = debounceMapRef.current.get(streamId) ?? 0;

      const doUpdate = () => {
        debounceMapRef.current.set(streamId, Date.now());

        setCurrentDetections((prev) => ({
          ...prev,
          [streamId]: detections,
        }));

        const record: DetectionRecord = {
          id: generateId(),
          streamId,
          timestamp,
          detections,
          hasAlert: hasAlertClass(detections),
        };

        setHistory((prev) => {
          const next = [record, ...prev];
          return next.slice(0, maxHistoryRef.current);
        });
      };

      // Debounce: skip if too frequent
      if (now - lastUpdate < debounceMs) {
        // Clear existing timer and set new one
        const existingTimer = debounceTimersRef.current.get(streamId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(doUpdate, debounceMs);
        debounceTimersRef.current.set(streamId, timer);
      } else {
        doUpdate();
      }
    },
    [debounceMs],
  );

  // WebSocket integration
  useEffect(() => {
    if (!autoConnect) return;

    const unsubscribe = wsService.subscribe('yolo-detection', (message) => {
      const payload = message.payload as YOLODetectionMessage['payload'];
      processDetection(
        payload.stream_id,
        payload.detections as YOLODetection[],
        payload.timestamp,
      );
    });

    // Check connection
    const checkInterval = setInterval(() => {
      setIsConnected(wsService.isConnected);
    }, 3000);
    setIsConnected(wsService.isConnected);

    // Attempt connection
    wsService.connect().catch(() => {
      // Connection failed - will be handled by mock if enabled
    });

    return () => {
      unsubscribe();
      clearInterval(checkInterval);
    };
  }, [autoConnect, processDetection]);

  // Mock mode fallback
  useEffect(() => {
    if (!enableMock || isConnected) return;

    const streamIds = mockConfig?.streamIds ?? MOCK_STREAM_IDS;
    const intervalMs = mockConfig?.intervalMs ?? 2500;

    const timer = setInterval(() => {
      const targetStreamId = streamIds[Math.floor(Math.random() * streamIds.length)];
      const detections = generateMockDetections();
      processDetection(targetStreamId, detections, new Date().toISOString());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enableMock, isConnected, mockConfig, processDetection]);

  // Computed values
  const totalActiveDetections = useMemo(
    () => Object.values(currentDetections).reduce((sum, dets) => sum + dets.length, 0),
    [currentDetections],
  );

  const alertDetectionCount = useMemo(
    () =>
      Object.values(currentDetections).reduce(
        (sum, dets) => sum + dets.filter((d) => ALERT_CLASSES.has(d.class_name)).length,
        0,
      ),
    [currentDetections],
  );

  const lastDetectionTime = useMemo(() => {
    if (history.length === 0) return null;
    return history[0].timestamp;
  }, [history]);

  return {
    currentDetections,
    history,
    isConnected,
    totalActiveDetections,
    alertDetectionCount,
    lastDetectionTime,
  };
}

export default useYOLODetection;
