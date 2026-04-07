// =============================================================================
// AIAnalysis - AI分析展示组件
// =============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Clock, AlertCircle } from 'lucide-react';
import { AIAnalysis as AIAnalysisType } from '@/types/alert';
import { cn } from '@/lib/utils';

interface AIAnalysisProps {
  analysis: AIAnalysisType;
  className?: string;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis, className }) => {
  const confidenceLevel =
    analysis.confidence >= 0.9
      ? { label: '极高', color: '#22c55e' }
      : analysis.confidence >= 0.7
      ? { label: '高', color: '#3b82f6' }
      : analysis.confidence >= 0.5
      ? { label: '中等', color: '#f59e0b' }
      : { label: '低', color: '#ef4444' };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-muted">
          <Brain className="w-4 h-4 text-accent-soft" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-text-secondary">AI 智能分析</h4>
          <p className="text-xs text-text-primary0">由 OpenClaw 自动生成</p>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="p-3 rounded-lg bg-bg-hover border border-border-strong">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            置信度
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: confidenceLevel.color }}
          >
            {confidenceLevel.label} ({(analysis.confidence * 100).toFixed(1)}%)
          </span>
        </div>
        <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.confidence * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: confidenceLevel.color }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-bg-hover border border-border-strong">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-text-secondary block mb-1">分析摘要</span>
            <p className="text-sm text-text-secondary leading-relaxed">{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Detected Objects */}
      {analysis.detectedObjects.length > 0 && (
        <div className="p-3 rounded-lg bg-bg-hover border border-border-strong">
          <span className="text-xs text-text-secondary block mb-2">检测到的对象</span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.detectedObjects.map((obj, index) => (
              <motion.span
                key={`${obj}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-2 py-0.5 text-[11px] font-medium rounded-full
                          bg-accent-muted text-accent border border-accent"
              >
                {obj.label}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {analysis.timeRange && (
        <div className="p-3 rounded-lg bg-bg-hover border border-border-strong">
          <span className="text-xs text-text-secondary flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5" />
            关键时间段
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="px-2 py-0.5 text-[11px] font-mono rounded
                        bg-bg-hover text-text-secondary border border-border-strong"
            >
              {analysis.timeRange.start.toLocaleTimeString('zh-CN')} - {analysis.timeRange.end.toLocaleTimeString('zh-CN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
