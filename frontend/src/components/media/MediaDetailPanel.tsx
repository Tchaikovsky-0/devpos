import React, { useState, useCallback } from 'react';
import {
  X,
  Star,
  Download,
  Trash2,
  FolderInput,
  FileImage,
  FileVideo,
  FileText,
  File,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes, formatDate } from '@/lib/format';
import type { MediaItem } from '@/store/api/mediaApi';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

interface MediaDetailPanelProps {
  file: MediaItem | null;
  onClose: () => void;
  onStar: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: (id: number) => void;
  onDownload: (id: number) => void;
  onUpdateDescription?: (id: number, description: string) => void;
  updating?: boolean;
}

function FileIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'image':
      return <FileImage className={cn('text-accent', className)} />;
    case 'video':
      return <FileVideo className={cn('text-accent-soft', className)} />;
    case 'document':
      return <FileText className={cn('text-orange-400', className)} />;
    default:
      return <File className={cn('text-gray-400', className)} />;
  }
}

interface MetaRowProps {
  label: string;
  children: React.ReactNode;
}

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-text-tertiary shrink-0 w-16">{label}</span>
      <span className="text-xs text-text-secondary flex-1 text-right">{children}</span>
    </div>
  );
}

export const MediaDetailPanel: React.FC<MediaDetailPanelProps> = ({
  file,
  onClose,
  onStar,
  onDelete,
  onMove,
  onDownload,
  onUpdateDescription,
  updating = false,
}) => {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStartEdit = useCallback(() => {
    if (file) {
      setDescValue(file.description ?? '');
      setEditingDesc(true);
    }
  }, [file]);

  const handleSaveDesc = useCallback(() => {
    if (file && onUpdateDescription) {
      onUpdateDescription(file.id, descValue);
    }
    setEditingDesc(false);
  }, [file, descValue, onUpdateDescription]);

  const handleCopyUrl = useCallback(() => {
    if (file?.url) {
      navigator.clipboard.writeText(file.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [file]);

  if (!file) return null;

  return (
    <Panel
      variant="glass"
      className="h-full w-72 shrink-0 flex flex-col"
      bodyClassName="flex-1 flex flex-col gap-4 p-4"
    >
      {/* Preview */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-bg-tertiary/30 flex items-center justify-center">
        {file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.original_name}
            className="w-full h-full object-contain"
          />
        ) : (
          <FileIcon type={file.type} className="h-16 w-16" />
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-base/60 backdrop-blur-sm text-text-tertiary hover:text-text-primary hover:bg-bg-base/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filename */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-primary truncate" title={file.original_name}>
          {file.original_name}
        </h3>
        {file.filename !== file.original_name && (
          <p className="text-[10px] text-text-tertiary truncate" title={file.filename}>
            {file.filename}
          </p>
        )}
      </div>

      {/* Meta info */}
      <div className="space-y-0">
        <MetaRow label="类型">{file.mime_type}</MetaRow>
        <MetaRow label="大小">{formatBytes(file.size)}</MetaRow>
        <MetaRow label="上传时间">{formatDate(file.created_at)}</MetaRow>
        <MetaRow label="更新时间">{formatDate(file.updated_at)}</MetaRow>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">描述</span>
          {!editingDesc && (
            <button
              onClick={handleStartEdit}
              className="text-[10px] text-accent hover:underline"
            >
              编辑
            </button>
          )}
        </div>
        {editingDesc ? (
          <div className="space-y-1.5">
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-bg-tertiary/30 border border-border/50 text-xs text-text-primary p-2 resize-none outline-none focus:border-accent/50 transition-colors"
              placeholder="添加文件描述..."
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDesc}
                loading={updating}
                className="flex-1"
              >
                保存
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingDesc(false)}
              >
                取消
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-secondary min-h-[2.5rem]">
            {file.description || '暂无描述'}
          </p>
        )}
      </div>

      {/* Copy URL */}
      <button
        onClick={handleCopyUrl}
        className="flex items-center gap-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-success">已复制</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>复制链接</span>
          </>
        )}
      </button>

      {/* Actions */}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<Star className={cn('h-3.5 w-3.5', file.starred && 'text-yellow-400')} />}
          onClick={() => onStar(file.id)}
          className={cn(file.starred && 'border-yellow-400/30 text-yellow-400')}
        >
          {file.starred ? '已收藏' : '收藏'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={() => onDownload(file.id)}
        >
          下载
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<FolderInput className="h-3.5 w-3.5" />}
          onClick={() => onMove(file.id)}
        >
          移动
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<Trash2 className="h-3.5 w-3.5 text-error" />}
          onClick={() => onDelete(file.id)}
          className="text-error hover:border-error/30"
        >
          删除
        </Button>
      </div>
    </Panel>
  );
};
