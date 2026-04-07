// EvidenceBoard - 证据板组件
// 中间案例详情和证据展示

import React from 'react';
import { Eye, Layers, ScrollText, Merge, Split, Star, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from '@/components/workspace/WorkspacePrimitives';
import { ReportDraftCard } from '@/routes/Media';
import {
  DEFECT_FAMILY_LABELS,
  DEFECT_TYPE_LABELS,
  DEFECT_CASE_STATUS_LABELS,
  SEVERITY_LABELS,
  type DefectCaseDetail,
} from '@/types/api/defectCase';

interface EvidenceBoardProps {
  caseDetail: DefectCaseDetail | undefined;
  onComposeOpenClaw: (message: string, title?: string) => void;
  getFamilyIcon: (family: string) => React.ComponentType<{ className?: string }>;
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({
  caseDetail,
  onComposeOpenClaw,
  getFamilyIcon,
}) => {
  if (!caseDetail) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-text-tertiary">
        <Eye className="mb-3 h-8 w-8" />
        <p className="text-sm">请从左侧选择一个案例</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex flex-col space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-text-primary">{caseDetail.title}</p>
          <p className="mt-1 text-xs text-text-secondary">{caseDetail.summary}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              caseDetail.severity === 'critical'
                ? 'bg-danger/10 text-danger'
                : caseDetail.severity === 'high'
                  ? 'bg-warning/10 text-warning'
                  : 'bg-text-tertiary/10 text-text-tertiary',
            )}
          >
            {SEVERITY_LABELS[caseDetail.severity]}
          </span>
          <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">
            {DEFECT_CASE_STATUS_LABELS[caseDetail.status]}
          </span>
        </div>
      </div>

      {/* Meta info strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-[16px] bg-bg-surface/50 px-3 py-2">
        {(() => {
          const Icon = getFamilyIcon(caseDetail.family);
          return <Icon className="h-4 w-4 text-accent" />;
        })()}
        <span className="text-sm font-medium text-text-primary">
          {DEFECT_FAMILY_LABELS[caseDetail.family]} / {DEFECT_TYPE_LABELS[caseDetail.defect_type]}
        </span>
        <span className="text-text-tertiary">·</span>
        <span className="text-sm text-text-secondary">{caseDetail.location}</span>
      </div>

      {/* Time range */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2 text-center">
          <p className="text-xs text-text-tertiary">首次发现</p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {new Date(caseDetail.first_seen_at).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2 text-center">
          <p className="text-xs text-text-tertiary">最后捕获</p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {new Date(caseDetail.last_seen_at).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2 text-center">
          <p className="text-xs text-text-tertiary">证据/重复</p>
          <p className="mt-1 text-sm font-medium text-text-primary">
            {caseDetail.evidence_count} 条 / {caseDetail.duplicate_count} 条折叠
          </p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="mt-3 flex flex-wrap gap-2">
        {([
          { icon: Merge, label: '合并案例' },
          { icon: Split, label: '拆分案例' },
          { icon: Star, label: '指定代表图' },
          { icon: ArrowRightLeft, label: '切换状态' },
        ] as const).map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() =>
              onComposeOpenClaw(`${action.label}：案例「${caseDetail.title}」`, caseDetail.title)
            }
            className="inline-flex items-center gap-1.5 rounded-[16px] border border-border bg-bg-primary/60 px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-light"
          >
            <action.icon className="h-3.5 w-3.5 text-text-secondary" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Evidence timeline */}
      <div className="mt-4 flex-1 min-h-0 overflow-auto pr-1">
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-text-primary">证据板</span>
          <StatusPill tone="neutral">{caseDetail.evidences.length} 条</StatusPill>
        </div>

        {caseDetail.evidences.length > 0 ? (
          <div className="space-y-2">
            {caseDetail.evidences.map((evidence) => (
              <div
                key={evidence.id}
                className={cn(
                  'rounded-[18px] border px-3 py-2.5 transition-all duration-normal',
                  evidence.is_representative ? 'border-accent/30 bg-accent/5' : 'border-border bg-bg-primary/60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">证据 #{evidence.id}</span>
                      {evidence.is_representative && <StatusPill tone="accent">代表图</StatusPill>}
                      <StatusPill tone="neutral">{evidence.source}</StatusPill>
                      <StatusPill tone="neutral">{(evidence.confidence * 100).toFixed(0)}%</StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      {new Date(evidence.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {evidence.location ? ` · ${evidence.location}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-[18px] border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
            当前案例暂无证据记录。
          </p>
        )}

        {/* Duplicate groups */}
        {caseDetail.duplicate_groups.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-text-primary">重复组</span>
            </div>
            {caseDetail.duplicate_groups.map((group) => (
              <div key={group.id} className="rounded-[16px] border border-border bg-bg-primary/60 px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    方法：{group.method.toUpperCase()} · 相似度 {(group.score * 100).toFixed(0)}%
                  </span>
                  <StatusPill tone="neutral">{group.member_count} 张</StatusPill>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report drafts */}
        {caseDetail.report_drafts.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="mb-2 flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-text-primary">报告草稿</span>
              <StatusPill tone="neutral">{caseDetail.report_drafts.length} 份</StatusPill>
            </div>
            {caseDetail.report_drafts.map((draft) => (
              <ReportDraftCard key={draft.id} draft={draft} onCompose={onComposeOpenClaw} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceBoard;
