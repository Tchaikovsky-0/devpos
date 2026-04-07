// CaseQueue - 案例队列组件
// 左侧案例筛选和列表展示

import React, { useMemo } from 'react';
import { FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DEFECT_FAMILY_LABELS,
  DEFECT_TYPE_LABELS,
  DEFECT_CASE_STATUS_LABELS,
  SEVERITY_LABELS,
  type DefectCase,
} from '@/types/api/defectCase';

interface CaseQueueProps {
  defectCases?: DefectCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  filters: {
    severity: string;
    status: string;
    keyword: string;
  };
  onFilterChange: (filters: CaseQueueProps['filters']) => void;
  getFamilyIcon: (family: string) => React.ComponentType<{ className?: string }>;
}

export const CaseQueue: React.FC<CaseQueueProps> = ({
  defectCases,
  selectedCaseId,
  onSelectCase,
  filters,
  onFilterChange,
  getFamilyIcon,
}) => {
  const filteredCases = useMemo(() => {
    if (!defectCases) return [];
    return defectCases.filter((c) => {
      if (filters.severity && c.severity !== filters.severity) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (!c.title.toLowerCase().includes(kw) && !c.location?.toLowerCase().includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [defectCases, filters]);

  return (
    <div className="min-h-0 flex flex-col space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {([
          {
            key: 'severity',
            options: ['', 'critical', 'high', 'medium', 'low'] as const,
            labels: ['全部', '紧急', '高', '中', '低'],
          },
          {
            key: 'status',
            options: ['', 'draft', 'confirmed', 'processing', 'resolved', 'closed'] as const,
            labels: ['全部', '草稿', '确认', '处理', '解决', '归档'],
          },
        ] as const).map((group) => (
          <div key={group.key} className="flex flex-wrap gap-1">
            {group.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => onFilterChange({ ...filters, [group.key]: opt })}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-normal',
                  filters[group.key as keyof typeof filters] === opt
                    ? 'bg-bg-surface text-text-primary shadow-panel'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                {group.labels[i]}
              </button>
            ))}
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="搜索案例..."
        value={filters.keyword}
        onChange={(e) => onFilterChange({ ...filters, keyword: e.target.value })}
        className="w-full rounded-[14px] border border-border bg-bg-surface/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/40"
      />

      {/* Case list */}
      <div className="mt-3 flex-1 space-y-2 overflow-auto pr-1">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <FileSearch className="mb-3 h-8 w-8" />
            <p className="text-sm">没有匹配的案例</p>
          </div>
        ) : (
          filteredCases.map((defectCase) => (
            <button
              key={defectCase.id}
              type="button"
              onClick={() => onSelectCase(String(defectCase.id))}
              className={cn(
                'w-full rounded-[20px] border px-3 py-3 text-left transition-all duration-normal',
                selectedCaseId === String(defectCase.id)
                  ? 'border-accent/30 bg-accent/10'
                  : 'border-transparent bg-bg-surface/80 hover:border-border hover:bg-bg-light',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {defectCase.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {defectCase.location}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    defectCase.severity === 'critical'
                      ? 'bg-danger/10 text-danger'
                      : defectCase.severity === 'high'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-text-tertiary/10 text-text-tertiary',
                  )}
                >
                  {SEVERITY_LABELS[defectCase.severity]}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                {(() => {
                  const Icon = getFamilyIcon(defectCase.family);
                  return <Icon className="h-3 w-3" />;
                })()}
                <span>{DEFECT_FAMILY_LABELS[defectCase.family]}</span>
                <span className="mx-0.5">·</span>
                <span>{DEFECT_TYPE_LABELS[defectCase.defect_type]}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">
                    {DEFECT_CASE_STATUS_LABELS[defectCase.status]}
                  </span>
                  <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-tertiary">
                    {defectCase.evidence_count} 证
                  </span>
                </div>
                {defectCase.report_status !== 'none' && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      defectCase.report_status === 'approved'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning',
                    )}
                  >
                    {defectCase.report_status === 'approved' ? '已出报告' : '草稿'}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CaseQueue;
