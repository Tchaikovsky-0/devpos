import { useMemo } from 'react';
import { Wifi, AlertTriangle, Activity } from 'lucide-react';
import { StatItem } from '@/components/ui/StatItem';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';
import { useGetStreamStatisticsQuery } from '@/store/api/streamsApi';

interface MonitorStats {
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  activeAlerts: number;
  todayAlerts: number;
}

export function GlobalMonitorStatus() {
  // RTK Query: 获取 Dashboard 统计数据（30秒自动轮询）
  const { data: dashStatsResponse } = useGetDashboardStatsQuery(undefined as void, {
    pollingInterval: 30000
  });

  // RTK Query: 获取流统计数据作为 fallback（30秒自动轮询）
  const { data: streamStatsResponse } = useGetStreamStatisticsQuery(undefined as void, {
    pollingInterval: 30000
  });

  // 组装统计数据（优先 dashboard stats，fallback 到 stream statistics）
  const stats = useMemo<MonitorStats>(() => {
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

  return (
    <div className="flex items-center gap-3">
      <StatItem
        icon={<Wifi className="w-4 h-4" />}
        value={`${stats.onlineCameras}/${stats.totalCameras}`}
        label="在线设备"
        color="success"
      />
      <StatItem
        icon={<AlertTriangle className="w-4 h-4" />}
        value={stats.activeAlerts.toString()}
        label="活跃告警"
        color="danger"
        pulse={stats.activeAlerts > 0}
      />
      <StatItem
        icon={<Activity className="w-4 h-4" />}
        value={stats.todayAlerts.toString()}
        label="今日告警"
        color="info"
      />
    </div>
  );
}

export default GlobalMonitorStatus;
