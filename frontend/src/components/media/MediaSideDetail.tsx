import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '../ui/GlassButton';
import { formatMediaDate, formatFileSize, getFileIcon } from './mediaHelpers';
import type { MediaItem } from '../../types/api/media';
import { X, Star, StarOff, Trash2, Download, Tag, Bot, Eye, Loader2 } from 'lucide-react';
import { AnnotationPanel } from './AnnotationPanel';
import {
  useDefectAnalyzeMediaMutation,
  useAnalyzeMediaMutation,
} from '../../store/api/mediaApi';
import { toast } from '@/components/ui/use-toast';

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
}) => {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [analyzingDefect, setAnalyzingDefect] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  const [defectAnalyze] = useDefectAnalyzeMediaMutation();
  const [aiAnalyze] = useAnalyzeMediaMutation();

  const handleDefectAnalyze = async () => {
    if (!item) return;
    setAnalyzingDefect(true);
    try {
      const result = await defectAnalyze({ media_ids: [item.id] }).unwrap();
      const defectCount = result.reduce((sum: number, r: { defects: unknown[] }) => sum + (r.defects?.length || 0), 0);
      toast({
        title: 'YOLO 缺陷分析完成',
        description: defectCount > 0 ? `检测到 ${defectCount} 个缺陷` : '未检测到缺陷',
      });
    } catch (err) {
      toast({
        title: '缺陷分析失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingDefect(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!item) return;
    setAnalyzingAI(true);
    try {
      await aiAnalyze({ media_ids: [item.id], analysis_type: 'general' }).unwrap();
      toast({
        title: 'AI 分析完成',
        description: 'OpenClaw 已生成分析报告',
      });
    } catch (err) {
      toast({
        title: 'AI 分析失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
  <AnimatePresence>
    {item && (
      <motion.div
        className="w-80 border-l border-border bg-bg-primary flex flex-col shrink-0 overflow-hidden"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 320, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-medium text-text-primary truncate">{item.original_name}</h3>
          <button
            className="w-7 h-7 rounded flex items-center justify-center text-text-secondary hover:bg-bg-hover shrink-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Preview */}
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

          {/* AI Analysis */}
          <div className="flex items-center gap-2 mt-3">
            <GlassButton
              variant="secondary"
              size="sm"
              leftIcon={analyzingDefect ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              onClick={handleDefectAnalyze}
              loading={analyzingDefect}
              fullWidth
            >
              YOLO 缺陷检测
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              leftIcon={analyzingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              onClick={handleAIAnalyze}
              loading={analyzingAI}
              fullWidth
            >
              AI 智能分析
            </GlassButton>
          </div>

          {/* Annotation toggle */}
          <div className="mt-4">
            <GlassButton
              variant="secondary"
              size="sm"
              leftIcon={<Tag className="w-4 h-4" />}
              onClick={() => setShowAnnotations(!showAnnotations)}
              fullWidth
            >
              {showAnnotations ? '收起标注' : '人工标注'}
            </GlassButton>
          </div>

          {/* Annotation Panel */}
          {showAnnotations && (
            <div className="mt-4 border border-white/10 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
              <AnnotationPanel mediaId={item.id} />
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

export default MediaSideDetail;
