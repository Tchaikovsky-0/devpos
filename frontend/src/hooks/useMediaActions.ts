import { useState, useCallback } from 'react';
import {
  useToggleStarMutation,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useMoveToTrashMutation,
} from '../store/api/mediaApi';
import type { MediaItem, FolderItem } from '../types/api/media';
import { toast } from '@/components/ui/use-toast';

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8094';
const API_BASE_URL = (rawBase.startsWith('http') ? rawBase : '') + '/api/v1';

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
  handleDownload: (item: MediaItem) => Promise<void>;
  handleCreateFolder: (name: string) => Promise<void>;
  handleDeleteFolder: (folder: FolderItem) => Promise<void>;
}

export function useMediaActions(options: UseMediaActionsOptions): UseMediaActionsReturn {
  const { selectedItem, onSelectItem, currentFolderId } = options;

  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const [toggleStar] = useToggleStarMutation();
  const [createFolder, { isLoading: creatingFolder }] = useCreateMediaFolderMutation();
  const [deleteFolder] = useDeleteMediaFolderMutation();
  const [moveToTrash] = useMoveToTrashMutation();

  const handleDelete = useCallback(async (item: MediaItem): Promise<void> => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await moveToTrash(item.id).unwrap();
      if (selectedItem?.id === item.id) onSelectItem(null);
      toast({ title: '已移入回收站', description: item.original_name });
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  }, [selectedItem, onSelectItem, moveToTrash]);

  const handleToggleStar = useCallback(async (item: MediaItem): Promise<void> => {
    setActionLoading(prev => ({ ...prev, [item.id]: true }));
    try {
      await toggleStar(item.id).unwrap();
      toast({ title: item.starred ? '已取消收藏' : '已收藏', description: item.original_name });
    } catch (err) {
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [item.id]: false }));
    }
  }, [toggleStar]);

  const handleDownload = useCallback(async (item: MediaItem): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/media/${item.id}/download`;

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({ title: '下载成功', description: item.original_name });
    } catch (err) {
      toast({
        title: '下载失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  }, []);

  const handleCreateFolder = useCallback(async (name: string): Promise<void> => {
    if (!name.trim()) return;
    try {
      await createFolder({
        name: name.trim(),
        parent_id: currentFolderId,
      }).unwrap();
      toast({ title: '文件夹创建成功', description: name.trim() });
    } catch (err) {
      toast({
        title: '创建文件夹失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    }
  }, [currentFolderId, createFolder]);

  const handleDeleteFolder = useCallback(async (folder: FolderItem): Promise<void> => {
    try {
      await deleteFolder(folder.id).unwrap();
      toast({ title: '文件夹已删除', description: folder.name });
    } catch (err) {
      toast({
        title: '删除文件夹失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
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
