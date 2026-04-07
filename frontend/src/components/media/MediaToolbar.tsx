import React from 'react';
import { cn } from '../../lib/utils';
import GlassButton from '../ui/GlassButton';
import type { BreadcrumbItem } from './mediaTypes';
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Home,
  Upload,
  Search,
  Star,
  Grid,
  List,
  RefreshCw,
  X,
  FolderIcon,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MediaToolbarProps {
  breadcrumbs: BreadcrumbItem[];
  searchQuery: string;
  filterType: string;
  showStarred: boolean;
  viewMode: 'grid' | 'list';
  loading: boolean;
  showNewFolder: boolean;
  newFolderName: string;
  creatingFolder: boolean;
  onNavigateToBreadcrumb: (item: BreadcrumbItem) => void;
  onSearchChange: (query: string) => void;
  onFilterTypeChange: (type: string) => void;
  onToggleStarred: () => void;
  onToggleViewMode: () => void;
  onRefresh: () => void;
  onShowNewFolder: () => void;
  onUploadClick: () => void;
  onNewFolderNameChange: (name: string) => void;
  onCreateFolder: () => void;
  onCancelNewFolder: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MediaToolbar: React.FC<MediaToolbarProps> = ({
  breadcrumbs,
  searchQuery,
  filterType,
  showStarred,
  viewMode,
  loading,
  showNewFolder,
  newFolderName,
  creatingFolder,
  onNavigateToBreadcrumb,
  onSearchChange,
  onFilterTypeChange,
  onToggleStarred,
  onToggleViewMode,
  onRefresh,
  onShowNewFolder,
  onUploadClick,
  onNewFolderNameChange,
  onCreateFolder,
  onCancelNewFolder,
}) => (
  <>
    {/* ===== Header ===== */}
    <header className="flex items-center justify-between px-4 py-3 border-b border-border gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-accent" />
          媒体库
        </h1>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.id ?? 'root'}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-disabled" />}
              <button
                className={cn(
                  'px-2 py-1 rounded hover:bg-bg-hover transition-colors',
                  idx === breadcrumbs.length - 1
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary'
                )}
                onClick={() => onNavigateToBreadcrumb(bc)}
              >
                {idx === 0 ? <Home className="w-3.5 h-3.5 inline mr-1" /> : null}
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索文件..."
            className={cn(
              'w-48 pl-9 pr-3 py-1.5 rounded-lg text-sm',
              'bg-bg-hover text-text-secondary placeholder:text-text-disabled',
              'border border-border focus:outline-none focus:border-accent transition-colors'
            )}
          />
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-bg-hover border border-border text-text-secondary focus:outline-none focus:border-accent"
        >
          <option value="">全部类型</option>
          <option value="image">图片</option>
          <option value="video">视频</option>
          <option value="audio">音频</option>
          <option value="document">文档</option>
          <option value="other">其他</option>
        </select>

        {/* Star filter */}
        <button
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            showStarred
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'text-text-secondary hover:bg-bg-hover'
          )}
          onClick={onToggleStarred}
          title={showStarred ? '显示全部' : '仅显示收藏'}
        >
          <Star className="w-4 h-4" />
        </button>

        {/* View mode */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
          onClick={onToggleViewMode}
          title={viewMode === 'grid' ? '列表视图' : '网格视图'}
        >
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
        </button>

        {/* Refresh */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
          onClick={onRefresh}
          title="刷新"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>

        {/* New folder */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
          onClick={onShowNewFolder}
          title="新建文件夹"
        >
          <FolderPlus className="w-4 h-4" />
        </button>

        {/* Upload */}
        <GlassButton
          variant="primary"
          size="sm"
          leftIcon={<Upload className="w-4 h-4" />}
          onClick={onUploadClick}
        >
          上传
        </GlassButton>
      </div>
    </header>

    {/* ===== New Folder Dialog ===== */}
    {showNewFolder && (
      <div className="border-b border-border px-4 py-3 bg-bg-hover/30 flex items-center gap-3">
        <FolderIcon className="w-5 h-5 text-accent" />
        <input
          autoFocus
          value={newFolderName}
          onChange={(e) => onNewFolderNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCreateFolder();
            if (e.key === 'Escape') onCancelNewFolder();
          }}
          placeholder="文件夹名称..."
          className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-bg-primary border border-border text-text-primary focus:outline-none focus:border-accent"
        />
        <GlassButton variant="primary" size="sm" onClick={onCreateFolder} loading={creatingFolder}>
          创建
        </GlassButton>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover"
          onClick={onCancelNewFolder}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )}
  </>
);

export default MediaToolbar;
