import React from 'react';
import {
  Star,
  Trash2,
  FolderInput,
  Download,
  X,
  RotateCcw,
  Trash,
  Sparkles,
  FileText,
} from 'lucide-react';

interface BatchToolbarProps {
  selectedIds: Set<number>;
  onStar: (ids: number[]) => void;
  onDelete: (ids: number[]) => void;
  onMove: (ids: number[]) => void;
  onDownload: (ids: number[]) => void;
  onClearSelection: () => void;
  /** Trash view: restore selected items */
  onRestore?: (ids: number[]) => void;
  /** Trash view: empty all trash */
  onEmptyTrash?: () => void;
  /** AI defect analysis */
  onAIAnalyze?: (ids: number[]) => void;
  /** Generate defect report */
  onGenerateReport?: (ids: number[]) => void;
}

export const BatchToolbar: React.FC<BatchToolbarProps> = ({
  selectedIds,
  onStar,
  onDelete,
  onMove,
  onDownload,
  onClearSelection,
  onRestore,
  onEmptyTrash,
  onAIAnalyze,
  onGenerateReport,
}) => {
  const selectedCount = selectedIds.size;

  if (selectedCount === 0) return null;

  const selectedArray = Array.from(selectedIds);
  const isTrashMode = !!onRestore;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-base border border-border shadow-lg backdrop-blur-sm">
        {/* Selection Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <span className="text-sm font-medium text-text-primary">
            已选中 {selectedCount} 个文件
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {isTrashMode ? (
            <>
              {/* Restore button */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors"
                onClick={() => onRestore(selectedArray)}
                title="恢复"
              >
                <RotateCcw className="h-4 w-4" />
                <span>恢复</span>
              </button>

              {/* Permanent delete button */}
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                onClick={() => onDelete(selectedArray)}
                title="永久删除"
              >
                <Trash2 className="h-4 w-4" />
                <span>永久删除</span>
              </button>

              {/* Empty trash button */}
              {onEmptyTrash && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                  onClick={onEmptyTrash}
                  title="清空回收站"
                >
                  <Trash className="h-4 w-4" />
                  <span>清空回收站</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors"
                onClick={() => onStar(selectedArray)}
                title="收藏"
              >
                <Star className="h-4 w-4" />
                <span>收藏</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors"
                onClick={() => onMove(selectedArray)}
                title="移动到文件夹"
              >
                <FolderInput className="h-4 w-4" />
                <span>移动</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors"
                onClick={() => onDownload(selectedArray)}
                title="下载"
              >
                <Download className="h-4 w-4" />
                <span>下载</span>
              </button>

              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                onClick={() => onDelete(selectedArray)}
                title="移至回收站"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </button>

              {/* AI Defect Analysis - Only show when onAIAnalyze is provided */}
              {onAIAnalyze && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors"
                  onClick={() => onAIAnalyze(selectedArray)}
                  title="AI缺陷分析"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI分析</span>
                </button>
              )}

              {/* Generate Defect Report - Only show when onGenerateReport is provided */}
              {onGenerateReport && (
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors"
                  onClick={() => onGenerateReport(selectedArray)}
                  title="生成缺陷报告"
                >
                  <FileText className="h-4 w-4" />
                  <span>生成报告</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Clear Selection */}
        <button
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors"
          onClick={onClearSelection}
          title="清除选择"
        >
          <X className="h-4 w-4" />
          <span>清除</span>
        </button>
      </div>
    </div>
  );
};
