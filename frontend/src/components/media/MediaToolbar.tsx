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
  Trash2,
  Sparkles,
} from 'lucide-react';

interface MediaToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mediaType: string;
  onMediaTypeChange: (type: string) => void;
  starredFilter: boolean | undefined;
  onStarredFilterChange: (starred: boolean | undefined) => void;
  breadcrumbs: BreadcrumbItem[];
  onNavigateBreadcrumb: (index: number) => void;
  onCreateFolder: () => void;
  onFiles: (files: FileList | File[]) => void;
  onToggleTrash: () => void;
  isTrashView: boolean;
  onSemanticDedupe: () => void;
  hasSelectedForDedupe: boolean;
}

const MediaToolbar: React.FC<MediaToolbarProps> = ({
  searchQuery,
  onSearchChange,
  mediaType,
  onMediaTypeChange,
  starredFilter,
  onStarredFilterChange,
  breadcrumbs,
  onNavigateBreadcrumb,
  onCreateFolder,
  onFiles,
  onToggleTrash,
  isTrashView,
  onSemanticDedupe,
  hasSelectedForDedupe,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-border gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-accent" />
            {isTrashView ? '回收站' : '媒体库'}
          </h1>

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
                  onClick={() => onNavigateBreadcrumb(idx)}
                >
                  {idx === 0 ? <Home className="w-3.5 h-3.5 inline mr-1" /> : null}
                  {bc.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
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

          <select
            value={mediaType}
            onChange={(e) => onMediaTypeChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-bg-hover border border-border text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="">全部类型</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="audio">音频</option>
            <option value="document">文档</option>
            <option value="other">其他</option>
          </select>

          <button
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              starredFilter
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'text-text-secondary hover:bg-bg-hover'
            )}
            onClick={() => onStarredFilterChange(starredFilter ? undefined : true)}
            title={starredFilter ? '显示全部' : '仅显示收藏'}
          >
            <Star className="w-4 h-4" />
          </button>

          {!isTrashView && (
            <>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={onSemanticDedupe}
                title="智能去重"
              >
                <Sparkles className={cn('w-4 h-4', hasSelectedForDedupe && 'text-accent')} />
              </button>

              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-hover transition-colors"
                onClick={onCreateFolder}
                title="新建文件夹"
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <GlassButton
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                上传
              </GlassButton>
            </>
          )}

          <button
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isTrashView
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'text-text-secondary hover:bg-bg-hover'
            )}
            onClick={onToggleTrash}
            title={isTrashView ? '返回媒体库' : '回收站'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};

export default MediaToolbar;
