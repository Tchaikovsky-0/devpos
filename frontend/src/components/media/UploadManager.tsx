import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadTask } from './mediaTypes';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface UploadManagerProps {
  uploads: UploadTask[];
  hasActiveUploads: boolean;
  onRetry: (task: UploadTask) => void;
  onCancel?: (taskId: string) => void;
  onClearFinished: () => void;
  onCancelAll?: () => void;
}

const UploadManager: React.FC<UploadManagerProps> = ({
  uploads,
  hasActiveUploads,
  onRetry,
  onCancel,
  onClearFinished,
  onCancelAll,
}) => (
  <AnimatePresence>
    {uploads.length > 0 && (
      <motion.div
        className="border-b border-border px-4 py-2 bg-bg-hover/50"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary font-medium">
            上传任务 ({uploads.filter(u => u.progress === 'done').length}/{uploads.length})
          </span>
          <div className="flex items-center gap-2">
            {hasActiveUploads && onCancelAll && (
              <button
                className="text-xs text-error hover:underline"
                onClick={onCancelAll}
              >
                全部取消
              </button>
            )}
            {!hasActiveUploads && (
              <button
                className="text-xs text-accent hover:underline"
                onClick={onClearFinished}
              >
                清除完成
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {uploads.map(task => (
            <div key={task.id} className="flex items-center gap-2 text-xs">
              <span className="truncate flex-1 text-text-secondary">{task.file.name}</span>
              {task.progress === 'pending' && (
                <div className="flex items-center gap-1">
                  <span className="text-text-disabled">等待中</span>
                  {onCancel && (
                    <button
                      className="text-text-disabled hover:text-error transition-colors"
                      onClick={() => onCancel(task.id)}
                      title="取消"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {task.progress === 'uploading' && (
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-text-secondary w-10 text-right">{task.progressPercent}%</span>
                  {onCancel && (
                    <button
                      className="text-text-disabled hover:text-error transition-colors"
                      onClick={() => onCancel(task.id)}
                      title="取消"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {task.progress === 'done' && <CheckCircle2 className="w-3 h-3 text-success" />}
              {task.progress === 'error' && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-error" />
                  <span className="text-error max-w-[100px] truncate" title={task.errorMsg}>
                    {task.errorMsg || '上传失败'}
                  </span>
                  <button
                    className="text-accent hover:underline ml-1"
                    onClick={() => onRetry(task)}
                  >
                    重试
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default UploadManager;
