import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { buildAlertPath } from '../lib/navigation';
import { VideoGrid, GridLayout } from '../components/video/VideoGrid';
import { VideoStreamProps } from '../components/video/VideoStream';
import { useGetStreamsQuery, useGetStreamStatisticsQuery } from '../store/api/streamsApi';
import { useGetDashboardStatsQuery } from '../store/api/dashboardApi';
import type { Stream } from '@/types/api';
import {
  Video,
  AlertTriangle,
  Clock,
  Settings,
  Filter,
  Loader2,
  WifiOff,
} from 'lucide-react';

/**
 * CommandCenter - 监控大屏
 * Tech-Industrial Minimalism 风格的沉浸式监控界面
 */

// 将后端 Stream 数据映射为 VideoStreamProps
function mapStreamToVideoProps(stream: Stream): VideoStreamProps {
  return {
    id: stream.id,
    name: stream.name,
    source: stream.type === 'rtsp' ? 'rtsp' : stream.type === 'webrtc' ? 'webrtc' : 'hls',
    url: stream.url || '',
    status: stream.status === 'online' ? 'online' : stream.status === 'error' ? 'error' : 'offline',
    detections: [],
    isAlert: false,
  };
}

// 统计数据接口
interface CommandCenterStats {
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  activeAlerts: number;
  todayAlerts: number;
}

const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlStreamId = searchParams.get('stream_id');
  const urlHighlight = searchParams.get('highlight') === 'true';

  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [highlightedStreamId, setHighlightedStreamId] = useState<string | null>(null);

  // Apply stream_id + highlight from URL query params
  useEffect(() => {
    if (urlStreamId) {
      setHighlightedStreamId(urlStreamId);
      // Auto-clear highlight after 5 seconds
      if (urlHighlight) {
        const timer = setTimeout(() => setHighlightedStreamId(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [urlStreamId, urlHighlight]);

  // RTK Query: 获取视频流列表（30秒自动轮询）
  const {
    data: streamsResponse,
    isLoading: streamsLoading,
    error: streamsError,
  } = useGetStreamsQuery({ page: 1, page_size: 50 }, { pollingInterval: 30000 });

  // RTK Query: 获取 Dashboard 统计数据（30秒自动轮询）
  const {
    data: dashStatsResponse,
  } = useGetDashboardStatsQuery(undefined, { pollingInterval: 30000 });

  // RTK Query: 获取流统计数据作为 fallback（30秒自动轮询）
  const {
    data: streamStatsResponse,
  } = useGetStreamStatisticsQuery(undefined, { pollingInterval: 30000 });

  // 将 API 响应映射为 VideoStreamProps
  const streams = useMemo<VideoStreamProps[]>(() => {
    const items = streamsResponse?.data?.items;
    return items ? items.map(mapStreamToVideoProps) : [];
  }, [streamsResponse]);

  // 组装统计数据（优先 dashboard stats，fallback 到 stream statistics）
  const stats = useMemo<CommandCenterStats>(() => {
    const dashData = dashStatsResponse?.data;
    const streamStats = streamStatsResponse?.data;

    if (dashData) {
      return {
        totalCameras: dashData.total_streams,
        onlineCameras: dashData.online_streams,
        offlineCameras: dashData.total_streams - dashData.online_streams,
        activeAlerts: dashData.pending_alerts,
        todayAlerts: dashData.total_alerts,
      };
    }

    if (streamStats) {
      return {
        totalCameras: streamStats.total,
        onlineCameras: streamStats.online,
        offlineCameras: streamStats.offline,
        activeAlerts: 0,
        todayAlerts: 0,
      };
    }

    return {
      totalCameras: 0,
      onlineCameras: 0,
      offlineCameras: 0,
      activeAlerts: 0,
      todayAlerts: 0,
    };
  }, [dashStatsResponse, streamStatsResponse]);

  const loading = streamsLoading;
  const error = streamsError ? '无法加载数据，请检查网络连接后刷新页面' : null;

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const now = new Date();
        // 仅当秒数变化时更新，避免不必要的重渲染
        if (prev.getSeconds() !== now.getSeconds()) return now;
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 处理布局变更
  const handleLayoutChange = useCallback((newLayout: GridLayout) => {
    setLayout(newLayout);
  }, []);

  // 处理视频选择
  const handleStreamSelect = useCallback((streamId: string) => {
    setHighlightedStreamId(streamId);
    console.log('Selected stream:', streamId);
  }, []);

  // 处理全屏
  const handleFullscreen = useCallback((streamId: string) => {
    console.log('Fullscreen stream:', streamId);
  }, []);

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        {/* Left: Title */}
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Video className="w-5 h-5 text-accent" />
            监控大屏
          </h1>
        </div>

        {/* Right: Time & Actions */}
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock className="w-4 h-4" />
            <span className="font-mono">
              {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-secondary hover:bg-bg-hover transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-secondary hover:bg-bg-hover transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
              <span className="text-sm">加载视频流数据中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <WifiOff className="w-10 h-10 text-error" />
              <span className="text-sm text-error">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                重新加载
              </button>
            </div>
          </div>
        ) : streams.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-secondary">
              <Video className="w-10 h-10 opacity-30" />
              <span className="text-sm">暂无视频流数据</span>
              <span className="text-xs text-text-disabled">请先添加摄像头或视频源</span>
            </div>
          </div>
        ) : (
          <VideoGrid
            streams={streams.map(s => ({
              ...s,
              isSelected: s.id === highlightedStreamId,
            }))}
            layout={layout}
            onLayoutChange={handleLayoutChange}
            onStreamSelect={handleStreamSelect}
            onStreamFullscreen={handleFullscreen}
            gap="sm"
          />
        )}
      </main>

      {/* Alert Banner (if alerts exist) */}
      {stats.activeAlerts > 0 && (
        <motion.div
          className="px-4 py-2 bg-error-muted border-t border-error"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="text-sm text-error">
              检测到 <strong>{stats.activeAlerts}</strong> 个活跃告警，请尽快处理
            </span>
            <button
              className="ml-auto text-xs text-error hover:text-error underline"
              onClick={() => navigate(buildAlertPath({}))}
            >
              查看详情
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CommandCenter;
