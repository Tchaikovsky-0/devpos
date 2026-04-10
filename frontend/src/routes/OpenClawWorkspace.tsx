import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, BrainCircuit, ChevronRight, Eye, FileCheck, FileSearch, Sparkles, Workflow } from 'lucide-react';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import {
  useListDefectCasesQuery,
  useGetDefectCaseStatisticsQuery,
} from '@/store/api/defectCaseApi';
import {
  useListMissionsQuery,
  useListTemplatesQuery,
  useGetMissionStatisticsQuery,
} from '@/store/api';
import {
  MetricTile,
  SectionHeader,
  StatusPill,
  WorkspacePanel,
} from '@/components/workspace/WorkspacePrimitives';
import { AIFab, type AIFabAction } from '@/components/layout/AIFab';
import {
  DEFECT_FAMILY_LABELS,
  DEFECT_TYPE_LABELS,
  DEFECT_CASE_STATUS_LABELS,
  SEVERITY_LABELS,
} from '@/types/api/defectCase';
import type { Severity } from '@/types/api/defectCase';
import { cn } from '@/lib/utils';


function getSeverityTone(severity: Severity) {
  switch (severity) {
    case 'critical': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'accent';
    case 'low': return 'neutral';
  }
}

function getApiStatusTone(status: string) {
  switch (status) {
    case 'running': return 'accent';
    case 'pending': return 'warning';
    case 'completed': return 'success';
    case 'failed': return 'danger';
    default: return 'neutral';
  }
}

function getApiStatusLabel(status: string) {
  switch (status) {
    case 'running': return '执行中';
    case 'pending': return '待确认';
    case 'completed': return '已完成';
    case 'failed': return '失败';
    default: return status;
  }
}

function getTriggerLabel(trigger: string) {
  switch (trigger) {
    case 'cron': return '定时触发';
    case 'manual': return '手动触发';
    case 'event': return '事件触发';
    default: return trigger;
  }
}

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

function parseRelatedModules(modules: string): string[] {
  if (!modules) return [];
  return modules.split(',').map((m: string) => m.trim()).filter(Boolean);
}

export default function OpenClawWorkspace() {
  const navigate = useNavigate();
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);

  // Fetch OpenClaw missions from real API
  const { data: missionsResp } = useListMissionsQuery({ page_size: 50 });
  const { data: templatesResp } = useGetMissionStatisticsQuery();
  const { data: allTemplates } = useListTemplatesQuery();

  const missions = missionsResp?.data ?? [];
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(
    missions[0]?.id ?? null,
  );

  const selectedMission = selectedMissionId
    ? missions.find((m) => m.id === selectedMissionId) ?? missions[0] ?? null
    : missions[0] ?? null;

  // Fetch all cases for context selector, filter to active ones client-side
  const { data: activeCasesFromApi } = useListDefectCasesQuery();

  const activeCases = (activeCasesFromApi ?? []).filter(
    (c) => c.status === 'draft' || c.status === 'confirmed' || c.status === 'processing',
  );

  const selectedCase = selectedCaseId
    ? activeCases.find((c) => c.id === selectedCaseId) ?? null
    : null;

  const { data: defectStats } = useGetDefectCaseStatisticsQuery();

  const handleComposeOpenClaw = (prompt: string, source?: string) => {
    composeOpenClaw({ prompt, source });
  };

  // AIFab 操作（根据是否有选中案例动态变化）
  const aiActions: AIFabAction[] = useMemo(
    () =>
      selectedCase
        ? [
            {
              label: '案例研判',
              description: selectedCase.title,
              tone: 'accent' as const,
              onClick: () =>
                handleComposeOpenClaw(
                  `请基于案例「${selectedCase.title}」的全部证据进行深度研判，分析严重度、影响范围和处置优先级。`,
                  selectedCase.title,
                ),
            },
            {
              label: '编排报告',
              onClick: () =>
                handleComposeOpenClaw(
                  `请基于案例「${selectedCase.title}」编排结构化报告草稿，包含概述、结论、证据说明、处置建议。`,
                  selectedCase.title,
                ),
            },
            {
              label: '导出正式报告',
              onClick: () =>
                handleComposeOpenClaw(
                  `请将案例「${selectedCase.title}」的报告草稿确认后导出为正式报告。`,
                  selectedCase.title,
                ),
            },
          ]
        : [
            {
              label: '新建跨模块任务',
              description: selectedMission?.title,
              tone: 'accent' as const,
              onClick: () =>
                handleComposeOpenClaw(
                  '请新建一个跨模块任务，串联画面、资料、告警和任务协同。',
                  selectedMission?.title,
                ),
            },
            {
              label: '搜索知识资料',
              onClick: () =>
                handleComposeOpenClaw(
                  '请搜索当前任务相关的知识资料，并给出可复用结论。',
                  selectedMission?.title,
                ),
            },
            {
              label: '调用自动化模板',
              onClick: () =>
                handleComposeOpenClaw(
                  '请推荐一个适合当前场景的自动化模板，并说明触发条件。',
                  selectedMission?.title,
                ),
            },
          ],
    [selectedCase, selectedMission],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="任务流" value={missionsResp?.total ?? missions.length} helper="跨模块任务保持在同一承接面内" />
        <MetricTile label="自动化模板" value={allTemplates?.data?.length ?? 0} helper="聚焦高价值模板，不做无关能力堆砌" />
        <MetricTile label="执行中" value={templatesResp?.data?.running ?? 0} helper="贯穿监控、媒体、告警、任务与治理" />
        <MetricTile label="待处理案例" value={(defectStats?.draft ?? 0) + (defectStats?.confirmed ?? 0) + (defectStats?.processing ?? 0)} helper="可直接加载案例上下文" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspacePanel className="min-h-0">
          {/* --- Case Context Section (NEW) --- */}
          <SectionHeader
            eyebrow="案例上下文"
            title="关联缺陷案例"
            description="选择一个案例以加载上下文，OpenClaw 将基于案例证据执行研判与报告编排。"
          />

          <div className="mt-4 space-y-2">
            {/* Active case selector */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
                  selectedCaseId === null
                    ? 'bg-accent text-white shadow-panel'
                    : 'bg-bg-surface text-text-secondary hover:text-text-primary',
                )}
              >
                不加载案例
              </button>
              {activeCases
                .map((dc) => (
                  <button
                    key={dc.id}
                    type="button"
                    onClick={() => setSelectedCaseId(dc.id)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-normal',
                      selectedCaseId === dc.id
                        ? 'bg-accent text-white shadow-panel'
                        : 'bg-bg-surface text-text-secondary hover:text-text-primary',
                    )}
                  >
                    #{dc.id} {dc.title.length > 12 ? dc.title.slice(0, 12) + '…' : dc.title}
                  </button>
                ))}
            </div>

            {/* Selected case detail card */}
            {selectedCase && (
              <div className="rounded-[20px] border border-accent/30 bg-accent/5 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{selectedCase.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{selectedCase.location}</p>
                  </div>
                  <StatusPill tone={getSeverityTone(selectedCase.severity)}>
                    {SEVERITY_LABELS[selectedCase.severity]}
                  </StatusPill>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary">
                  <span>{DEFECT_FAMILY_LABELS[selectedCase.family]}</span>
                  <span>·</span>
                  <span>{DEFECT_TYPE_LABELS[selectedCase.defect_type]}</span>
                  <span>·</span>
                  <span>{DEFECT_CASE_STATUS_LABELS[selectedCase.status]}</span>
                  <span>·</span>
                  <span>{selectedCase.evidence_count} 条证据</span>
                  {selectedCase.duplicate_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{selectedCase.duplicate_count} 条重复</span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{selectedCase.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/media')}
                    className="inline-flex items-center gap-1 rounded-[12px] bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                  >
                    <Eye className="h-3 w-3" /> 工作台详情 <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleComposeOpenClaw(
                        `请基于案例「${selectedCase.title}」执行深度研判。`,
                        selectedCase.title,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-[12px] bg-bg-surface px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-light"
                  >
                    <BrainCircuit className="h-3 w-3" /> 立即研判
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* --- Mission History --- */}
          <div className="mt-6 border-t border-border pt-6">
            <SectionHeader
              eyebrow="智能协同"
              title="历史编排记录"
            />

            <div className="mt-4 space-y-3">
              {missions.length === 0 && (
                <p className="py-8 text-center text-sm text-text-tertiary">暂无任务流</p>
              )}
              {missions.map((mission) => (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => setSelectedMissionId(mission.id)}
                  className={cn(
                    'w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-normal',
                    selectedMission?.id === mission.id
                      ? 'border-accent/30 bg-accent/10'
                      : 'border-border bg-bg-primary/65 hover:bg-bg-light',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{mission.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{formatTimestamp(mission.updated_at)}</p>
                    </div>
                    <StatusPill tone={getApiStatusTone(mission.status)}>
                      {getApiStatusLabel(mission.status)}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{mission.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseRelatedModules(mission.related_modules).map((module) => (
                      <StatusPill key={module} tone="neutral">
                        {module}
                      </StatusPill>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <SectionHeader
                title="自动化模板"
              />
              <div className="mt-4 space-y-3">
                {(!allTemplates?.data || allTemplates.data.length === 0) && (
                  <p className="py-4 text-center text-sm text-text-tertiary">暂无自动化模板</p>
                )}
                {allTemplates?.data?.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() =>
                      handleComposeOpenClaw(
                        `请基于模板"${template.name}"发起一条自动化任务，并说明触发方式。`,
                        template.name,
                      )
                    }
                    className="w-full rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3 text-left transition-colors hover:bg-bg-light"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-text-primary">{template.name}</p>
                      <StatusPill tone="neutral">{getTriggerLabel(template.trigger)}</StatusPill>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </WorkspacePanel>

        <aside className="min-h-0 flex flex-col gap-4">
          {/* --- Case-level actions (when case is loaded) --- */}
          {selectedCase && (
            <WorkspacePanel>
              <SectionHeader
                title={`案例级指令`}
                description={`当前已加载案例「${selectedCase.title}」，以下指令均基于案例上下文执行。`}
              />
              <div className="mt-4 space-y-2">
                {[
                  { icon: BrainCircuit, label: '案例研判', desc: '基于证据的严重度与影响分析' },
                  { icon: FileSearch, label: '生成报告草稿', desc: '结构化报告，含证据追溯' },
                  { icon: FileCheck, label: '审核报告', desc: '检查草稿完整性与准确性' },
                  { icon: Sparkles, label: '处置建议', desc: '具体步骤与资源需求' },
                ].map((entry) => (
                  <button
                    key={entry.label}
                    type="button"
                    onClick={() =>
                      handleComposeOpenClaw(
                        `${entry.label}：案例「${selectedCase.title}」（${DEFECT_FAMILY_LABELS[selectedCase.family]} / ${DEFECT_TYPE_LABELS[selectedCase.defect_type]}，${selectedCase.evidence_count} 条证据，${selectedCase.duplicate_count} 条重复折叠）`,
                        selectedCase.title,
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-[18px] bg-bg-primary px-4 py-3 text-left transition-colors hover:bg-bg-light"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <entry.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{entry.label}</p>
                      <p className="text-xs text-text-tertiary">{entry.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </WorkspacePanel>
          )}

          <WorkspacePanel>
            <SectionHeader
              title={selectedMission?.title ?? '暂无任务流'}
              description={selectedMission?.summary ?? '请选择左侧任务流。'}
            />
            {selectedMission ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={getApiStatusTone(selectedMission.status)}>
                    {getApiStatusLabel(selectedMission.status)}
                  </StatusPill>
                  <StatusPill tone="neutral">{formatTimestamp(selectedMission.updated_at)}</StatusPill>
                </div>
                <div className="rounded-[22px] border border-border bg-bg-primary/65 p-4">
                  <p className="text-xs font-semibold tracking-[0.14em] text-text-tertiary">涉及模块</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseRelatedModules(selectedMission.related_modules).map((module) => (
                      <StatusPill key={module} tone="neutral">
                        {module}
                      </StatusPill>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </WorkspacePanel>

          <WorkspacePanel className="min-h-0 flex-1">
            <SectionHeader
              title="知识与命令入口"
              description="通过知识检索、任务编排和自动化模板，把智能协同作为理解器、串联器和执行器。"
            />
            <div className="mt-4 space-y-3">
              {[
                { icon: Bot, label: '解释当前多模块上下文' },
                { icon: BrainCircuit, label: '生成面向值班的统一摘要' },
                { icon: Sparkles, label: '规划下一条自动化工作流' },
                { icon: Workflow, label: '整理历史编排记录' },
              ].map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() =>
                    handleComposeOpenClaw(
                      entry.label,
                      selectedCase?.title ?? selectedMission?.title,
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-[18px] bg-bg-primary px-4 py-3 text-left transition-colors hover:bg-bg-light"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <entry.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{entry.label}</span>
                </button>
              ))}
            </div>
          </WorkspacePanel>
        </aside>
      </div>

      {/* AI 浮动操作按钮 */}
      <AIFab actions={aiActions} />
    </div>
  );
}
