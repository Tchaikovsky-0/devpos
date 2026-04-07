import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { buildMediaPath, buildDashboardPath } from '../../lib/navigation';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Badge, { PriorityBadge } from '../ui/Badge';
import { Alert, AlertStatus } from '../../types/alert';
import { alertTypeConfig, alertStatusConfig } from '../../types/alert';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  MapPin,
  Bot,
  AlertTriangle,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Monitor,
} from 'lucide-react';
// 日期格式化辅助函数
const formatDate = (date: Date, formatStr: string) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const replacements: Record<string, string> = {
    'yyyy': date.getFullYear().toString(),
    'MM': pad(date.getMonth() + 1),
    'dd': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds()),
  };
  return formatStr.replace(/yyyy|MM|dd|HH|mm|ss/g, match => replacements[match]);
};

/**
 * AlertDetail - 告警详情面板
 * 从右侧滑出的抽屉，显示完整告警信息
 */

export interface AlertDetailProps {
  /** 告警数据 */
  alert: Alert | null;
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 操作回调 */
  onAction?: (action: 'acknowledge' | 'ignore' | 'resolve') => void;
}

export const AlertDetail = ({ alert, isOpen, onClose, onAction }: AlertDetailProps) => {
  const navigate = useNavigate();
  if (!alert) return null;

  const typeConfig = alertTypeConfig[alert.type];
  const statusConfig = alertStatusConfig[alert.status];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <motion.div
        className={cn(
          'fixed right-0 top-0 h-full w-[480px] z-[401]',
          'bg-surface/95 backdrop-blur-xl',
          'border-l border-border',
          'flex flex-col'
        )}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${typeConfig.color}20`,
                color: typeConfig.color,
              }}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">告警详情</h2>
              <p className="text-xs text-text-disabled">ID: {alert.id}</p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Alert Info Card */}
          <div className="p-4">
            <GlassCard variant="elevated" padding="md">
              {/* Title & Priority */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-semibold text-text-primary">{alert.title}</h3>
                <PriorityBadge priority={alert.priority} />
              </div>

              {/* Meta Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Video className="w-4 h-4" />
                  <span>{alert.cameraName}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(alert.timestamp, 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
                {alert.location && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="w-4 h-4" />
                    <span>{alert.location.address || `${alert.location.lat}, ${alert.location.lng}`}</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">状态:</span>
                  <Badge variant={getStatusVariant(alert.status)}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              {/* Cross-module Navigation */}
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(buildMediaPath({
                    alertId: alert.id,
                    timestamp: alert.timestamp.toISOString(),
                  }))}
                  className="flex items-center gap-1.5 text-sm text-accent hover:underline"
                >
                  <ImageIcon className="w-4 h-4" />
                  查看关联媒体
                </button>
                {alert.cameraId && (
                  <button
                    onClick={() => navigate(buildDashboardPath({
                      streamId: alert.cameraId,
                      highlight: true,
                    }))}
                    className="flex items-center gap-1.5 text-sm text-accent hover:underline"
                  >
                    <Monitor className="w-4 h-4" />
                    定位画面
                  </button>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Video/Image Preview */}
          {alert.thumbnailUrl && (
            <div className="px-4 mb-4">
              <h4 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">
                告警截图
              </h4>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-tertiary">
                <img
                  src={alert.thumbnailUrl}
                  alt="告警截图"
                  className="w-full h-full object-cover"
                />
                {alert.videoClipUrl && (
                  <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-bg-muted backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-text-primary ml-1" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {alert.aiAnalysis && (
            <div className="px-4 mb-4">
              <h4 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  AI 分析
                </span>
              </h4>
              <GlassCard variant="default" padding="md">
                {/* Summary */}
                <p className="text-sm text-text-tertiary mb-3">{alert.aiAnalysis.summary}</p>

                {/* Detected Objects */}
                {alert.aiAnalysis.detectedObjects.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-text-primary0">检测到:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {alert.aiAnalysis.detectedObjects.map((obj, idx) => (
                        <Badge key={idx} status="info" size="sm">
                          {obj.label} ({Math.round(obj.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-disabled">置信度:</span>
                  <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${alert.aiAnalysis.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-text-tertiary">
                    {Math.round(alert.aiAnalysis.confidence * 100)}%
                  </span>
                </div>

                {/* Recommendations */}
                {alert.aiAnalysis.recommendations && alert.aiAnalysis.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-text-primary0">建议:</span>
                    <ul className="mt-1 space-y-1">
                      {alert.aiAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-text-secondary flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-accent" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {/* Handling Records */}
          {alert.handlingRecords && alert.handlingRecords.length > 0 && (
            <div className="px-4 mb-4">
              <h4 className="text-xs font-medium text-text-primary0 uppercase tracking-wider mb-2">
                处理记录
              </h4>
              <div className="space-y-2">
                {alert.handlingRecords.map((record) => (
                  <GlassCard key={record.id} variant="ghost" padding="sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-text-primary0" />
                      <span className="text-xs text-text-secondary">
                        {formatDate(record.timestamp, 'MM-dd HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-text-tertiary mt-1">{record.action}</p>
                    {record.operator && (
                      <p className="text-xs text-text-primary0 mt-0.5">操作人: {record.operator}</p>
                    )}
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            {alert.status === 'pending' && (
              <>
                <GlassButton
                  variant="primary"
                  fullWidth
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => onAction?.('acknowledge')}
                >
                  确认处理
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={() => onAction?.('ignore')}
                >
                  忽略
                </GlassButton>
              </>
            )}
            {alert.status === 'processing' && (
              <GlassButton
                variant="success"
                fullWidth
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => onAction?.('resolve')}
              >
                标记为已解决
              </GlassButton>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

/**
 * 获取状态对应的Badge变体
 */
const getStatusVariant = (status: AlertStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const variants: Record<AlertStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'danger',
    processing: 'warning',
    resolved: 'success',
    ignored: 'default',
  };
  return variants[status];
};

export default AlertDetail;
