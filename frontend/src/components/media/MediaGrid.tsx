import React, { useRef, useState, useEffect, type CSSProperties, type ReactElement } from 'react';
import { Grid, List } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import GlassButton from '../ui/GlassButton';
import { formatMediaDate, formatFileSize, getFileIcon } from './mediaHelpers';
import type { MediaItem, FolderItem } from '../../types/api/media';
import { FolderOpen, Video, Star, StarOff, Trash2, Download, Loader2, WifiOff, Upload } from 'lucide-react';

/** 虚拟化阈值：文件数超过此值时启用 */
const VIRTUALIZE_THRESHOLD = 100;
/** Grid 视图单元格尺寸 */
const GRID_CELL_HEIGHT = 220;
const GRID_CELL_MIN_WIDTH = 180;
/** List 视图行高 */
const LIST_ROW_HEIGHT = 44;

interface MediaGridProps {
  files: MediaItem[];
  folders: FolderItem[];
  viewMode: 'grid' | 'list';
  loading: boolean;
  error: string | null;
  selectedItem: MediaItem | null;
  isDragging: boolean;
  page: number;
  totalPages: number;
  totalFiles: number;
  onSelectItem: (item: MediaItem) => void;
  onNavigateToFolder: (folderId: number, folderName: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onToggleStar: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const MediaGrid: React.FC<MediaGridProps> = ({
  files, folders, viewMode, loading, error, selectedItem, isDragging,
  page, totalPages, totalFiles,
  onSelectItem, onNavigateToFolder, onDeleteFolder,
  onToggleStar, onDownload, onDelete, onPageChange, onRefresh,
}) => (
  <div className="flex-1 overflow-y-auto p-4">
    {/* Drag overlay */}
    <AnimatePresence>
      {isDragging && (
        <motion.div
          className="fixed inset-0 z-50 bg-accent/10 border-2 border-dashed border-accent rounded-xl flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-accent mx-auto mb-3" />
            <p className="text-lg font-medium text-accent">释放文件以上传</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {loading ? (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <span className="text-sm text-text-secondary">加载中...</span>
        </div>
      </div>
    ) : error ? (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <WifiOff className="w-10 h-10 text-error" />
          <span className="text-sm text-error">{error}</span>
          <GlassButton variant="primary" size="sm" onClick={onRefresh}>重新加载</GlassButton>
        </div>
      </div>
    ) : folders.length === 0 && files.length === 0 ? (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <FolderOpen className="w-12 h-12 opacity-30" />
          <p className="text-sm">当前文件夹为空</p>
          <p className="text-xs text-text-disabled">拖拽文件到此处上传，或点击上方"上传"按钮</p>
        </div>
      </div>
    ) : viewMode === 'grid' ? (
      files.length > VIRTUALIZE_THRESHOLD ? (
        <VirtualizedGridView
          files={files}
          folders={folders}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          onNavigateToFolder={onNavigateToFolder}
          onDeleteFolder={onDeleteFolder}
          onToggleStar={onToggleStar}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ) : (
        <GridView
          files={files}
          folders={folders}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          onNavigateToFolder={onNavigateToFolder}
          onDeleteFolder={onDeleteFolder}
          onToggleStar={onToggleStar}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      )
    ) : (
      files.length > VIRTUALIZE_THRESHOLD ? (
        <VirtualizedListView
          files={files}
          folders={folders}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          onNavigateToFolder={onNavigateToFolder}
          onDeleteFolder={onDeleteFolder}
          onToggleStar={onToggleStar}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ) : (
        <ListView
          files={files}
          folders={folders}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
          onNavigateToFolder={onNavigateToFolder}
          onDeleteFolder={onDeleteFolder}
          onToggleStar={onToggleStar}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      )
    )}

    {/* ===== Pagination ===== */}
    {totalPages > 1 && (
      <div className="flex items-center justify-center gap-2 pt-6 pb-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          上一页
        </button>
        <span className="text-sm text-text-secondary">
          第 {page} / {totalPages} 页 · 共 {totalFiles} 个文件
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="px-3 py-1.5 rounded-lg text-sm text-text-secondary border border-border hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          下一页
        </button>
      </div>
    )}
  </div>
);

interface ViewProps {
  files: MediaItem[];
  folders: FolderItem[];
  selectedItem: MediaItem | null;
  onSelectItem: (item: MediaItem) => void;
  onNavigateToFolder: (folderId: number, folderName: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onToggleStar: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

const GridView: React.FC<ViewProps> = ({
  files, folders, selectedItem,
  onSelectItem, onNavigateToFolder, onDeleteFolder,
  onToggleStar, onDownload, onDelete,
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {folders.map(folder => (
      <motion.div
        key={`folder-${folder.id}`}
        className={cn(
          'group relative p-3 rounded-xl border border-border bg-bg-primary',
          'hover:border-accent/40 hover:bg-bg-hover cursor-pointer transition-all'
        )}
        onDoubleClick={() => onNavigateToFolder(folder.id, folder.name)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="w-10 h-10 text-yellow-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{folder.name}</p>
            <p className="text-[10px] text-text-disabled">{formatMediaDate(folder.created_at)}</p>
          </div>
        </div>
        <button
          className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-text-disabled opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-muted transition-all"
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
          title="删除文件夹"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    ))}

    {files.map(file => (
      <motion.div
        key={`file-${file.id}`}
        className={cn(
          'group relative rounded-xl border overflow-hidden cursor-pointer transition-all',
          selectedItem?.id === file.id
            ? 'border-accent ring-1 ring-accent/30'
            : 'border-border hover:border-accent/40'
        )}
        onClick={() => onSelectItem(file)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="aspect-video bg-bg-tertiary relative">
          {file.type === 'image' ? (
            <img src={file.url} alt={file.original_name} className="w-full h-full object-cover" loading="lazy" />
          ) : file.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
              <Video className="w-8 h-8 text-text-disabled" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">{getFileIcon(file.type)}</div>
          )}
          {file.starred && <Star className="absolute top-1.5 right-1.5 w-4 h-4 text-yellow-400 fill-yellow-400" />}
        </div>
        <div className="p-2">
          <p className="text-xs text-text-primary truncate" title={file.original_name}>{file.original_name}</p>
          <p className="text-[10px] text-text-disabled mt-0.5">{formatFileSize(file.size)}</p>
        </div>
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); onToggleStar(file); }}
            title={file.starred ? '取消收藏' : '收藏'}
          >
            {file.starred ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
          </button>
          <button
            className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
            onClick={(e) => { e.stopPropagation(); onDownload(file); }}
            title="下载"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-red-600/80"
            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    ))}
  </div>
);

const ListView: React.FC<ViewProps> = ({
  files, folders, selectedItem,
  onSelectItem, onNavigateToFolder, onDeleteFolder,
  onToggleStar, onDownload, onDelete,
}) => (
  <div className="space-y-1">
    {folders.map(folder => (
      <div
        key={`folder-${folder.id}`}
        className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover cursor-pointer transition-colors"
        onDoubleClick={() => onNavigateToFolder(folder.id, folder.name)}
      >
        <FolderOpen className="w-5 h-5 text-yellow-500 shrink-0" />
        <span className="flex-1 text-sm text-text-primary truncate">{folder.name}</span>
        <span className="text-xs text-text-disabled">{formatMediaDate(folder.created_at)}</span>
        <button
          className="w-7 h-7 rounded flex items-center justify-center text-text-disabled opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-muted transition-all"
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}

    {files.map(file => (
      <div
        key={`file-${file.id}`}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          selectedItem?.id === file.id ? 'bg-accent-muted' : 'hover:bg-bg-hover'
        )}
        onClick={() => onSelectItem(file)}
      >
        {getFileIcon(file.type)}
        <span className="flex-1 text-sm text-text-primary truncate" title={file.original_name}>{file.original_name}</span>
        {file.starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
        <span className="text-xs text-text-disabled shrink-0 w-16 text-right">{formatFileSize(file.size)}</span>
        <span className="text-xs text-text-disabled shrink-0 w-36 text-right">{formatMediaDate(file.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-yellow-500 hover:bg-bg-hover transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleStar(file); }}
          >
            {file.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          </button>
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-accent hover:bg-bg-hover transition-colors"
            onClick={(e) => { e.stopPropagation(); onDownload(file); }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-error hover:bg-error-muted transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ))}
  </div>
);

/* ─── react-window v2 cellComponent / rowComponent ─── */

interface MediaGridCellProps {
  files: MediaItem[];
  columnCount: number;
  selectedItem: MediaItem | null;
  onSelectItem: (item: MediaItem) => void;
  onToggleStar: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

function MediaGridCell({
  columnIndex,
  rowIndex,
  style,
  files,
  columnCount,
  selectedItem,
  onSelectItem,
  onToggleStar,
  onDownload,
  onDelete,
}: {
  ariaAttributes: Record<string, unknown>;
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
} & MediaGridCellProps): ReactElement | null {
  const idx = rowIndex * columnCount + columnIndex;
  if (idx >= files.length) return <div style={style} />;
  const file = files[idx];
  return (
    <div style={style} className="p-1.5">
      <div
        className={cn(
          'group relative rounded-xl border overflow-hidden cursor-pointer transition-all h-full',
          selectedItem?.id === file.id
            ? 'border-accent ring-1 ring-accent/30'
            : 'border-border hover:border-accent/40'
        )}
        onClick={() => onSelectItem(file)}
      >
        <div className="aspect-video bg-bg-tertiary relative">
          {file.type === 'image' ? (
            <img src={file.url} alt={file.original_name} className="w-full h-full object-cover" loading="lazy" />
          ) : file.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-bg-tertiary">
              <Video className="w-8 h-8 text-text-disabled" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">{getFileIcon(file.type)}</div>
          )}
          {file.starred && <Star className="absolute top-1.5 right-1.5 w-4 h-4 text-yellow-400 fill-yellow-400" />}
        </div>
        <div className="p-2">
          <p className="text-xs text-text-primary truncate" title={file.original_name}>{file.original_name}</p>
          <p className="text-[10px] text-text-disabled mt-0.5">{formatFileSize(file.size)}</p>
        </div>
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70" onClick={(e) => { e.stopPropagation(); onToggleStar(file); }} title={file.starred ? '取消收藏' : '收藏'}>
            {file.starred ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
          </button>
          <button className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-black/70" onClick={(e) => { e.stopPropagation(); onDownload(file); }} title="下载">
            <Download className="w-3 h-3" />
          </button>
          <button className="w-6 h-6 rounded bg-black/50 flex items-center justify-center text-white hover:bg-red-600/80" onClick={(e) => { e.stopPropagation(); onDelete(file); }} title="删除">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MediaListRowProps {
  files: MediaItem[];
  selectedItem: MediaItem | null;
  onSelectItem: (item: MediaItem) => void;
  onToggleStar: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

function MediaListRow({
  index,
  style,
  files,
  selectedItem,
  onSelectItem,
  onToggleStar,
  onDownload,
  onDelete,
}: {
  ariaAttributes: Record<string, unknown>;
  index: number;
  style: CSSProperties;
} & MediaListRowProps): ReactElement | null {
  const file = files[index];
  if (!file) return null;
  return (
    <div style={style}>
      <div
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          selectedItem?.id === file.id ? 'bg-accent-muted' : 'hover:bg-bg-hover'
        )}
        onClick={() => onSelectItem(file)}
      >
        {getFileIcon(file.type)}
        <span className="flex-1 text-sm text-text-primary truncate" title={file.original_name}>{file.original_name}</span>
        {file.starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
        <span className="text-xs text-text-disabled shrink-0 w-16 text-right">{formatFileSize(file.size)}</span>
        <span className="text-xs text-text-disabled shrink-0 w-36 text-right">{formatMediaDate(file.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-yellow-500 hover:bg-bg-hover transition-colors" onClick={(e) => { e.stopPropagation(); onToggleStar(file); }}>
            {file.starred ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-accent hover:bg-bg-hover transition-colors" onClick={(e) => { e.stopPropagation(); onDownload(file); }}>
            <Download className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center text-text-disabled hover:text-error hover:bg-error-muted transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(file); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 虚拟化 Grid 视图 ─── */

const VirtualizedGridView: React.FC<ViewProps> = ({
  files, folders, selectedItem,
  onSelectItem, onNavigateToFolder, onDeleteFolder,
  onToggleStar, onDownload, onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const columnCount = Math.max(1, Math.floor(dims.width / GRID_CELL_MIN_WIDTH));
  const cellWidth = dims.width / columnCount;
  const rowCount = Math.ceil(files.length / columnCount);

  return (
    <div className="space-y-3">
      {/* 文件夹普通渲染 */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {folders.map(folder => (
            <div
              key={`folder-${folder.id}`}
              className={cn(
                'group relative p-3 rounded-xl border border-border bg-bg-primary',
                'hover:border-accent/40 hover:bg-bg-hover cursor-pointer transition-all'
              )}
              onDoubleClick={() => onNavigateToFolder(folder.id, folder.name)}
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="w-10 h-10 text-yellow-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{folder.name}</p>
                  <p className="text-[10px] text-text-disabled">{formatMediaDate(folder.created_at)}</p>
                </div>
              </div>
              <button
                className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center text-text-disabled opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-muted transition-all"
                onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                title="删除文件夹"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 文件虚拟化网格 */}
      <div ref={containerRef} className="flex-1" style={{ minHeight: 400, height: 'calc(100vh - 320px)' }}>
        <Grid<MediaGridCellProps>
          cellComponent={MediaGridCell}
          cellProps={{
            files,
            columnCount,
            selectedItem,
            onSelectItem,
            onToggleStar,
            onDownload,
            onDelete,
          }}
          columnCount={columnCount}
          columnWidth={cellWidth}
          rowCount={rowCount}
          rowHeight={GRID_CELL_HEIGHT}
          overscanCount={3}
          style={{ height: dims.height, width: dims.width }}
        />
      </div>
    </div>
  );
};

/* ─── 虚拟化 List 视图 ─── */

const VirtualizedListView: React.FC<ViewProps> = ({
  files, folders, selectedItem,
  onSelectItem, onNavigateToFolder, onDeleteFolder,
  onToggleStar, onDownload, onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="space-y-1">
      {/* 文件夹普通渲染 */}
      {folders.map(folder => (
        <div
          key={`folder-${folder.id}`}
          className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover cursor-pointer transition-colors"
          onDoubleClick={() => onNavigateToFolder(folder.id, folder.name)}
        >
          <FolderOpen className="w-5 h-5 text-yellow-500 shrink-0" />
          <span className="flex-1 text-sm text-text-primary truncate">{folder.name}</span>
          <span className="text-xs text-text-disabled">{formatMediaDate(folder.created_at)}</span>
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-disabled opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error-muted transition-all"
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* 文件虚拟化列表 */}
      <div ref={containerRef} style={{ minHeight: 400, height: 'calc(100vh - 320px)' }}>
        <List<MediaListRowProps>
          rowComponent={MediaListRow}
          rowProps={{
            files,
            selectedItem,
            onSelectItem,
            onToggleStar,
            onDownload,
            onDelete,
          }}
          rowCount={files.length}
          rowHeight={LIST_ROW_HEIGHT}
          overscanCount={10}
          style={{ height: containerHeight, width: '100%' }}
        />
      </div>
    </div>
  );
};

export default MediaGrid;
