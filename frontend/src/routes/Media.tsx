import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Bot,
  Eye,
  FileCheck,
  FileSearch,
  FolderOpen,
  Layers,
  Merge,
  ScrollText,
  Shield,
  Sparkles,
  Split,
  Star,
  Workflow,
  Zap,
} from 'lucide-react';
import { ContextActionStrip } from '@/components/openclaw';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import {
  useGetAlertsQuery,
} from '@/store/api/alertsApi';
import {
  useGetStreamsQuery,
} from '@/store/api/streamsApi';
import {
  useListDefectCasesQuery,
  useGetDefectCaseStatisticsQuery,
  useGetDefectCaseQuery,
} from '@/store/api/defectCaseApi';
import {
  MetricTile,
} from '@/components/workspace/WorkspacePrimitives';
import {
  DEFECT_FAMILY_LABELS,
  DEFECT_TYPE_LABELS,
  DEFECT_CASE_STATUS_LABELS,
  SEVERITY_LABELS,
  REPORT_DRAFT_STATUS_LABELS,
} from '@/types/api/defectCase';
import type {
  DefectCaseDetail,
  ReportDraft,
  Severity,
  DefectCaseStatus,
} from '@/types/api/defectCase';
import { cn } from '@/lib/utils';

// =============================================================================
// Mode & Tone helpers
// =============================================================================

type MediaMode = 'library' | 'defect';

function getFamilyIcon(family: string) {
  switch (family) {
    case 'security': return Shield;
    case 'env': return Layers;
    case 'structure': return AlertTriangle;
    case 'equipment': return Zap;
    default: return FileSearch;
  }
}

// =============================================================================
// Filter state
// =============================================================================

interface CaseFilters {
  severity: Severity | '';
  status: DefectCaseStatus | '';
  family: string;
  keyword: string;
}

// =============================================================================
// Main Component
// =============================================================================

export default function Media() {
  const [mode, setMode] = useState<MediaMode>('defect');

  // --- RTK Query hooks ---
  const { data: defectCases } = useListDefectCasesQuery({ page_size: 200 });
  const { data: defectCaseStatistics } = useGetDefectCaseStatisticsQuery();
  const { data: alertsResponse } = useGetAlertsQuery({ page_size: 200 });
  const { data: streamsResponse } = useGetStreamsQuery({ page_size: 200 });

  // --- Library mode state ---
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');

  // --- Defect case mode state ---
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [caseDetail, setCaseDetail] = useState<DefectCaseDetail | null>(null);
  const [filters, setFilters] = useState<CaseFilters>({
    severity: '',
    status: '',
    family: '',
    keyword: '',
  });

  // --- Sync case detail from API ---
  const { data: caseDetailData } = useGetDefectCaseQuery(selectedCaseId, { skip: !selectedCaseId });

  // --- Sync caseDetail from API response ---
  const allAlerts = useMemo(
    () => (alertsResponse?.data as unknown[] as Record<string, unknown>[]) ?? [],
    [alertsResponse],
  );
  const allStreams = useMemo(
    () => (streamsResponse?.data as unknown[] as Record<string, unknown>[]) ?? [],
    [streamsResponse],
  );

  // --- Derive media items from alerts (library mode) ---
  interface LibraryMediaItem {
    id: string;
    title: string;
    kind: string;
    folder: string;
    createdAt: string;
    owner: string;
    sizeLabel: string;
    sourceStreamId: string;
    relatedAlertIds: string[];
    summary: string;
  }

  const workspaceMediaItems: LibraryMediaItem[] = useMemo(() => {
    return allAlerts.map((alert) => ({
      id: String(alert.id ?? ''),
      title: String(alert.title ?? ''),
      kind: '缺陷记录' as const,
      folder: String(alert.location ?? '默认目录'),
      createdAt: alert.created_at
        ? new Date(alert.created_at as string).toLocaleDateString('zh-CN')
        : '—',
      owner: String(alert.assignee ?? '系统'),
      sizeLabel: '—',
      sourceStreamId: String(alert.stream_id ?? ''),
      relatedAlertIds: [String(alert.id ?? '')],
      summary: String(alert.description ?? ''),
    }));
  }, [allAlerts]);

  function getStreamById(streamId: string | null | undefined) {
    if (!streamId) return null;
    return allStreams.find((s) => String(s.id) === streamId) ?? null;
  }

  // --- Initialize selectedMediaId ---
  useEffect(() => {
    if (!selectedMediaId && workspaceMediaItems.length > 0) {
      setSelectedMediaId(workspaceMediaItems[0].id);
    }
  }, [selectedMediaId, workspaceMediaItems]);

  // --- Initialize selectedCaseId ---
  useEffect(() => {
    if (defectCases && defectCases.length > 0 && selectedCaseId === 1) {
      if (!defectCases.some((c) => c.id === selectedCaseId)) {
        setSelectedCaseId(defectCases[0].id);
      }
    }
  }, [defectCases, selectedCaseId]);

  useEffect(() => {
    if (caseDetailData) {
      setCaseDetail(caseDetailData);
    }
  }, [caseDetailData]);

  // --- Filter cases ---
  const filteredCases = useMemo(() => {
    if (!defectCases) return [];
    return defectCases.filter((c) => {
      if (filters.severity && c.severity !== filters.severity) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.family && c.family !== filters.family) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !c.title.toLowerCase().includes(kw) &&
          !c.location.toLowerCase().includes(kw) &&
          !c.summary.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [filters, defectCases]);

  // --- Ensure selection is valid ---
  useEffect(() => {
    if (!filteredCases.some((c) => c.id === selectedCaseId) && filteredCases[0]) {
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [selectedCaseId, filteredCases]);

  // --- Library mode logic ---
  const visibleItems = useMemo(() => {
    if (mode === 'library') return workspaceMediaItems;
    return workspaceMediaItems.filter(
      (item) => item.relatedAlertIds.length > 0 || item.kind === '录像' || item.kind === '截图',
    );
  }, [mode, workspaceMediaItems]);

  useEffect(() => {
    if (!visibleItems.some((item) => item.id === selectedMediaId) && visibleItems[0]) {
      setSelectedMediaId(visibleItems[0].id);
    }
  }, [selectedMediaId, visibleItems]);

  const selectedItem = visibleItems.find((item) => item.id === selectedMediaId) ?? visibleItems[0] ?? null;
  const relatedStream = selectedItem ? getStreamById(selectedItem.sourceStreamId) : null;
  const relatedAlerts = useMemo(
    () =>
      selectedItem
        ? allAlerts.filter((alert) => selectedItem.relatedAlertIds.includes(String(alert.id ?? '')))
        : [],
    [selectedItem, allAlerts],
  );

  // --- Stats ---
  const defaultStats = { total: 0, confirmed: 0, processing: 0, draft: 0, resolved: 0, closed: 0, draft_reports: 0 };
  const stats = defectCaseStatistics ?? defaultStats;
  const openCases = stats.confirmed + stats.processing + stats.draft;
  const draftReports = stats.draft_reports;

  // --- OpenClaw helpers ---
  const handleComposeOpenClaw = (prompt: string, source?: string) => {
    composeOpenClaw({ prompt, source });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* =============== Top Action Strip =============== */}
      <ContextActionStrip
        title={
          mode === 'defect'
            ? '缺陷闭环工作台 — 案例 · 证据 · 报告'
            : '智能协同贯穿媒体库'
        }
        summary={
          mode === 'defect'
            ? caseDetail
              ? `案例 #${caseDetail.id}：${caseDetail.title}，${caseDetail.evidence_count} 条证据，${caseDetail.duplicate_count} 条重复已折叠。`
              : '统一缺陷案例闭环，从发现到归档一链到底。'
            : selectedItem
              ? `已聚焦 ${selectedItem.title}，可以直接串联源画面、关联告警与归档说明。`
              : '媒体库支持资料目录与取证回看在同一工作面内切换。'
        }
        actions={
          mode === 'defect'
            ? [
                {
                  label: 'AI 生成报告草稿',
                  onClick: () =>
                    handleComposeOpenClaw(
                      `请基于案例「${caseDetail?.title ?? '当前案例'}」生成结构化报告草稿，包含概述、结论、证据说明、处置建议。`,
                      caseDetail?.title,
                    ),
                  tone: 'accent' as const,
                },
                {
                  label: 'AI 案例研判',
                  onClick: () =>
                    handleComposeOpenClaw(
                      `请研判案例「${caseDetail?.title ?? '当前案例'}」的严重度与影响，并给出处置优先级建议。`,
                      caseDetail?.title,
                    ),
                  tone: 'default' as const,
                },
                {
                  label: '导出已确认报告',
                  onClick: () =>
                    handleComposeOpenClaw(
                      `请导出案例「${caseDetail?.title ?? '当前案例'}」的正式报告。`,
                      caseDetail?.title,
                    ),
                },
              ]
            : [
                {
                  label: '自然语言检索',
                  onClick: () =>
                    handleComposeOpenClaw(
                      '请帮我检索今天新增的关键资料，并按事件链重新组织。',
                      selectedItem?.title,
                    ),
                  tone: 'accent' as const,
                },
                {
                  label: '生成取证说明',
                  onClick: () =>
                    handleComposeOpenClaw(
                      '请基于当前资料生成一段可直接归档的取证说明。',
                      selectedItem?.title,
                    ),
                },
                {
                  label: '加入报告草稿',
                  onClick: () =>
                    handleComposeOpenClaw(
                      '请把当前资料整理到一份报告草稿中，并补全上下文说明。',
                      selectedItem?.title,
                    ),
                },
              ]
        }
      />

      {/* =============== Mode Switcher + Stats =============== */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: 'defect' as MediaMode, label: '缺陷案例' },
            { value: 'library' as MediaMode, label: '资料目录' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-normal',
                mode === option.value
                  ? 'bg-accent text-white shadow-panel'
                  : 'bg-bg-surface text-text-secondary hover:text-text-primary',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          {mode === 'defect' ? (
            <>
              <span>{stats.total} 个案例</span>
              <span className="text-text-tertiary">·</span>
              <span>{openCases} 个待处理</span>
              <span className="text-text-tertiary">·</span>
              <span>{draftReports} 份草稿报告</span>
            </>
          ) : (
            <>
              <span>{visibleItems.length} 份资料</span>
              <span className="text-text-tertiary">·</span>
              <span>{new Set(workspaceMediaItems.map((i) => i.folder)).size} 个目录</span>
            </>
          )}
        </div>
      </div>

      {/* =============== Defect Case Mode =============== */}
      {mode === 'defect' && (
        <React.Fragment>
          {/* Stats row */}
          <div className="grid gap-4 md:grid-cols-4">
            <MetricTile label="案例总数" value={stats.total} helper="包含全部状态" />
            <MetricTile label="待处理" value={openCases} helper="候选 + 已确认 + 处理中" />
            <MetricTile label="草稿报告" value={draftReports} helper="待审核确认" />
            <MetricTile label="证据总量" value={defectCases?.reduce((sum, c) => sum + c.evidence_count, 0) ?? 0} helper="去重前原始证据数" />
          </div>

          {/* Three-column layout */}
          <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
            {/* ---- Left Column: Case Queue ---- */}
            <div className="min-h-0 flex flex-col space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap gap-1.5">
                {([
                  { key: 'severity', options: ['', 'critical', 'high', 'medium', 'low'] as const, labels: ['全部', '紧急', '高', '中', '低'] },
                  { key: 'status', options: ['', 'draft', 'confirmed', 'processing', 'resolved', 'closed'] as const, labels: ['全部', '草稿', '确认', '处理', '解决', '归档'] },
                ] as const).map((group) => (
                  <div key={group.key} className="flex flex-wrap gap-1">
                    {group.options.map((opt, i) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFilters((f) => ({ ...f, [group.key]: opt }))}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-normal',
                          filters[group.key as keyof CaseFilters] === opt
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
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                className="w-full rounded-[14px] border border-border bg-bg-surface/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/40"
              />
              </div>

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
                      onClick={() => setSelectedCaseId(defectCase.id)}
                      className={cn(
                        'w-full rounded-[20px] border px-3 py-3 text-left transition-all duration-normal',
                        selectedCaseId === defectCase.id
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
                        <span className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                          defectCase.severity === 'critical' ? 'bg-danger/10 text-danger' :
                          defectCase.severity === 'high' ? 'bg-warning/10 text-warning' :
                          'bg-text-tertiary/10 text-text-tertiary'
                        )}>
                          {SEVERITY_LABELS[defectCase.severity]}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                        {(() => { const Icon = getFamilyIcon(defectCase.family); return <Icon className="h-3 w-3" />; })()}
                        <span>{DEFECT_FAMILY_LABELS[defectCase.family]}</span>
                        <span className="mx-0.5">·</span>
                        <span>{DEFECT_TYPE_LABELS[defectCase.defect_type]}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">
                            {DEFECT_CASE_STATUS_LABELS[defectCase.status]}
                          </span>
                          <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-tertiary">{defectCase.evidence_count} 证</span>
                        </div>
                        {defectCase.report_status !== 'none' && (
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            defectCase.report_status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          )}>
                            {defectCase.report_status === 'approved' ? '已出报告' : '草稿'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ---- Center Column: Evidence Board ---- */}
            <div className="min-h-0 flex flex-col space-y-3">
              {caseDetail ? (
                <React.Fragment>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-text-primary">{caseDetail.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{caseDetail.summary}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        caseDetail.severity === 'critical' ? 'bg-danger/10 text-danger' :
                        caseDetail.severity === 'high' ? 'bg-warning/10 text-warning' :
                        'bg-text-tertiary/10 text-text-tertiary'
                      )}>
                        {SEVERITY_LABELS[caseDetail.severity]}
                      </span>
                      <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">
                        {DEFECT_CASE_STATUS_LABELS[caseDetail.status]}
                      </span>
                    </div>
                  </div>

                  {/* Meta info strip */}
                  <div className="flex flex-wrap items-center gap-2 rounded-[16px] bg-bg-surface/50 px-3 py-2">
                    {(() => { const Icon = getFamilyIcon(caseDetail.family); return <Icon className="h-4 w-4 text-accent" />; })()}
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
                        {new Date(caseDetail.first_seen_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2 text-center">
                      <p className="text-xs text-text-tertiary">最后捕获</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {new Date(caseDetail.last_seen_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                    {[
                      { icon: Merge, label: '合并案例', tone: 'accent' },
                      { icon: Split, label: '拆分案例', tone: 'warning' },
                      { icon: Star, label: '指定代表图', tone: 'neutral' },
                      { icon: ArrowRightLeft, label: '切换状态', tone: 'neutral' },
                    ].map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() =>
                          handleComposeOpenClaw(
                            `${action.label}：案例「${caseDetail.title}」`,
                            caseDetail.title,
                          )
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
                              evidence.is_representative
                                ? 'border-accent/30 bg-accent/5'
                                : 'border-border bg-bg-primary/60',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-text-primary">
                                    证据 #{evidence.id}
                                  </span>
                                  {evidence.is_representative && (
                                    <StatusPill tone="accent">代表图</StatusPill>
                                  )}
                                  <StatusPill tone="neutral">{evidence.source}</StatusPill>
                                  <StatusPill tone="neutral">
                                    {(evidence.confidence * 100).toFixed(0)}%
                                  </StatusPill>
                                </div>
                                <p className="mt-1 text-xs text-text-secondary">
                                  {new Date(evidence.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                          <div
                            key={group.id}
                            className="rounded-[16px] border border-border bg-bg-primary/60 px-3 py-2"
                          >
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
                          <ReportDraftCard key={draft.id} draft={draft} onCompose={handleComposeOpenClaw} />
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-text-tertiary">
                  <FileSearch className="mb-3 h-8 w-8" />
                  <p className="text-sm">请从左侧选择一个案例</p>
                </div>
              )}
            </div>

            {/* ---- Right Column: OpenClaw Copilot ---- */}
            <aside className="min-h-0 flex flex-col gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">OpenClaw 副驾</p>
                {caseDetail ? (
                  <div className="space-y-2">
                    {[
                      { icon: Bot, label: '案例研判', desc: '分析严重度、影响与处置优先级' },
                      { icon: Sparkles, label: '生成报告草稿', desc: '结构化报告，含证据追溯' },
                      { icon: FileCheck, label: '审核报告', desc: '检查草稿完整性与准确性' },
                      { icon: Workflow, label: '处置建议', desc: '给出具体处置步骤与资源需求' },
                    ].map((entry) => (
                      <button
                        key={entry.label}
                        type="button"
                        onClick={() =>
                          handleComposeOpenClaw(
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
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            caseDetail.severity === 'critical' ? 'bg-danger/10 text-danger' :
                            caseDetail.severity === 'high' ? 'bg-warning/10 text-warning' :
                            'bg-text-tertiary/10 text-text-tertiary'
                          )}>
                            {SEVERITY_LABELS[caseDetail.severity]}
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
          </div>
        </React.Fragment>
      )}

      {/* =============== Library Mode (original, preserved) =============== */}
      {mode === 'library' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile label="目录总数" value={new Set(workspaceMediaItems.map((item) => item.folder)).size} helper="权限与归档策略统一在目录层控制" />
            <MetricTile label="资料总量" value={workspaceMediaItems.length} helper="录像、截图、报告与缺陷记录统一沉淀" />
            <MetricTile label="取证链路" value={relatedAlerts.length} helper="当前资料已关联到的事件数量" />
          </div>

          <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 space-y-3">
              <div className="grid gap-3 xl:grid-cols-2">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMediaId(item.id)}
                    className={cn(
                      'rounded-[18px] px-3 py-3 text-left transition-all duration-normal',
                      selectedItem?.id === item.id
                        ? 'bg-accent/10'
                        : 'bg-bg-surface/50 hover:bg-bg-light',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{item.folder}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                        item.kind === '缺陷记录' ? 'bg-warning/10 text-warning' :
                        item.kind === '录像' ? 'bg-accent/10 text-accent' :
                        'bg-bg-surface text-text-secondary'
                      )}>
                        {item.kind}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-secondary">{item.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                      <span>{item.owner}</span>
                      <span>·</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside className="min-h-0 flex flex-col gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-primary">{selectedItem?.title ?? '暂无资料'}</p>
                {selectedItem ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        selectedItem.kind === '缺陷记录' ? 'bg-warning/10 text-warning' :
                        selectedItem.kind === '录像' ? 'bg-accent/10 text-accent' :
                        'bg-bg-surface text-text-secondary'
                      )}>
                        {selectedItem.kind}
                      </span>
                      <span className="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">{selectedItem.folder}</span>
                    </div>
                    <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
                      <p className="text-sm leading-6 text-text-secondary">{selectedItem.summary}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">选择左侧资料查看详情</p>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-3">
                <p className="text-sm font-medium text-text-primary">关联上下文</p>
                <div className="space-y-3">
                  <div className="rounded-[14px] bg-bg-surface/50 px-3 py-2">
                    <p className="text-xs text-text-tertiary">来源对象</p>
                    <p className="mt-1 text-sm text-text-primary">
                      {relatedStream ? String(relatedStream.name ?? '') : '当前资料未直接绑定视频源'}
                    </p>
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {relatedStream ? String(relatedStream.location ?? '') : '可继续通过智能检索补全来源上下文。'}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-warning" />
                      <span className="text-sm font-semibold text-text-primary">关联告警</span>
                    </div>
                    <div className="space-y-3">
                      {relatedAlerts.length > 0 ? (
                        relatedAlerts.map((alert) => (
                          <button
                            key={String(alert.id ?? '')}
                            type="button"
                            onClick={() =>
                              handleComposeOpenClaw(
                                `请说明资料"${selectedItem?.title ?? ''}"与告警"${String(alert.title ?? '')}"之间的关系。`,
                                String(alert.title ?? ''),
                              )
                            }
                            className="w-full rounded-[20px] border border-border bg-bg-primary/65 px-4 py-3 text-left transition-colors hover:bg-bg-light"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-text-primary">{String(alert.title ?? '')}</p>
                              <StatusPill tone={String(alert.level ?? '') === '紧急' ? 'danger' : 'warning'}>
                                {String(alert.level ?? '提示')}
                              </StatusPill>
                            </div>
                            <p className="mt-2 text-xs text-text-secondary">{String(alert.description ?? '')}</p>
                          </button>
                        ))
                      ) : (
                        <p className="rounded-[20px] border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
                          当前资料暂无直接告警关联。
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <FileSearch className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-text-primary">智能整理动作</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        '生成案件说明',
                        '补全资料标签',
                        '整理到巡检报告草稿',
                      ].map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() =>
                            handleComposeOpenClaw(
                              `${action}：${selectedItem?.title ?? '当前资料'}`,
                              selectedItem?.title,
                            )
                          }
                          className="w-full rounded-[18px] bg-bg-primary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-light"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </WorkspacePanel>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Report Draft Card Sub-component
// =============================================================================

function ReportDraftCard({ draft, onCompose }: { draft: ReportDraft; onCompose: (prompt: string, source?: string) => void }) {
  return (
    <div className="rounded-[18px] border border-border bg-bg-primary/60 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{draft.title}</p>
        <StatusPill tone={draft.status === 'approved' ? 'success' : draft.status === 'draft' ? 'warning' : 'neutral'}>
          {REPORT_DRAFT_STATUS_LABELS[draft.status]}
        </StatusPill>
      </div>

      {draft.overview && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">{draft.overview}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary">
        <span>{draft.evidence_total} 条证据</span>
        {draft.duplicate_folded > 0 && <span>· {draft.duplicate_folded} 条折叠</span>}
        <span>· {draft.generated_by}</span>
      </div>

      {/* Draft action buttons */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {draft.status === 'draft' && (
          <>
            <button
              type="button"
              onClick={() => onCompose(`请编辑报告草稿「${draft.title}」，优化概述和处置建议部分。`, draft.title)}
              className="inline-flex items-center gap-1 rounded-[12px] bg-bg-surface px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-light"
            >
              <Bot className="h-3 w-3" /> 编辑
            </button>
            <button
              type="button"
              onClick={() => onCompose(`请确认报告草稿「${draft.title}」，检查内容完整性后转为正式报告。`, draft.title)}
              className="inline-flex items-center gap-1 rounded-[12px] bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <FileCheck className="h-3 w-3" /> 确认归档
            </button>
          </>
        )}
        {draft.status === 'approved' && (
          <button
            type="button"
            onClick={() => onCompose(`请导出报告「${draft.title}」为 PDF 格式。`, draft.title)}
            className="inline-flex items-center gap-1 rounded-[12px] bg-success/10 px-2.5 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
          >
            <ScrollText className="h-3 w-3" /> 导出
          </button>
        )}
      </div>
    </div>
  );
}
