import React from 'react';
import {
  FileImage,
  FileVideo,
  FileText,
  File,
  Star,
  Download,
  Trash2,
  FolderInput,
  Check,
  Play,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatSize } from '@/lib/format';
import type { MediaItem } from '@/types/api/media';

interface FileGridProps {
  files: MediaItem[];
  viewMode: 'grid' | 'list';
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: (id: number) => void;
  onDownload: (id: number) => void;
  onEdit?: (file: MediaItem) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number, event: React.MouseEvent) => void;
  onPreview?: (id: number, index: number) => void;
  selectionMode?: boolean;
}

// Get badge color by mime type
function getExtBadgeColor(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'bg-error-muted';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'bg-accent-muted';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'bg-success-muted';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'bg-orange-500/80';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'bg-yellow-500/80';
  if (mimeType.includes('audio')) return 'bg-pink-500/80';
  return 'bg-gray-500/80';
}

// Extract file extension for badge
function getExtName(mimeType: string, originalName: string): string {
  const parts = originalName.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1].toUpperCase().slice(0, 6);
  }
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'XLS';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT';
  if (mimeType.includes('audio')) return 'AUDIO';
  if (mimeType.includes('zip')) return 'ZIP';
  return 'FILE';
}

// ---------------------------------------------------------------------------
// Thumbnail components
// ---------------------------------------------------------------------------

interface ThumbnailProps {
  file: MediaItem;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  selectionMode?: boolean;
}

function ImageThumbnail({ file, onClick, onDoubleClick }: ThumbnailProps) {
  return (
    <div
      className="relative aspect-square bg-bg-tertiary overflow-hidden cursor-pointer group/thumb"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <img
        src={file.url}
        alt={file.original_name}
        className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
        loading="lazy"
      />
      {/* Hover overlay with preview icon */}
      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Eye className="h-5 w-5 text-text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoThumbnail({ file, onClick, onDoubleClick }: ThumbnailProps) {
  return (
    <div
      className="relative aspect-square bg-bg-tertiary overflow-hidden flex items-center justify-center cursor-pointer group/thumb"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {file.url ? (
        <img
          src={file.url}
          alt={file.original_name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
          loading="lazy"
        />
      ) : (
        <FileVideo className="h-10 w-10 text-accent-soft" />
      )}
      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-surface backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <Play className="h-6 w-6 text-gray-800 ml-0.5" fill="currentColor" />
        </div>
      </div>
      {/* Duration badge */}
      {file.description && (
        <span className="absolute bottom-1.5 right-1.5 text-[10px] px-1 py-0.5 rounded bg-black/60 text-text-primary font-medium">
          {file.description}
        </span>
      )}
    </div>
  );
}

function DocThumbnail({ file, onClick, onDoubleClick }: ThumbnailProps) {
  const ext = getExtName(file.mime_type, file.original_name);
  const color = getExtBadgeColor(file.mime_type);
  return (
    <div
      className="relative aspect-square bg-bg-tertiary overflow-hidden flex items-center justify-center cursor-pointer group/thumb"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <FileText className="h-10 w-10 text-orange-400 group-hover/thumb:text-orange-300 transition-colors" />
      {/* Extension badge */}
      <span className={cn(
        'absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-bold text-text-primary',
        color,
      )}>
        {ext}
      </span>
      {/* Hover preview icon */}
      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Eye className="h-4 w-4 text-text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AudioThumbnail({ file: _file, onClick, onDoubleClick }: ThumbnailProps) {
  void _file;
  return (
    <div
      className="relative aspect-square bg-bg-tertiary overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer group/thumb"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="w-14 h-14 rounded-xl bg-pink-500/20 flex items-center justify-center">
        <FileVideo className="h-7 w-7 text-pink-400" />
      </div>
      <span className="text-[10px] text-text-tertiary group-hover/thumb:text-text-secondary transition-colors">音频文件</span>
      {/* Hover preview icon */}
      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Eye className="h-4 w-4 text-text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OtherThumbnail({ file, onClick, onDoubleClick }: ThumbnailProps) {
  const ext = getExtName(file.mime_type, file.original_name);
  const color = getExtBadgeColor(file.mime_type);
  return (
    <div
      className="relative aspect-square bg-bg-tertiary overflow-hidden flex items-center justify-center cursor-pointer group/thumb"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <File className="h-10 w-10 text-gray-400 group-hover/thumb:text-gray-300 transition-colors" />
      {/* Extension badge */}
      <span className={cn(
        'absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded font-bold text-text-primary',
        color,
      )}>
        {ext}
      </span>
      {/* Hover preview icon */}
      <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover/thumb:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Eye className="h-4 w-4 text-text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FileThumbnail({ file, onClick, onDoubleClick, selectionMode }: ThumbnailProps) {
  switch (file.type) {
    case 'image':
      return <ImageThumbnail file={file} onClick={onClick} onDoubleClick={onDoubleClick} selectionMode={selectionMode} />;
    case 'video':
      return <VideoThumbnail file={file} onClick={onClick} onDoubleClick={onDoubleClick} selectionMode={selectionMode} />;
    case 'document':
      return <DocThumbnail file={file} onClick={onClick} onDoubleClick={onDoubleClick} />;
    case 'audio':
      return <AudioThumbnail file={file} onClick={onClick} onDoubleClick={onDoubleClick} />;
    default:
      return <OtherThumbnail file={file} onClick={onClick} onDoubleClick={onDoubleClick} />;
  }
}

function FileIcon({ type, className }: { type: string; className?: string }) {
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

// ---------------------------------------------------------------------------
// Checkbox component
// ---------------------------------------------------------------------------

function SelectionCheckbox({
  checked,
  onClick,
  visible,
}: {
  checked: boolean;
  onClick: (e: React.MouseEvent) => void;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
        checked
          ? 'bg-accent border-accent text-text-primary'
          : 'border-text-tertiary bg-bg-base/80 backdrop-blur-sm',
        visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
      )}
      onClick={onClick}
    >
      {checked && <Check className="h-3 w-3" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FileGrid - List Mode
// ---------------------------------------------------------------------------

const FileListItem: React.FC<{
  file: MediaItem;
  index: number;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number, event: React.MouseEvent) => void;
  onPreview?: (id: number, index: number) => void;
  onStar: (id: number) => void;
  onMove: (id: number) => void;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (file: MediaItem) => void;
  selectionMode?: boolean;
}> = ({
  file,
  index,
  selectedIds,
  onToggleSelect,
  onPreview,
  onStar,
  onMove,
  onDownload,
  onDelete,
  onEdit,
  selectionMode,
}) => {
  const isSelected = selectedIds?.has(file.id) ?? false;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-pointer',
        isSelected
          ? 'bg-accent/10 ring-1 ring-accent/30'
          : 'hover:bg-bg-hover',
      )}
      onClick={(e) => {
        if (selectionMode && onToggleSelect) {
          onToggleSelect(file.id, e);
        }
      }}
      onDoubleClick={() => {
        if (onPreview && !selectionMode) {
          onPreview(file.id, index);
        }
      }}
    >
      {/* Checkbox */}
      <SelectionCheckbox
        checked={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleSelect) {
            onToggleSelect(file.id, e);
          }
        }}
        visible={selectionMode || !!selectedIds}
      />

      {/* Thumbnail */}
      {file.type === 'image' && file.url ? (
        <img
          src={file.url}
          alt={file.original_name}
          className="h-6 w-6 rounded object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <FileIcon type={file.type} className="h-5 w-5 shrink-0" />
      )}

      <span className="flex-1 text-sm text-text-primary truncate min-w-0">
        {file.original_name}
      </span>

      <span className="text-xs text-text-tertiary shrink-0 hidden sm:block">{formatSize(file.size)}</span>
      <span className="text-xs text-text-tertiary shrink-0 w-24 text-right hidden md:block">{formatDate(file.created_at)}</span>

      {/* Action buttons */}
      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
        {onEdit && (
          <button
            className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(file);
            }}
            title="编辑描述"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          className={cn('p-1 rounded hover:bg-bg-tertiary', file.starred ? 'text-yellow-400' : 'text-text-tertiary')}
          onClick={(e) => {
            e.stopPropagation();
            onStar(file.id);
          }}
          title={file.starred ? '取消收藏' : '收藏'}
        >
          <Star className="h-3.5 w-3.5" fill={file.starred ? 'currentColor' : 'none'} />
        </button>
        <button
          className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
          onClick={(e) => {
            e.stopPropagation();
            onMove(file.id);
          }}
          title="移动"
        >
          <FolderInput className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-bg-tertiary text-text-tertiary"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file.id);
          }}
          title="下载"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-bg-tertiary text-error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id);
          }}
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FileGrid - Grid Mode
// ---------------------------------------------------------------------------

const FileGridItem: React.FC<{
  file: MediaItem;
  index: number;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number, event: React.MouseEvent) => void;
  onPreview?: (id: number, index: number) => void;
  onStar: (id: number) => void;
  onMove: (id: number) => void;
  onDownload: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit?: (file: MediaItem) => void;
  selectionMode?: boolean;
}> = ({
  file,
  index,
  selectedIds,
  onToggleSelect,
  onPreview,
  onStar,
  onMove,
  onDownload,
  onDelete,
  onEdit,
  selectionMode,
}) => {
  const isSelected = selectedIds?.has(file.id) ?? false;
  const showCheckbox = selectionMode || isSelected || !!selectedIds;

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode && onToggleSelect) {
      onToggleSelect(file.id, e);
    } else if (onPreview) {
      onPreview(file.id, index);
    }
  };

  const handleThumbnailDoubleClick = () => {
    if (!selectionMode && onPreview) {
      onPreview(file.id, index);
    }
  };

  return (
    <div
      className={cn(
        'group relative surface-panel rounded-xl overflow-hidden transition-all',
        isSelected
          ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-base'
          : 'hover:ring-1 hover:ring-accent/30',
      )}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <SelectionCheckbox
          checked={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) {
              onToggleSelect(file.id, e);
            }
          }}
          visible={showCheckbox}
        />
      </div>

      {/* File Preview Thumbnail */}
      <FileThumbnail
        file={file}
        selectionMode={selectionMode}
        onClick={handleThumbnailClick}
        onDoubleClick={handleThumbnailDoubleClick}
      />

      {/* File Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-text-primary truncate" title={file.original_name}>
          {file.original_name}
        </p>
        <p className="text-[10px] text-text-tertiary mt-0.5">{formatSize(file.size)}</p>
      </div>

      {/* Action Buttons - Hidden in selection mode */}
      {!selectionMode && (
        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-0.5">
          {onEdit && (
            <button
              className="p-1 rounded-md bg-bg-base/80 backdrop-blur-sm text-text-tertiary hover:text-text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(file);
              }}
              title="编辑描述"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
          <button
            className={cn(
              'p-1 rounded-md backdrop-blur-sm',
              file.starred ? 'bg-yellow-400/90 text-text-primary' : 'bg-bg-base/80 text-text-tertiary hover:text-text-primary',
            )}
            onClick={(e) => {
              e.stopPropagation();
              onStar(file.id);
            }}
            title={file.starred ? '取消收藏' : '收藏'}
          >
            <Star className="h-3 w-3" fill={file.starred ? 'currentColor' : 'none'} />
          </button>
          <button
            className="p-1 rounded-md bg-bg-base/80 backdrop-blur-sm text-text-tertiary hover:text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onMove(file.id);
            }}
            title="移动"
          >
            <FolderInput className="h-3 w-3" />
          </button>
          <button
            className="p-1 rounded-md bg-bg-base/80 backdrop-blur-sm text-text-tertiary hover:text-text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file.id);
            }}
            title="下载"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            className="p-1 rounded-md bg-bg-base/80 backdrop-blur-sm text-error hover:bg-bg-base/90"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file.id);
            }}
            title="删除"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Selected indicator overlay */}
      {isSelected && (
        <div className="absolute bottom-2 right-2">
          <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FileGrid
// ---------------------------------------------------------------------------

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  viewMode,
  onStar,
  onDelete,
  onMove,
  onDownload,
  onEdit,
  selectedIds,
  onToggleSelect,
  onPreview,
  selectionMode = false,
}) => {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
        <File className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">暂无文件</p>
        <p className="text-xs mt-1">上传文件或切换文件夹查看内容</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {/* List header */}
        <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-text-tertiary uppercase tracking-wide border-b border-border mb-1">
          <div className="w-5 shrink-0" />
          <div className="w-6 shrink-0" />
          <span className="flex-1">文件名</span>
          <span className="shrink-0 hidden sm:block w-20 text-right">大小</span>
          <span className="shrink-0 hidden md:block w-24 text-right">时间</span>
          <div className="w-28 shrink-0 hidden group-hover:flex" />
        </div>
        {files.map((file, index) => (
          <FileListItem
            key={file.id}
            file={file}
            index={index}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onPreview={onPreview}
            onStar={onStar}
            onMove={onMove}
            onDownload={onDownload}
            onDelete={onDelete}
            onEdit={onEdit}
            selectionMode={selectionMode}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {files.map((file, index) => (
        <FileGridItem
          key={file.id}
          file={file}
          index={index}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onPreview={onPreview}
          onStar={onStar}
          onMove={onMove}
          onDownload={onDownload}
          onDelete={onDelete}
          onEdit={onEdit}
          selectionMode={selectionMode}
        />
      ))}
    </div>
  );
};
