import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Hls, { type ErrorData } from 'hls.js';
import { Loader2, Maximize2, Pause, Play, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { YOLOControls } from '@/components/yolo/YOLOControls';
import { YOLODetection, YOLOOverlay } from '@/components/yolo/YOLOOverlay';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export type StreamStatus = 'connecting' | 'online' | 'offline' | 'error';

type HlsPlayerState = 'idle' | 'loading' | 'ready' | 'error';

const HLS_CONFIG: Partial<Hls['config']> = {
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600,
  startLevel: -1,
};

const MAX_RECOVERY_ATTEMPTS = 3;

function buildHlsUrl(streamId: string): string {
  return `/api/v1/streams/${streamId}/hls/index.m3u8`;
}

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
    const hlsRef = useRef<Hls | null>(null);
    const recoveryAttemptsRef = useRef<number>(0);
    const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
    const [hovered, setHovered] = useState(false);
    const [localMuted, setLocalMuted] = useState(muted);
    const [hlsState, setHlsState] = useState<HlsPlayerState>('idle');
    const [hlsError, setHlsError] = useState<string | null>(null);

    const isActive = playingIds?.has(id) ?? false;
    const hlsUrl = url ?? buildHlsUrl(id);

    // Resize observer for YOLO overlay sizing
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const updateSize = (): void => {
        setVideoSize({
          width: video.clientWidth,
          height: video.clientHeight,
        });
      };

      updateSize();

      const observer = new ResizeObserver(updateSize);
      observer.observe(video);

      return (): void => { observer.disconnect(); };
    }, []);

    // HLS.js initialization and lifecycle
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      // Destroy previous instance if any
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (status === 'offline' || status === 'error') {
        setHlsState('idle');
        return;
      }

      setHlsState('loading');
      setHlsError(null);
      recoveryAttemptsRef.current = 0;

      if (Hls.isSupported()) {
        const hls = new Hls(HLS_CONFIG);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setHlsState('ready');
          recoveryAttemptsRef.current = 0;
          if (isActive) {
            video.play().catch(() => { /* autoplay may be blocked */ });
          }
        });

        hls.on(Hls.Events.ERROR, (_event: typeof Hls.Events.ERROR, data: ErrorData) => {
          if (!data.fatal) return;

          if (recoveryAttemptsRef.current >= MAX_RECOVERY_ATTEMPTS) {
            setHlsState('error');
            setHlsError('播放失败，已达最大重试次数');
            hls.destroy();
            hlsRef.current = null;
            return;
          }

          recoveryAttemptsRef.current += 1;

          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            default:
              setHlsState('error');
              setHlsError('播放遇到不可恢复的错误');
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          setHlsState('ready');
          if (isActive) {
            video.play().catch(() => { /* autoplay may be blocked */ });
          }
        }, { once: true });
        video.addEventListener('error', () => {
          setHlsState('error');
          setHlsError('Safari 原生 HLS 播放失败');
        }, { once: true });
      } else {
        setHlsState('error');
        setHlsError('当前浏览器不支持 HLS 播放');
      }

      return (): void => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hlsUrl, status]);

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
          'group relative overflow-hidden rounded-md bg-black transition-all duration-normal',
          isActive ? 'ring-1 ring-accent z-10 shadow-[0_0_15px_rgba(88,166,255,0.15)]' : 'ring-1 ring-white/5 hover:ring-white/10',
          onClick && 'cursor-pointer',
          className,
        )}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-video bg-black">
          {status === 'offline' || status === 'error' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <WifiOff className="h-12 w-12 text-text-tertiary" />
              <p className="mt-3 text-sm font-medium text-text-primary">
                {status === 'error' ? '视频流加载失败' : '设备离线'}
              </p>
              <p className="mt-1 text-xs text-text-secondary">检查设备供电和网络链路后会自动恢复。</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                autoPlay={isActive}
                muted={localMuted}
                playsInline
              />
              {hlsState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
                  <p className="mt-2 text-xs text-text-secondary">正在加载视频流…</p>
                </div>
              )}
              {hlsState === 'error' && hlsError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  <WifiOff className="h-10 w-10 text-red-400" />
                  <p className="mt-2 text-sm font-medium text-red-400">{hlsError}</p>
                </div>
              )}
            </>
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
            <div className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-text-primary backdrop-blur">
              {isActive ? '实时' : '待查看'}
            </div>
            <StatusIndicator status={statusMap[status]} size="sm" showLabel />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent p-3">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                <p className="mt-1 text-xs text-text-primary/70">
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
                  className="rounded-full p-2 text-text-primary transition-colors hover:bg-bg-muted"
                  title={isActive ? '暂停' : '播放'}
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="rounded-full p-2 text-text-primary transition-colors hover:bg-bg-muted"
                  title={localMuted ? '取消静音' : '静音'}
                >
                  {localMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="rounded-full p-2 text-text-primary transition-colors hover:bg-bg-muted"
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
    prevProps.url === nextProps.url &&
    prevProps.yoloEnabled === nextProps.yoloEnabled &&
    prevProps.muted === nextProps.muted &&
    prevProps.fullscreen === nextProps.fullscreen &&
    JSON.stringify(prevProps.detections) === JSON.stringify(nextProps.detections),
);

VideoStreamPlayer.displayName = 'VideoStreamPlayer';

export default VideoStreamPlayer;
