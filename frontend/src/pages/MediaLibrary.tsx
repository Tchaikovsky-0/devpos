import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useListMediaQuery,
  useListMediaFoldersQuery,
  useUploadMediaMutation,
} from '../store/api/mediaApi';
import type { MediaItem } from '../types/api/media';
import type { BreadcrumbItem, UploadTask } from '../components/media/mediaTypes';
import { useMediaActions } from '../hooks/useMediaActions';
import MediaToolbar from '../components/media/MediaToolbar';
import MediaGrid from '../components/media/MediaGrid';
import MediaSideDetail from '../components/media/MediaSideDetail';
import UploadManager from '../components/media/UploadManager';

/**
 * MediaLibrary - 媒体库页面容器（RTK Query 版）
 * 完整支持文件/文件夹 CRUD、上传、搜索、星标、分页
 */
const MediaLibrary: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlAlertId = searchParams.get('alert_id');
  const urlTimestamp = searchParams.get('timestamp');
  const urlStreamId = searchParams.get('stream_id');
  const hasAlertContext = !!(urlAlertId || urlTimestamp || urlStreamId);

  // ---- 分页 & 过滤参数 ----
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // ---- 导航状态 ----
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: '全部文件' }]);

  // ---- UI 状态 ----
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | ''>('');
  const [showStarred, setShowStarred] = useState(false);

  // ---- 上传 ----
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- 新建文件夹 ----
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // ==========================================================================
  // RTK Query - 数据获取
  // ==========================================================================

  const listParams = useMemo(() => ({
    page,
    page_size: pageSize,
    folder_id: currentFolderId,
    type: filterType || undefined,
    search: searchQuery || undefined,
    starred: showStarred || undefined,
  }), [page, pageSize, currentFolderId, filterType, searchQuery, showStarred]);

  const {
    data: mediaResponse,
    isLoading: filesLoading,
    isFetching: filesFetching,
    error: filesError,
    refetch: refetchFiles,
  } = useListMediaQuery(listParams);

  const {
    data: foldersResponse,
    refetch: refetchFolders,
  } = useListMediaFoldersQuery({ parent_id: currentFolderId ?? undefined });

  // 全部文件夹（平铺，用于面包屑追溯）
  const { data: allFoldersResponse } = useListMediaFoldersQuery({ all: true });

  // ---- 数据提取 ----
  const files = mediaResponse?.data?.items ?? [];
  const totalFiles = mediaResponse?.data?.total ?? 0;
  const folders = foldersResponse?.data ?? [];
  const allFolders = allFoldersResponse?.data ?? [];
  const loading = filesLoading;
  const error = filesError ? ('data' in filesError ? String((filesError as Record<string, unknown>).data) : '加载媒体库数据失败') : null;

  // ==========================================================================
  // RTK Query - 上传 Mutation
  // ==========================================================================

  const [uploadMedia] = useUploadMediaMutation();

  // ---- 操作 Hook ----
  const {
    actionLoading,
    creatingFolder,
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

  // ==========================================================================
  // 刷新
  // ==========================================================================

  const handleRefresh = useCallback((): void => {
    refetchFiles();
    refetchFolders();
  }, [refetchFiles, refetchFolders]);

  // ==========================================================================
  // 文件夹导航
  // ==========================================================================

  const navigateToFolder = useCallback((folderId: number | null, folderName: string): void => {
    setCurrentFolderId(folderId);
    setSelectedItem(null);
    setPage(1);
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: '全部文件' }]);
    } else {
      const path: BreadcrumbItem[] = [{ id: null, name: '全部文件' }];
      const buildPath = (id: number): void => {
        const folder = allFolders.find(f => f.id === id);
        if (folder) {
          if (folder.parent_id !== null) buildPath(folder.parent_id);
          path.push({ id: folder.id, name: folder.name });
        }
      };
      buildPath(folderId);
      if (path.length === 1) path.push({ id: folderId, name: folderName });
      setBreadcrumbs(path);
    }
  }, [allFolders]);

  const navigateToBreadcrumb = useCallback((item: BreadcrumbItem): void => {
    setCurrentFolderId(item.id);
    setSelectedItem(null);
    setPage(1);
    if (item.id === null) {
      setBreadcrumbs([{ id: null, name: '全部文件' }]);
    } else {
      setBreadcrumbs(prev => {
        const idx = prev.findIndex(b => b.id === item.id);
        return idx >= 0 ? prev.slice(0, idx + 1) : prev;
      });
    }
  }, []);

  // ==========================================================================
  // 上传
  // ==========================================================================

  const processUpload = useCallback(async (file: File, taskId: string): Promise<void> => {
    setUploads(prev => prev.map(u => u.id === taskId ? { ...u, progress: 'uploading' } : u));
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId !== null) {
        formData.append('folder_id', String(currentFolderId));
      }
      await uploadMedia(formData).unwrap();
      setUploads(prev => prev.map(u => u.id === taskId ? { ...u, progress: 'done' } : u));
      // RTK Query invalidatesTags 自动刷新列表，无需手动 setFiles
    } catch (err) {
      setUploads(prev => prev.map(u =>
        u.id === taskId
          ? { ...u, progress: 'error', errorMsg: err instanceof Error ? err.message : '上传失败' }
          : u
      ));
    }
  }, [currentFolderId, uploadMedia]);

  const handleFilesSelected = useCallback((fileList: FileList | File[]): void => {
    const newTasks: UploadTask[] = Array.from(fileList).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      progress: 'pending' as const,
    }));
    setUploads(prev => [...prev, ...newTasks]);
    newTasks.forEach(task => processUpload(task.file, task.id));
  }, [processUpload]);

  const retryUpload = useCallback((task: UploadTask): void => {
    processUpload(task.file, task.id);
  }, [processUpload]);

  const clearFinishedUploads = useCallback((): void => {
    setUploads(prev => prev.filter(u => u.progress !== 'done'));
  }, []);

  // ---- 拖拽上传 ----
  const handleDragOver = useCallback((e: React.DragEvent): void => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent): void => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  // ==========================================================================
  // 派生状态
  // ==========================================================================
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize));
  const hasActiveUploads = uploads.some(u => u.progress === 'pending' || u.progress === 'uploading');

  // ==========================================================================
  // 渲染
  // ==========================================================================
  return (
    <div
      className="h-full flex flex-col bg-bg-primary"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Alert Context Banner */}
      {hasAlertContext && (
        <div className="px-4 py-2 bg-accent-muted border-b border-accent/30 flex items-center gap-2 text-sm text-accent">
          <span>ℹ️</span>
          <span>
            正在查看告警关联的媒体文件
            {urlAlertId && <span className="ml-1 font-mono text-xs">(告警 ID: {urlAlertId})</span>}
          </span>
        </div>
      )}
      <MediaToolbar
        breadcrumbs={breadcrumbs}
        searchQuery={searchQuery}
        filterType={filterType}
        showStarred={showStarred}
        viewMode={viewMode}
        loading={loading || filesFetching}
        showNewFolder={showNewFolder}
        newFolderName={newFolderName}
        creatingFolder={creatingFolder}
        onNavigateToBreadcrumb={navigateToBreadcrumb}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        onFilterTypeChange={(t) => { setFilterType(t); setPage(1); }}
        onToggleStarred={() => { setShowStarred(s => !s); setPage(1); }}
        onToggleViewMode={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
        onRefresh={handleRefresh}
        onShowNewFolder={() => setShowNewFolder(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        onNewFolderNameChange={setNewFolderName}
        onCreateFolder={() => { handleCreateFolder(newFolderName).then(() => { setNewFolderName(''); setShowNewFolder(false); }); }}
        onCancelNewFolder={() => { setShowNewFolder(false); setNewFolderName(''); }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      <UploadManager
        uploads={uploads}
        hasActiveUploads={hasActiveUploads}
        onRetry={retryUpload}
        onClearFinished={clearFinishedUploads}
      />

      <div className="flex-1 flex overflow-hidden">
        <MediaGrid
          files={files}
          folders={folders}
          viewMode={viewMode}
          loading={loading}
          error={error}
          selectedItem={selectedItem}
          isDragging={isDragging}
          page={page}
          totalPages={totalPages}
          totalFiles={totalFiles}
          onSelectItem={setSelectedItem}
          onNavigateToFolder={(id, name) => navigateToFolder(id, name)}
          onDeleteFolder={handleDeleteFolder}
          onToggleStar={handleToggleStar}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onPageChange={setPage}
          onRefresh={handleRefresh}
        />

        <MediaSideDetail
          item={selectedItem}
          actionLoading={actionLoading}
          onClose={() => setSelectedItem(null)}
          onDownload={handleDownload}
          onToggleStar={handleToggleStar}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default MediaLibrary;
