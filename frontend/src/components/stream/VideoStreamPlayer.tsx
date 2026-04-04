import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { YOLOControls } from '@/components/yolo/YOLOControls';
import { YOLODetection, YOLOOverlay } from '@/components/yolo/YOLOOverlay';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export type StreamStatus = 'connecting' | 'online' | 'offline' | 'error';

interface VideoStreamPlayerProps {
  id: string;
  name: string;
  url?: string;
  status: StreamStatus;
  detections?: YOLODetection[];
  yoloEnabled?: boolean;
  muted?: boolean;
  fullscreen?: boolean;
  playingIds?: Set<string>;
  onClick?: (id: string) => void;
  onTogglePlay?: (id: string) => void;
  onFullscreen?: (id: string) => void;
  className?: string;
}

const statusMap: Record<StreamStatus, 'online' | 'offline' | 'alert' | 'pending'> = {
  connecting: 'pending',
  online: 'online',
  offline: 'offline',
  error: 'alert',
};

export const VideoStreamPlayer: React.FC<VideoStreamPlayerProps> = memo(
  ({
    id,
    name,
    status,
    url,
    detections = [],
    yoloEnabled = false,
    muted = true,
    playingIds,
    onClick,
    onTogglePlay,
    onFullscreen,
    className,
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
    const [hovered, setHovered] = useState(false);
    const [localMuted, setLocalMuted] = useState(muted);

    const isActive = playingIds?.has(id) ?? false;

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateSize = () => {
        setVideoSize({
          width: video.clientWidth,
          height: video.clientHeight,
        });
      };

      updateSize();

      const observer = new ResizeObserver(updateSize);
      observer.observe(video);

      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) return;

      video.src = '';
    }, [url]);

    const handleClick = useCallback(() => {
      onClick?.(id);
    }, [id, onClick]);

    const handleTogglePlay = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        onTogglePlay?.(id);
      },
      [id, onTogglePlay],
    );

    const handleFullscreen = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        onFullscreen?.(id);
      },
      [id, onFullscreen],
    );

    const handleToggleMute = useCallback((event: React.MouseEvent) => {
      event.stopPropagation();
      setLocalMuted((previousMuted) => !previousMuted);
    }, []);

    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-[24px] border border-border bg-bg-darkest transition-all duration-normal',
          isActive && 'border-accent/30 shadow-panel',
          onClick && 'cursor-pointer',
          className,
        )}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-video bg-[radial-gradient(circle_at_top,_rgba(91,130,201,0.18),_transparent_35%),linear-gradient(180deg,rgba(12,17,24,0.86),rgba(7,11,16,0.98))]">
          {status === 'offline' || status === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <WifiOff className="h-12 w-12 text-text-tertiary" />
              <p className="mt-3 text-sm font-medium text-text-primary">
                {status === 'error' ? '视频流加载失败' : '设备离线'}
              </p>
              <p className="mt-1 text-xs text-text-secondary">检查设备供电和网络链路后会自动恢复。</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              autoPlay={isActive}
              muted={localMuted}
              playsInline
            />
          )}

          {status === 'online' && (
            <YOLOOverlay
              detections={yoloEnabled ? detections : []}
              width={videoSize.width}
              height={videoSize.height}
              enabled={yoloEnabled && detections.length > 0}
            />
          )}

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
            <div className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {isActive ? '实时' : '待查看'}
            </div>
            <StatusIndicator status={statusMap[status]} size="sm" showLabel />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent p-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="mt-1 text-xs text-white/70">
                  {status === 'online' ? '实时画面' : status === 'connecting' ? '正在连接设备' : '等待恢复'}
                </p>
              </div>

              <div
                className={cn(
                  'flex items-center gap-1 rounded-full bg-black/42 p-1 backdrop-blur transition-opacity duration-normal',
                  hovered || isActive ? 'opacity-100' : 'opacity-0',
                )}
              >
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/12"
                  title={isActive ? '暂停' : '播放'}
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/12"
                  title={localMuted ? '取消静音' : '静音'}
                >
                  {localMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="rounded-full p-2 text-white transition-colors hover:bg-white/12"
                  title="全屏"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {yoloEnabled && detections.length > 0 && (
            <div className="absolute bottom-14 right-3">
              <YOLOControls
                enabled={yoloEnabled}
                onToggle={() => {}}
                detectionCount={detections.length}
                hasActiveAlerts={detections.some((detection) =>
                  ['person', 'intrusion', 'fire'].includes(detection.class),
                )}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.status === nextProps.status &&
    prevProps.yoloEnabled === nextProps.yoloEnabled &&
    prevProps.muted === nextProps.muted &&
    prevProps.fullscreen === nextProps.fullscreen &&
    JSON.stringify(prevProps.detections) === JSON.stringify(nextProps.detections),
);

VideoStreamPlayer.displayName = 'VideoStreamPlayer';

export default VideoStreamPlayer;
