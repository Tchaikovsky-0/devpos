import { useState, useCallback, useRef } from 'react';
import type { UploadTask } from '@/components/media/mediaTypes';

const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8094';
const API_BASE_URL = (rawBase.startsWith('http') ? rawBase : '') + '/api/v1';

interface UseMediaUploadOptions {
  onUploadComplete?: () => void;
  maxConcurrent?: number;
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const { onUploadComplete, maxConcurrent = 3 } = options;

  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const uploadQueueRef = useRef<UploadTask[]>([]);
  const isProcessingRef = useRef(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const hasActiveUploads = uploads.some(u => u.progress === 'uploading' || u.progress === 'pending');

  const uploadFile = useCallback(async (task: UploadTask, folderId: number | null): Promise<void> => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      abortControllersRef.current.set(task.id, controller);

      const formData = new FormData();
      formData.append('file', task.file);
      if (folderId !== null) {
        formData.append('folder_id', String(folderId));
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/media/upload`);

      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u =>
            u.id === task.id ? { ...u, progress: 'uploading' as const, progressPercent: percent } : u
          ));
        }
      });

      xhr.addEventListener('load', () => {
        abortControllersRef.current.delete(task.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploads(prev => prev.map(u =>
            u.id === task.id ? { ...u, progress: 'done' as const, progressPercent: 100 } : u
          ));
          resolve();
        } else {
          let errorMsg = '上传失败';
          try {
            const resp = JSON.parse(xhr.responseText);
            errorMsg = resp.message || resp.error || errorMsg;
          } catch {
            errorMsg = `HTTP ${xhr.status}: ${xhr.statusText}`;
          }
          setUploads(prev => prev.map(u =>
            u.id === task.id ? { ...u, progress: 'error' as const, errorMsg } : u
          ));
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        abortControllersRef.current.delete(task.id);
        setUploads(prev => prev.map(u =>
          u.id === task.id ? { ...u, progress: 'error' as const, errorMsg: '网络连接失败' } : u
        ));
        reject(new Error('网络连接失败'));
      });

      xhr.addEventListener('abort', () => {
        abortControllersRef.current.delete(task.id);
        setUploads(prev => prev.filter(u => u.id !== task.id));
        resolve();
      });

      xhr.send(formData);
    });
  }, []);

  const processUploadQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (uploadQueueRef.current.length > 0) {
      const batch = uploadQueueRef.current.splice(0, maxConcurrent);
      const promises = batch.map(async (task) => {
        try {
          await uploadFile(task, task.folderId);
        } catch {
          // Error already handled in uploadFile
        }
      });
      await Promise.all(promises);
    }

    isProcessingRef.current = false;
    onUploadComplete?.();
  }, [uploadFile, maxConcurrent, onUploadComplete]);

  const handleFiles = useCallback((files: FileList | File[], folderId: number | null = null) => {
    const fileArray = Array.from(files);
    const newTasks: UploadTask[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      progress: 'pending',
      progressPercent: 0,
      folderId,
    }));
    setUploads(prev => [...prev, ...newTasks]);
    uploadQueueRef.current.push(...newTasks);
    processUploadQueue();
  }, [processUploadQueue]);

  const handleRetry = useCallback((task: UploadTask) => {
    setUploads(prev => prev.map(u =>
      u.id === task.id ? { ...u, progress: 'pending' as const, errorMsg: undefined, progressPercent: 0 } : u
    ));
    uploadQueueRef.current.push(task);
    processUploadQueue();
  }, [processUploadQueue]);

  const handleCancel = useCallback((taskId: string) => {
    const controller = abortControllersRef.current.get(taskId);
    if (controller) {
      controller.abort();
    }
  }, []);

  const handleClearFinished = useCallback(() => {
    setUploads(prev => prev.filter(u => u.progress === 'uploading' || u.progress === 'pending'));
  }, []);

  const handleCancelAll = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    uploadQueueRef.current = [];
    isProcessingRef.current = false;
    setUploads(prev => prev.filter(u => u.progress === 'uploading'));
  }, []);

  return {
    uploads,
    hasActiveUploads,
    handleFiles,
    handleRetry,
    handleCancel,
    handleClearFinished,
    handleCancelAll,
  };
}
