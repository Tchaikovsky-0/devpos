import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useListMediaQuery,
  useListTrashQuery,
  useUploadMediaMutation,
  useSemanticDedupeMutation,
  useListMediaFoldersQuery,
} from '../store/api/mediaApi';
import { useMediaActions } from '../hooks/useMediaActions';
import MediaToolbar from '../components/media/MediaToolbar';
import MediaGrid from '../components/media/MediaGrid';
import MediaSideDetail from '../components/media/MediaSideDetail';
import UploadManager from '../components/media/UploadManager';
import { SemanticDedupeDialog } from '../components/media/SemanticDedupeDialog';
import { Button } from '@/components/ui/Button';
import { Trash2, X } from 'lucide-react';
import type { MediaItem, FolderItem } from '../types/api/media';
import type { UploadTask, BreadcrumbItem } from '../components/media/mediaTypes';

const MediaLibrary: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const alertId = searchParams.get('alert_id');
  const alertTimestamp = searchParams.get('timestamp');
  const alertStreamId = searchParams.get('stream_id');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaType, setMediaType] = useState<string>('');
  const [starredFilter, setStarredFilter] = useState<boolean | undefined>(undefined);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: '根目录' }]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [showSemanticDedupe, setShowSemanticDedupe] = useState(false);
  const [selectedForDedupe, setSelectedForDedupe] = useState<number[]>([]);

  const hasActiveUploads = uploads.some(u => u.progress === 'uploading' || u.progress === 'pending');
  const uploadQueueRef = useRef<UploadTask[]>([]);
  const isProcessingRef = useRef(false);
  const MAX_CONCURRENT = 3;

  const { data: mediaData, isLoading: mediaLoading } = useListMediaQuery({
    page,
    page_size: pageSize,
    type: mediaType || undefined,
    folder_id: currentFolderId !== null ? currentFolderId : undefined,
    search: debouncedSearch || undefined,
    starred: starredFilter,
    trashed: false,
  });

  const { data: trashData, isLoading: trashLoading } = useListTrashQuery({
    page,
    page_size: pageSize,
  }, { skip: !showTrash });

  const { data: foldersData } = useListMediaFoldersQuery({
    parent_id: currentFolderId !== null ? currentFolderId : null,
  });

  const [uploadMedia] = useUploadMediaMutation();
  const [semanticDedupe] = useSemanticDedupeMutation();

  const {
    actionLoading,
    handleDelete,
    handleToggleStar,
    handleDownload,
    handleCreateFolder,
    handleDeleteFolder,
  } = useMediaActions({
    selectedItem,
    onSelectItem: setSelectedItem,
    currentFolderId,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const processUploadQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (uploadQueueRef.current.length > 0) {
      const batch = uploadQueueRef.current.splice(0, MAX_CONCURRENT);
      const promises = batch.map(async (task) => {
        setUploads(prev => prev.map(u => u.id === task.id ? { ...u, progress: 'uploading' as const, progressPercent: 0 } : u));
        try {
          const formData = new FormData();
          formData.append('file', task.file);
          if (task.folderId !== null) {
            formData.append('folder_id', String(task.folderId));
          }
          await uploadMedia(formData).unwrap();
          setUploads(prev => prev.map(u => u.id === task.id ? { ...u, progress: 'done' as const, progressPercent: 100 } : u));
        } catch (err) {
          setUploads(prev => prev.map(u => u.id === task.id ? {
            ...u,
            progress: 'error' as const,
            errorMsg: err instanceof Error ? err.message : '上传失败',
          } : u));
        }
      });
      await Promise.all(promises);
    }

    isProcessingRef.current = false;
  }, [uploadMedia]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newTasks: UploadTask[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      progress: 'pending',
      progressPercent: 0,
      folderId: currentFolderId,
    }));
    setUploads(prev => [...prev, ...newTasks]);
    uploadQueueRef.current.push(...newTasks);
    processUploadQueue();
  }, [currentFolderId, processUploadQueue]);

  const handleRetryUpload = useCallback((task: UploadTask) => {
    setUploads(prev => prev.map(u => u.id === task.id ? { ...u, progress: 'pending' as const, errorMsg: undefined } : u));
    uploadQueueRef.current.push(task);
    processUploadQueue();
  }, [processUploadQueue]);

  const handleClearFinished = useCallback(() => {
    setUploads(prev => prev.filter(u => u.progress === 'uploading' || u.progress === 'pending'));
  }, []);

  const handleNavigateBreadcrumb = useCallback((index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    const target = newBreadcrumbs[newBreadcrumbs.length - 1];
    setCurrentFolderId(target.id);
    setPage(1);
    setSelectedItem(null);
  }, [breadcrumbs]);

  const handleSemanticDedupe = useCallback(() => {
    if (selectedForDedupe.length > 0) {
      setShowSemanticDedupe(true);
    } else {
      const allIds = (mediaData?.data?.items || []).map((item: MediaItem) => item.id);
      if (allIds.length < 2) {
        alert('当前文件夹文件不足 2 个，无法去重');
        return;
      }
      setSelectedForDedupe(allIds);
      setShowSemanticDedupe(true);
    }
  }, [selectedForDedupe, mediaData]);

  const handleConfirmSemanticDedupe = useCallback(async (ids: number[]) => {
    try {
      await semanticDedupe({ ids }).unwrap();
      setShowSemanticDedupe(false);
      setSelectedForDedupe([]);
    } catch (err) {
      console.error('语义去重失败:', err);
    }
  }, [semanticDedupe]);

  const handleToggleTrash = useCallback(() => {
    setShowTrash(prev => !prev);
    setPage(1);
    setSelectedItem(null);
    setBreadcrumbs([{ id: null, name: '根目录' }]);
    setCurrentFolderId(null);
  }, []);

  const currentData = showTrash ? trashData : mediaData;
  const currentLoading = showTrash ? trashLoading : mediaLoading;

  return (
    <div className="flex flex-col h-full">
      {alertId && alertTimestamp && alertStreamId && (
        <div className="mx-4 mt-2 border border-accent/20 bg-accent/5 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            来自告警 #<strong>{alertId}</strong> 的媒体文件
            {alertStreamId && `（流: ${alertStreamId}）`}
            {alertTimestamp && ` · ${new Date(Number(alertTimestamp)).toLocaleString()}`}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <UploadManager
        uploads={uploads}
        hasActiveUploads={hasActiveUploads}
        onRetry={handleRetryUpload}
        onClearFinished={handleClearFinished}
      />

      <MediaToolbar
        searchQuery={searchQuery}
        onSearchChange={(q: string) => setSearchQuery(q)}
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        starredFilter={starredFilter}
        onStarredFilterChange={setStarredFilter}
        breadcrumbs={breadcrumbs}
        onNavigateBreadcrumb={handleNavigateBreadcrumb}
        onCreateFolder={() => handleCreateFolder('新建文件夹')}
        onFiles={handleFiles}
        onToggleTrash={handleToggleTrash}
        isTrashView={showTrash}
        onSemanticDedupe={handleSemanticDedupe}
        hasSelectedForDedupe={selectedForDedupe.length > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {showTrash && (
            <div className="px-4 py-2 bg-yellow-500/5 border-b border-border flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-text-secondary">回收站 · 文件将在 30 天后自动清除</span>
            </div>
          )}
          {currentLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-text-secondary">加载中...</div>
            </div>
          ) : (
            <MediaGrid
              files={(currentData?.data?.items || []) as MediaItem[]}
              folders={(foldersData?.data || []) as FolderItem[]}
              viewMode="grid"
              loading={false}
              error={null}
              selectedItem={selectedItem}
              isDragging={false}
              page={page}
              totalPages={Math.ceil((currentData?.data?.total || 0) / pageSize)}
              totalFiles={currentData?.data?.total || 0}
              onSelectItem={setSelectedItem}
              onNavigateToFolder={(folderId: number, folderName: string) => {
                setCurrentFolderId(folderId);
                setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
                setPage(1);
                setSelectedItem(null);
              }}
              onDeleteFolder={handleDeleteFolder}
              onToggleStar={handleToggleStar}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onPageChange={setPage}
              onRefresh={() => {}}
            />
          )}
        </div>

        {selectedItem && (
          <>
            <div className="hidden lg:block w-80 border-l border-border overflow-y-auto">
              <MediaSideDetail
                item={selectedItem}
                actionLoading={actionLoading}
                onClose={() => setSelectedItem(null)}
                onToggleStar={handleToggleStar}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            </div>
            <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSelectedItem(null)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-bg border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
                <MediaSideDetail
                  item={selectedItem}
                  actionLoading={actionLoading}
                  onClose={() => setSelectedItem(null)}
                  onToggleStar={handleToggleStar}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <SemanticDedupeDialog
        open={showSemanticDedupe}
        onOpenChange={setShowSemanticDedupe}
        selectedIds={selectedForDedupe}
        onConfirm={handleConfirmSemanticDedupe}
      />
    </div>
  );
};

export default MediaLibrary;
