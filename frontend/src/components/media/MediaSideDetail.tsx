import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '../ui/GlassButton';
import { formatMediaDate, formatFileSize, getFileIcon } from './mediaHelpers';
import type { MediaItem } from '../../types/api/media';
import { X, Star, StarOff, Trash2, Download } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MediaSideDetailProps {
  item: MediaItem | null;
  actionLoading: Record<number, boolean>;
  onClose: () => void;
  onDownload: (item: MediaItem) => void;
  onToggleStar: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

// ---------------------------------------------------------------------------
// InfoRow
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-xs text-text-disabled w-16 shrink-0 pt-0.5">{label}</span>
    <span className="text-xs text-text-secondary break-all">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MediaSideDetail: React.FC<MediaSideDetailProps> = ({
  item,
  actionLoading,
  onClose,
  onDownload,
  onToggleStar,
  onDelete,
}) => (
  <AnimatePresence>
    {item && (
      <motion.div
        className="w-80 border-l border-border bg-bg-primary flex flex-col shrink-0"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary truncate">{item.original_name}</h3>
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:bg-bg-hover"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-bg-tertiary mb-4">
            {item.type === 'image' ? (
              <img src={item.url} alt={item.original_name} className="w-full h-full object-contain" />
            ) : item.type === 'video' ? (
              <video src={item.url} controls className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {getFileIcon(item.type)}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="space-y-3">
            <InfoRow label="文件名" value={item.original_name} />
            <InfoRow label="类型" value={item.mime_type} />
            <InfoRow label="大小" value={formatFileSize(item.size)} />
            <InfoRow label="上传时间" value={formatMediaDate(item.created_at)} />
            <InfoRow label="更新时间" value={formatMediaDate(item.updated_at)} />
            {item.description && <InfoRow label="描述" value={item.description} />}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-6">
            <GlassButton
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => onDownload(item)}
              fullWidth
            >
              下载
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              leftIcon={item.starred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              onClick={() => onToggleStar(item)}
              loading={actionLoading[item.id]}
            >
              {item.starred ? '取消' : '收藏'}
            </GlassButton>
            <GlassButton
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => onDelete(item)}
              loading={actionLoading[item.id]}
            >
              删除
            </GlassButton>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default MediaSideDetail;
