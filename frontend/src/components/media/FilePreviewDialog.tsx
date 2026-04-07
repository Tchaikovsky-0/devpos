import React, { useState, useCallback, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Download,
  Trash2,
  FileImage,
  FileVideo,
  FileText,
  File,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatSize } from '@/lib/format';
import type { MediaItem } from '@/types/api/media';

interface FilePreviewDialogProps {
  files: MediaItem[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onDownload: (id: number) => void;
  onIndexChange: (index: number) => void;
}

function FileTypeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'image':
      return <FileImage className={cn('text-accent', className)} />;
    case 'video':
      return <FileVideo className={cn('text-accent-soft', className)} />;
    case 'document':
      return <FileText className={cn('text-orange-400', className)} />;
    default:
      return <File className={cn('text-gray-400', className)} />;
  }
}

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  files,
  currentIndex,
  open,
  onClose,
  onStar,
  onDelete,
  onDownload,
  onIndexChange,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentFile = files[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onIndexChange(currentIndex - 1);
      setZoomed(false);
      setImageError(false);
    }
  }, [hasPrev, currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onIndexChange(currentIndex + 1);
      setZoomed(false);
      setImageError(false);
    }
  }, [hasNext, currentIndex, onIndexChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    },
    [open, onClose, handlePrev, handleNext],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setZoomed(false);
    setImageError(false);
  }, [currentIndex]);

  if (!open || !currentFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative flex w-full h-full">
        {/* Main Preview Area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-bg-base/50 backdrop-blur-sm text-text-primary hover:bg-bg-base/80 transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Previous Button */}
          {hasPrev && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-bg-base/50 backdrop-blur-sm text-text-primary hover:bg-bg-base/80 transition-colors"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next Button */}
          {hasNext && (
            <button
              className="absolute right-[340px] top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-bg-base/50 backdrop-blur-sm text-text-primary hover:bg-bg-base/80 transition-colors"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* File Preview Content */}
          <div
            className={cn(
              'flex items-center justify-center max-w-full max-h-full p-8',
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
            )}
            onClick={() => {
              if (currentFile.type === 'image' && !imageError) {
                setZoomed(!zoomed);
              }
            }}
          >
            {/* Image Preview */}
            {currentFile.type === 'image' && !imageError ? (
              <img
                src={currentFile.url}
                alt={currentFile.original_name}
                className={cn(
                  'object-contain transition-all duration-200',
                  zoomed ? 'max-w-none max-h-none' : 'max-w-full max-h-[calc(100vh-64px)]',
                )}
                onError={() => setImageError(true)}
              />
            ) : currentFile.type === 'image' && imageError ? (
              <div className="flex flex-col items-center gap-4 text-text-tertiary">
                <FileTypeIcon type="image" className="h-24 w-24" />
                <span className="text-sm">图片加载失败</span>
              </div>
            ) : currentFile.type === 'video' ? (
              /* Video Preview */
              <div className="w-full max-w-4xl">
                <video
                  src={currentFile.url}
                  controls
                  className="w-full rounded-lg bg-black"
                  autoPlay={false}
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
            ) : (
              /* Document/Other File Icon */
              <div className="flex flex-col items-center gap-4 text-text-tertiary">
                <FileTypeIcon type={currentFile.type} className="h-24 w-24" />
                <span className="text-sm">此文件类型暂不支持预览</span>
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  在新窗口打开
                </a>
              </div>
            )}
          </div>

          {/* Image Controls */}
          {currentFile.type === 'image' && !imageError && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 rounded-full bg-bg-base/50 backdrop-blur-sm">
              <button
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  zoomed ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary',
                )}
                onClick={() => setZoomed(true)}
                title="放大"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  !zoomed ? 'bg-accent text-white' : 'text-text-primary hover:bg-bg-tertiary',
                )}
                onClick={() => setZoomed(false)}
                title="缩小"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded-full text-text-primary hover:bg-bg-tertiary transition-colors"
                onClick={() => setZoomed(false)}
                title="重置"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* File Counter */}
          <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-full bg-bg-base/50 backdrop-blur-sm text-xs text-text-secondary">
            {currentIndex + 1} / {files.length}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[340px] shrink-0 bg-bg-base border-l border-border flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {currentFile.original_name}
            </h3>
            <p className="text-xs text-text-tertiary mt-1 truncate">
              {currentFile.mime_type}
            </p>
          </div>

          {/* Preview Thumb */}
          <div className="p-4 border-b border-border">
            <div className="aspect-video bg-bg-tertiary rounded-lg flex items-center justify-center overflow-hidden">
              {currentFile.type === 'image' ? (
                <img
                  src={currentFile.url}
                  alt={currentFile.original_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileTypeIcon type={currentFile.type} className="h-12 w-12" />
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">文件名</label>
              <p className="text-sm text-text-primary break-all">{currentFile.original_name}</p>
            </div>

            <div>
              <label className="text-xs text-text-tertiary mb-1 block">大小</label>
              <p className="text-sm text-text-primary">{formatSize(currentFile.size)}</p>
            </div>

            <div>
              <label className="text-xs text-text-tertiary mb-1 block">类型</label>
              <p className="text-sm text-text-primary">
                {currentFile.type === 'image' && '图片'}
                {currentFile.type === 'video' && '视频'}
                {currentFile.type === 'audio' && '音频'}
                {currentFile.type === 'document' && '文档'}
                {currentFile.type === 'other' && '其他'}
              </p>
            </div>

            <div>
              <label className="text-xs text-text-tertiary mb-1 block">MIME 类型</label>
              <p className="text-sm text-text-primary break-all">{currentFile.mime_type}</p>
            </div>

            <div>
              <label className="text-xs text-text-tertiary mb-1 block">创建时间</label>
              <p className="text-sm text-text-primary">{formatDate(currentFile.created_at)}</p>
            </div>

            {currentFile.description && (
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">描述</label>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {currentFile.description}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                currentFile.starred
                  ? 'bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20'
                  : 'bg-bg-tertiary text-text-primary hover:bg-bg-hover',
              )}
              onClick={() => onStar(currentFile.id)}
            >
              <Star className="h-4 w-4" fill={currentFile.starred ? 'currentColor' : 'none'} />
              {currentFile.starred ? '已收藏' : '收藏'}
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-bg-tertiary text-text-primary hover:bg-bg-hover transition-colors"
              onClick={() => onDownload(currentFile.id)}
            >
              <Download className="h-4 w-4" />
              下载
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-error/10 text-error hover:bg-error/20 transition-colors"
              onClick={() => {
                onDelete(currentFile.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
