import { useState, useCallback } from 'react';
import {
  useDeleteMediaMutation,
  useToggleStarMutation,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
} from '../store/api/mediaApi';
import type { MediaItem, FolderItem } from '../types/api/media';

interface UseMediaActionsOptions {
  selectedItem: MediaItem | null;
  onSelectItem: (item: MediaItem | null) => void;
  currentFolderId: number | null;
}

interface UseMediaActionsReturn {
  actionLoading: Record<number, boolean>;
  creatingFolder: boolean;
  handleDelete: (item: MediaItem) => Promise<void>;
  handleToggleStar: (item: MediaItem) => Promise<void>;
  handleDownload: (item: MediaItem) => void;
  handleCreateFolder: (name: string) => Promise<void>;
  handleDeleteFolder: (folder: FolderItem) => Promise<void>;
}

/**
 * 媒体操作 Hook（RTK Query 版）
 * 收藏/删除/下载/创建文件夹/删除文件夹
 * RTK Query 的 invalidatesTags 自动刷新列表，无需手动更新本地状态
 */
export function useMediaActions(options: UseMediaActionsOptions): UseMediaActionsReturn {
  const { selectedItem, onSelectItem, currentFolderId } = options;

  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const [deleteMedia] = useDeleteMediaMutation();
  const [toggleStar] = useToggleStarMutation();
  const [createFolder, { isLoading: creatingFolder }] = useCreateMediaFolderMutation();
  const [deleteFolder] = useDeleteMediaFolderMutation();

  /** 删除文件 */
  const handleDelete = useCallback(async (item: MediaItem): Promise<void> => {
    if (!confirm(`确定删除「${item.original_name}」？`)) return;
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await deleteMedia(item.id).unwrap();
      if (selectedItem?.id === item.id) onSelectItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  }, [selectedItem, onSelectItem, deleteMedia]);

  /** 切换星标 */
  const handleToggleStar = useCallback(async (item: MediaItem): Promise<void> => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await toggleStar(item.id).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  }, [toggleStar]);

  /** 下载文件 */
  const handleDownload = useCallback((item: MediaItem): void => {
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.original_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /** 创建文件夹 */
  const handleCreateFolder = useCallback(async (name: string): Promise<void> => {
    if (!name.trim()) return;
    try {
      await createFolder({
        name: name.trim(),
        parent_id: currentFolderId,
      }).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建文件夹失败');
    }
  }, [currentFolderId, createFolder]);

  /** 删除文件夹 */
  const handleDeleteFolder = useCallback(async (folder: FolderItem): Promise<void> => {
    if (!confirm(`确定删除文件夹「${folder.name}」及其内容？`)) return;
    try {
      await deleteFolder(folder.id).unwrap();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除文件夹失败');
    }
  }, [deleteFolder]);

  return {
    actionLoading,
    creatingFolder,
    handleDelete,
    handleToggleStar,
    handleDownload,
    handleCreateFolder,
    handleDeleteFolder,
  };
}
