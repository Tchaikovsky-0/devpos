import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UploadTask } from './mediaTypes';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UploadManagerProps {
  uploads: UploadTask[];
  hasActiveUploads: boolean;
  onRetry: (task: UploadTask) => void;
  onClearFinished: () => void;
}

const UploadManager: React.FC<UploadManagerProps> = ({
  uploads,
  hasActiveUploads,
  onRetry,
  onClearFinished,
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
              {task.progress === 'pending' && <span className="text-text-disabled">等待中</span>}
              {task.progress === 'uploading' && (
                <div className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-accent" />
                  <span className="text-text-secondary w-10 text-right">{task.progressPercent}%</span>
                </div>
              )}
              {task.progress === 'done' && <CheckCircle2 className="w-3 h-3 text-success" />}
              {task.progress === 'error' && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-error" />
                  <button
                    className="text-accent hover:underline"
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
