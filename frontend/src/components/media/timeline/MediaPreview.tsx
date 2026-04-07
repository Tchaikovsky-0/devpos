// =============================================================================
// MediaPreview - 媒体预览组件
// 时间轴上方显示当前选中时间的媒体，支持视频/图片切换
// =============================================================================

import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { MediaPreviewItem, AIAnalysisReport, DetectionItem } from '@/types/timeline';

interface MediaPreviewProps {
  item: MediaPreviewItem | null;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

// 检测项卡片
const DetectionCard: React.FC<{ detection: DetectionItem }> = memo(({ detection }) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-text-tertiary';
  };

  return (
    <div className="flex items-center justify-between p-2 bg-surface-subtle/50 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-sm text-text-primary capitalize">{detection.type}</span>
      </div>
      <span className={cn('text-sm font-medium', getConfidenceColor(detection.confidence))}>
        {(detection.confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
});

DetectionCard.displayName = 'DetectionCard';

// AI分析报告面板
const AIReportPanel: React.FC<{ report: AIAnalysisReport }> = memo(({ report }) => {
  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { icon: React.ElementType; color: string; label: string }> = {
      low: { icon: CheckCircle2, color: 'text-success', label: '低风险' },
      medium: { icon: AlertTriangle, color: 'text-warning', label: '中风险' },
      high: { icon: AlertTriangle, color: 'text-orange-500', label: '高风险' },
      critical: { icon: AlertTriangle, color: 'text-error', label: '紧急' },
    };
    return configs[severity] || configs.low;
  };

  const severityConfig = getSeverityConfig(report.severity);
  const SeverityIcon = severityConfig.icon;

  return (
    <div className="space-y-4">
      {/* 严重程度 */}
      <div className="flex items-center gap-3 p-3 bg-surface-raised rounded-xl">
        <div className={cn('p-2 rounded-lg bg-surface-subtle', severityConfig.color)}>
          <SeverityIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{severityConfig.label}</p>
          <p className="text-xs text-text-tertiary">
            分析时间: {report.timestamp.toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 分析摘要 */}
      <div className="p-3 bg-surface-raised rounded-xl">
        <h4 className="text-sm font-medium text-text-primary mb-2">分析摘要</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{report.summary}</p>
      </div>

      {/* 检测结果 */}
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-2">
          检测结果 ({report.detections.length})
        </h4>
        <div className="space-y-2">
          {report.detections.map((detection, index) => (
            <DetectionCard key={index} detection={detection} />
          ))}
        </div>
      </div>

      {/* 建议 */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">处理建议</h4>
          <ul className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

AIReportPanel.displayName = 'AIReportPanel';

export const MediaPreview: React.FC<MediaPreviewProps> = memo(
  ({ item, onPrevious, onNext, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showReport, setShowReport] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // 视频控制
    const togglePlay = useCallback(() => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }, [isMuted]);

    const handleTimeUpdate = useCallback(() => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, []);

    const handleLoadedMetadata = useCallback(() => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    }, []);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }, []);

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 重置播放状态当item变化时
    useEffect(() => {
      setIsPlaying(false);
      setCurrentTime(0);
    }, [item?.id]);

    if (!item) {
      return (
        <div
          className={cn(
            'flex items-center justify-center',
            'bg-surface-raised/50 rounded-2xl border border-border/30',
            'min-h-[400px]',
            className,
          )}
        >
          <div className="text-center">
            <Camera className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">选择时间轴上的事件查看媒体</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex gap-4', className)}>
        {/* 媒体播放器 */}
        <div className="flex-1 bg-surface-raised rounded-2xl overflow-hidden border border-border/30">
          {/* 媒体内容 */}
          <div className="relative aspect-video bg-black">
            {item.type === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={item.url}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  muted={isMuted}
                  poster={item.thumbnailUrl}
                />

                {/* 播放控制遮罩 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                </div>

                {/* 导航按钮 */}
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </>
            ) : (
              <img
                src={item.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            )}

            {/* 类型标签 */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
              {item.type === 'video' ? '视频' : '图片'}
            </div>
          </div>

          {/* 控制栏 */}
          <div className="p-4 space-y-3">
            {/* 进度条 (仅视频) */}
            {item.type === 'video' && duration > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-surface-subtle rounded-full appearance-none cursor-pointer accent-accent"
                />
                <span className="text-xs text-text-tertiary w-12">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.type === 'video' && (
                  <Button variant="ghost" size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                )}
                {item.type === 'video' && (
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Download className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* 媒体信息 */}
          <div className="px-4 pb-4 border-t border-border/30 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-text-primary">
                  {item.cameraName || '未知摄像头'}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.timestamp.toLocaleString('zh-CN')}</span>
                </div>
              </div>
              {item.aiReport && (
                <button
                  onClick={() => setShowReport(!showReport)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    showReport
                      ? 'bg-accent/20 text-accent'
                      : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated',
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  AI报告
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI报告面板 */}
        <AnimatePresence>
          {showReport && item.aiReport && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 bg-surface-raised rounded-2xl border border-border/30 p-4 overflow-y-auto max-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">AI分析报告</h3>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-subtle transition-colors"
                >
                  <span className="sr-only">关闭</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AIReportPanel report={item.aiReport} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

MediaPreview.displayName = 'MediaPreview';

export default MediaPreview;
