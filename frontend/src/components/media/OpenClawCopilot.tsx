// OpenClawCopilot - OpenClaw AI副驾组件
// 右侧AI助手面板

import React from 'react';
import { Bot, Sparkles, FileCheck, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFECT_FAMILY_LABELS, DEFECT_TYPE_LABELS, type DefectCase } from '@/types/api/defectCase';

interface OpenClawCopilotProps {
  caseDetail: DefectCase | undefined;
  onComposeOpenClaw: (message: string, title?: string) => void;
}

export const OpenClawCopilot: React.FC<OpenClawCopilotProps> = ({
  caseDetail,
  onComposeOpenClaw,
}) => {
  const copilotActions = [
    { icon: Bot, label: '案例研判', desc: '分析严重度、影响与处置优先级' },
    { icon: Sparkles, label: '生成报告草稿', desc: '结构化报告，含证据追溯' },
    { icon: FileCheck, label: '审核报告', desc: '检查草稿完整性与准确性' },
    { icon: Workflow, label: '处置建议', desc: '给出具体处置步骤与资源需求' },
  ] as const;

  return (
    <aside className="min-h-0 flex flex-col gap-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-text-primary">OpenClaw 副驾</p>
        {caseDetail ? (
          <div className="space-y-2">
            {copilotActions.map((entry) => (
              <button
                key={entry.label}
                type="button"
                onClick={() =>
                  onComposeOpenClaw(
                    `${entry.label}：案例「${caseDetail.title}」（${DEFECT_FAMILY_LABELS[caseDetail.family]} / ${DEFECT_TYPE_LABELS[caseDetail.defect_type]}，${caseDetail.evidence_count} 条证据）`,
                    caseDetail.title,
                  )
                }
                className="flex w-full items-center gap-3 rounded-[14px] bg-bg-surface/50 px-3 py-2.5 text-left transition-colors hover:bg-bg-light"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <entry.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{entry.label}</p>
                  <p className="text-xs text-text-tertiary">{entry.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">请先选择一个案例以启用副驾功能。</p>
        )}
      </div>

      {/* Quick context panel */}
      {caseDetail && (
        <div className="min-h-0 flex-1 space-y-3">
          <p className="text-sm font-medium text-text-primary">案例摘要</p>
          <div className="space-y-2">
            <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
              <p className="text-sm leading-6 text-text-secondary">{caseDetail.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
                <p className="text-xs text-text-tertiary">家族/类型</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {DEFECT_FAMILY_LABELS[caseDetail.family]} · {DEFECT_TYPE_LABELS[caseDetail.defect_type]}
                </p>
              </div>
              <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
                <p className="text-xs text-text-tertiary">严重度</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
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
                    {caseDetail.severity === 'critical'
                      ? '紧急'
                      : caseDetail.severity === 'high'
                        ? '高'
                        : '中/低'}
                  </span>
                </p>
              </div>
            </div>

            {/* Linked alerts */}
            {caseDetail.stream_id && (
              <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
                <p className="text-xs text-text-tertiary">关联画面</p>
                <p className="mt-1 text-sm text-text-primary">{caseDetail.device_name}</p>
                <p className="text-xs text-text-secondary">{caseDetail.stream_id}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default OpenClawCopilot;
