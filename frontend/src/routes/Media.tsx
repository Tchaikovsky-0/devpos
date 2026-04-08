import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRightLeft,
  Bot,
  CheckSquare,
  Eye,
  FileCheck,
  FileSearch,
  Layers,
  Loader2,
  Merge,
  RotateCcw,
  ScrollText,
  Search,
  Share2,
  Shield,
  Sparkles,
  Split,
  Square,
  Star,
  Trash2,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DefectAnalyzeDialog, ReportDialog } from '@/components/gallery';
import { BatchToolbar } from '@/components/media/BatchToolbar';
import { Input } from '@/components/ui/Input';
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
  StatusPill,
  DetailPanel,
} from '@/components/workspace/WorkspacePrimitives';
import { AIFab, type AIFabAction } from '@/components/layout/AIFab';
import { FilterPill, FilterPillGroup } from '@/components/ui/FilterPill';
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
import { toast } from '@/components/ui/toast';
import {
  useListMediaQuery,
  useListTrashMediaQuery,
  useToggleStarMutation,
  useMoveToTrashMutation,
  useRestoreFromTrashMutation,
  usePermanentDeleteTrashMutation,
  useBatchDedupeMutation,
  MediaItem,
} from '@/store/api/mediaApi';

// =============================================================================
// Mode & Tone helpers
// =============================================================================

type MediaMode = 'library' | 'defect' | 'gallery';

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

  // --- Gallery mode state ---
  type GalleryTab = 'all' | 'starred' | 'trash';
  const [galleryTab, setGalleryTab] = useState<GalleryTab>('all');
  const [gallerySearch, setGallerySearch] = useState('');
  const [gallerySelected, setGallerySelected] = useState<Set<number>>(new Set());
  const [gallerySelectMode, setGallerySelectMode] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryFocusedId, setGalleryFocusedId] = useState<number | null>(null);
  const [galleryPreviewId, setGalleryPreviewId] = useState<number | null>(null);
  const [_galleryAnalysisOpen, setGalleryAnalysisOpen] = useState(false);
  const [_galleryReportOpen, setGalleryReportOpen] = useState(false);

  const galleryPageSize = 24;
  const {
    data: galleryAllData,
    isLoading: galleryLoadingAll,
    isFetching: galleryFetchingAll,
  } = useListMediaQuery({ page: galleryPage, page_size: galleryPageSize }, { skip: galleryTab === 'trash' });
  const {
    data: galleryTrashData,
    isLoading: galleryLoadingTrash,
    isFetching: galleryFetchingTrash,
  } = useListTrashMediaQuery({ page: galleryPage, page_size: galleryPageSize }, { skip: galleryTab !== 'trash' });

  const [toggleStarApi] = useToggleStarMutation();
  const [moveToTrashApi] = useMoveToTrashMutation();
  const [restoreTrashApi] = useRestoreFromTrashMutation();
  const [permanentDeleteApi] = usePermanentDeleteTrashMutation();
  const [batchDedupeApi] = useBatchDedupeMutation();

  interface GalleryPhoto {
    id: number; imageFull: string; tag: string; date: string; time: string; starred: boolean;
  }

  const toGalleryPhoto = useCallback((item: MediaItem): GalleryPhoto => {
    const createdAt = item.created_at ? new Date(item.created_at) : new Date();
    return {
      id: item.id,
      imageFull: item.url,
      tag: item.description || item.original_name || item.filename,
      date: createdAt.toLocaleDateString('zh-CN'),
      time: createdAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      starred: item.starred ?? false,
    };
  }, []);

  const galleryAllPhotos = useMemo<GalleryPhoto[]>(() => {
    const inner = (galleryAllData as { data?: { data?: MediaItem[] } } | undefined)?.data;
    return (inner?.data ?? []).map(toGalleryPhoto);
  }, [galleryAllData, toGalleryPhoto]);

  const galleryTrashPhotos = useMemo<GalleryPhoto[]>(() => {
    const inner = (galleryTrashData as { data?: { data?: MediaItem[] } } | undefined)?.data;
    return (inner?.data ?? []).map(toGalleryPhoto);
  }, [galleryTrashData, toGalleryPhoto]);

  const galleryTotal = (galleryAllData as { data?: { total?: number } } | undefined)?.data?.total ?? 0;
  const galleryTrashTotal = (galleryTrashData as { data?: { total?: number } } | undefined)?.data?.total ?? 0;

  const gallerySourceList = useMemo(() => {
    if (galleryTab === 'trash') return galleryTrashPhotos;
    if (galleryTab === 'starred') return galleryAllPhotos.filter((p) => p.starred);
    return galleryAllPhotos;
  }, [galleryTab, galleryAllPhotos, galleryTrashPhotos]);

  const galleryFiltered = useMemo(() => {
    if (!gallerySearch.trim()) return gallerySourceList;
    const q = gallerySearch.toLowerCase();
    return gallerySourceList.filter(
      (p) => p.tag.toLowerCase().includes(q) || p.date.includes(q),
    );
  }, [gallerySearch, gallerySourceList]);

  const galleryStarredCount = galleryAllPhotos.filter((p) => p.starred).length;
  const gallerySelectedCount = gallerySelected.size;

  const gallerySelectedList = useMemo(
    () => gallerySourceList.filter((p) => gallerySelected.has(p.id)),
    [gallerySourceList, gallerySelected],
  );

  const galleryFocusedPhoto = useMemo(() => {
    if (galleryFocusedId != null) {
      const found = gallerySourceList.find((p) => p.id === galleryFocusedId);
      if (found) return found;
    }
    return gallerySelectedList[0] ?? galleryFiltered[0] ?? null;
  }, [galleryFocusedId, gallerySourceList, gallerySelectedList, galleryFiltered]);

  useEffect(() => { setGalleryPage(1); setGallerySelected(new Set()); }, [galleryTab, gallerySearch]);
  useEffect(() => {
    if (galleryFiltered.length > 0) {
      if (!galleryFocusedId || !galleryFiltered.some((p) => p.id === galleryFocusedId)) {
        setGalleryFocusedId(galleryFiltered[0].id);
      }
    } else {
      setGalleryFocusedId(null);
    }
  }, [galleryFiltered, galleryFocusedId]);

  const galleryToggleSelect = useCallback((id: number) => {
    setGallerySelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const gallerySelectAll = useCallback(() => {
    if (gallerySelected.size === galleryFiltered.length) {
      setGallerySelected(new Set());
    } else {
      setGallerySelected(new Set(galleryFiltered.map((p) => p.id)));
    }
  }, [galleryFiltered, gallerySelected.size]);

  const galleryHandleToggleStar = useCallback(
    (id: number) => {
      toggleStarApi(id).unwrap().catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [toggleStarApi],
  );

  const galleryHandleMoveToTrash = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      ids.forEach((id) => {
        moveToTrashApi(id).unwrap().catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
      });
      setGallerySelected(new Set());
      toast({ title: `已移入回收站（${ids.length} 张）` });
    },
    [moveToTrashApi],
  );

  const galleryHandleRestore = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      restoreTrashApi({ ids })
        .unwrap()
        .then(() => toast({ title: `已恢复 ${ids.length} 张` }))
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [restoreTrashApi],
  );

  const galleryHandlePermanentDelete = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      permanentDeleteApi({ ids })
        .unwrap()
        .then(() => toast({ title: `已彻底删除 ${ids.length} 张` }))
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [permanentDeleteApi],
  );

  const galleryHandleDedupe = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      batchDedupeApi({ ids })
        .unwrap()
        .then((result) => {
          const data = result.data;
          toast({ title: `去重完成：保留 ${data.kept} 张，删除 ${data.removed} 张` });
          setGallerySelected(new Set());
        })
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [batchDedupeApi],
  );

  const galleryHandleDownload = useCallback(
    (ids: number[]) => {
      ids.forEach((id) => {
        const photo = gallerySourceList.find((p) => p.id === id);
        if (!photo) return;
        const a = document.createElement('a');
        a.href = photo.imageFull;
        a.download = `media_${id}.jpg`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      });
      toast({ title: `已开始下载 ${ids.length} 张图片` });
    },
    [gallerySourceList],
  );

  const galleryHandleClearSelection = useCallback(() => {
    setGallerySelected(new Set());
  }, []);

  const galleryIsLoading = galleryTab === 'trash' ? galleryLoadingTrash : galleryLoadingAll;
  const galleryIsFetching = galleryTab === 'trash' ? galleryFetchingTrash : galleryFetchingAll;
  const galleryPreviewPhoto = useMemo(
    () => (galleryPreviewId == null ? null : gallerySourceList.find((p) => p.id === galleryPreviewId) ?? null),
    [galleryPreviewId, gallerySourceList],
  );

  function galleryDownload(url: string, id: number) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `media_${id}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
    toast({ title: '已开始下载' });
  }

  async function galleryShare(url: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: '媒体文件', url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    void navigator.clipboard.writeText(url).then(() => toast({ title: '链接已复制' })).catch(() => toast({ title: '复制失败', variant: 'destructive' }));
  }

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
    () => alertsResponse?.data?.items ?? [],
    [alertsResponse],
  );
  const allStreams = useMemo(
    () => streamsResponse?.data?.items ?? [],
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
      owner: String(alert.title ?? '系统'),
      sizeLabel: '—',
      sourceStreamId: String(alert.stream_id ?? ''),
      relatedAlertIds: [String(alert.id ?? '')],
      summary: String(alert.message ?? ''),
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

  // --- AIFab actions (dynamic based on mode) ---
  const mediaAiActions: AIFabAction[] = useMemo(
    () =>
      mode === 'defect'
        ? [
            {
              label: 'AI 生成报告草稿',
              description: caseDetail ? `案例 #${caseDetail.id}` : undefined,
              tone: 'accent' as const,
              onClick: () =>
                handleComposeOpenClaw(
                  `请基于案例「${caseDetail?.title ?? '当前案例'}」生成结构化报告草稿，包含概述、结论、证据说明、处置建议。`,
                  caseDetail?.title,
                ),
            },
            {
              label: 'AI 案例研判',
              onClick: () =>
                handleComposeOpenClaw(
                  `请研判案例「${caseDetail?.title ?? '当前案例'}」的严重度与影响，并给出处置优先级建议。`,
                  caseDetail?.title,
                ),
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
              description: selectedItem?.title,
              tone: 'accent' as const,
              onClick: () =>
                handleComposeOpenClaw(
                  '请帮我检索今天新增的关键资料，并按事件链重新组织。',
                  selectedItem?.title,
                ),
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
          ],
    [mode, caseDetail, selectedItem],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <AIFab actions={mediaAiActions} />

      {/* =============== Mode Switcher + Stats =============== */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterPillGroup>
          {[
            { value: 'defect' as MediaMode, label: '缺陷案例' },
            { value: 'gallery' as MediaMode, label: '图片库' },
            { value: 'library' as MediaMode, label: '资料目录' },
          ].map((option) => (
            <FilterPill
              key={option.value}
              active={mode === option.value}
              onClick={() => setMode(option.value)}
            >
              {option.label}
            </FilterPill>
          ))}
        </FilterPillGroup>

        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          {mode === 'defect' ? (
            <>
              <span>{stats.total} 个案例</span>
              <span className="text-text-tertiary">·</span>
              <span>{openCases} 个待处理</span>
              <span className="text-text-tertiary">·</span>
              <span>{draftReports} 份草稿报告</span>
            </>
          ) : mode === 'gallery' ? (
            <>
              <span>{galleryTotal} 张图片</span>
              <span className="text-text-tertiary">·</span>
              <span>{galleryStarredCount} 收藏</span>
              <span className="text-text-tertiary">·</span>
              <span>{galleryTrashTotal} 回收站</span>
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
                      <FilterPill
                        key={opt}
                        active={filters[group.key as keyof CaseFilters] === opt}
                        onClick={() => setFilters((f) => ({ ...f, [group.key]: opt }))}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {group.labels[i]}
                      </FilterPill>
                    ))}
                  </div>
                ))}
              </div>

              <input
                type="text"
                placeholder="搜索案例..."
                value={filters.keyword}
                onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                className="w-full rounded-md border border-border bg-bg-tertiary/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-accent/40"
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
                      onClick={() => setSelectedCaseId(defectCase.id)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-3 text-left transition-all duration-normal',
                        selectedCaseId === defectCase.id
                          ? 'border-accent/30 bg-accent/10'
                          : 'border-transparent bg-bg-tertiary/80 hover:border-border hover:bg-bg-muted',
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
                        <StatusPill
                          tone={
                            defectCase.severity === 'critical'
                              ? 'danger'
                              : defectCase.severity === 'high'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {SEVERITY_LABELS[defectCase.severity]}
                        </StatusPill>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                        {(() => { const Icon = getFamilyIcon(defectCase.family); return <Icon className="h-3 w-3" />; })()}
                        <span>{DEFECT_FAMILY_LABELS[defectCase.family]}</span>
                        <span className="mx-0.5">·</span>
                        <span>{DEFECT_TYPE_LABELS[defectCase.defect_type]}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <StatusPill tone="neutral" size="sm">
                            {DEFECT_CASE_STATUS_LABELS[defectCase.status]}
                          </StatusPill>
                          <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
                            {defectCase.evidence_count} 证
                          </span>
                        </div>
                        {defectCase.report_status !== 'none' && (
                          <StatusPill
                            tone={defectCase.report_status === 'approved' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {defectCase.report_status === 'approved' ? '已出报告' : '草稿'}
                          </StatusPill>
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
                      <StatusPill
                        tone={
                          caseDetail.severity === 'critical'
                            ? 'danger'
                            : caseDetail.severity === 'high'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {SEVERITY_LABELS[caseDetail.severity]}
                      </StatusPill>
                      <StatusPill tone="neutral" size="sm">
                        {DEFECT_CASE_STATUS_LABELS[caseDetail.status]}
                      </StatusPill>
                    </div>
                  </div>

                  {/* Meta info strip */}
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-bg-tertiary/50 px-3 py-2">
                    {(() => { const Icon = getFamilyIcon(caseDetail.family); return <Icon className="h-4 w-4 text-accent" />; })()}
                    <span className="text-sm font-medium text-text-primary">
                      {DEFECT_FAMILY_LABELS[caseDetail.family]} / {DEFECT_TYPE_LABELS[caseDetail.defect_type]}
                    </span>
                    <span className="text-text-tertiary">·</span>
                    <span className="text-sm text-text-secondary">{caseDetail.location}</span>
                  </div>

                  {/* Time range */}
                  <div className="grid grid-cols-3 gap-2">
                    <DetailPanel>
                      <p className="text-xs text-text-tertiary">首次发现</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {new Date(caseDetail.first_seen_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </DetailPanel>
                    <DetailPanel>
                      <p className="text-xs text-text-tertiary">最后捕获</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {new Date(caseDetail.last_seen_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </DetailPanel>
                    <DetailPanel>
                      <p className="text-xs text-text-tertiary">证据/重复</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {caseDetail.evidence_count} 条 / {caseDetail.duplicate_count} 条折叠
                      </p>
                    </DetailPanel>
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
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-primary/60 px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-muted"
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
                      <StatusPill tone="neutral" size="sm">{caseDetail.evidences.length} 条</StatusPill>
                    </div>

                    {caseDetail.evidences.length > 0 ? (
                      <div className="space-y-2">
                        {caseDetail.evidences.map((evidence) => (
                          <div
                            key={evidence.id}
                            className={cn(
                              'rounded-xl border px-3 py-2.5 transition-all duration-normal',
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
                                    <StatusPill tone="accent" size="sm">代表图</StatusPill>
                                  )}
                                  <StatusPill tone="neutral" size="sm">{evidence.source}</StatusPill>
                                  <StatusPill tone="neutral" size="sm">
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
                      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
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
                          <DetailPanel key={group.id} className="py-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-text-secondary">
                                方法：{group.method.toUpperCase()} · 相似度 {(group.score * 100).toFixed(0)}%
                              </span>
                              <StatusPill tone="neutral" size="sm">{group.member_count} 张</StatusPill>
                            </div>
                          </DetailPanel>
                        ))}
                      </div>
                    )}

                    {/* Report drafts */}
                    {caseDetail.report_drafts.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ScrollText className="h-4 w-4 text-accent" />
                          <span className="text-sm font-semibold text-text-primary">报告草稿</span>
                          <StatusPill tone="neutral" size="sm">{caseDetail.report_drafts.length} 份</StatusPill>
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
                        className="flex w-full items-center gap-3 rounded-xl bg-bg-tertiary/50 px-3 py-2.5 text-left transition-colors hover:bg-bg-muted"
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
                    <DetailPanel>
                      <p className="text-sm leading-6 text-text-secondary">{caseDetail.summary}</p>
                    </DetailPanel>

                    <div className="grid grid-cols-2 gap-2">
                      <DetailPanel>
                        <p className="text-xs text-text-tertiary">家族/类型</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {DEFECT_FAMILY_LABELS[caseDetail.family]} · {DEFECT_TYPE_LABELS[caseDetail.defect_type]}
                        </p>
                      </DetailPanel>
                      <DetailPanel>
                        <p className="text-xs text-text-tertiary">严重度</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          <StatusPill
                            tone={
                              caseDetail.severity === 'critical'
                                ? 'danger'
                                : caseDetail.severity === 'high'
                                ? 'warning'
                                : 'neutral'
                            }
                            size="sm"
                          >
                            {SEVERITY_LABELS[caseDetail.severity]}
                          </StatusPill>
                        </p>
                      </DetailPanel>
                    </div>

                    {/* Linked alerts */}
                    {caseDetail.stream_id && (
                      <DetailPanel>
                        <p className="text-xs text-text-tertiary">关联画面</p>
                        <p className="mt-1 text-sm text-text-primary">{caseDetail.device_name}</p>
                        <p className="text-xs text-text-secondary">{caseDetail.stream_id}</p>
                      </DetailPanel>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </React.Fragment>
      )}

      {/* =============== Gallery Mode =============== */}
      {mode === 'gallery' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterPillGroup>
              {([
                { value: 'all' as GalleryTab, label: '全部' },
                { value: 'starred' as GalleryTab, label: '收藏' },
                { value: 'trash' as GalleryTab, label: '回收站' },
              ] as const).map((tab) => (
                <FilterPill
                  key={tab.value}
                  active={galleryTab === tab.value}
                  onClick={() => setGalleryTab(tab.value)}
                >
                  {tab.label}
                </FilterPill>
              ))}
            </FilterPillGroup>
            <div className="flex items-center gap-2">
              <Link
                to="/gallery"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
              >
                <span className="text-[10px]">↗</span>完整航拍图库
              </Link>
              <Input
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder={galleryTab === 'trash' ? '搜索回收站' : '搜索文件名、标签'}
                prefix={<Search className="h-4 w-4" />}
                className="w-56"
              />
              <Button
                variant={gallerySelectMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { setGallerySelectMode((e) => !e); setGallerySelected(new Set()); }}
              >
                {gallerySelectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {gallerySelectMode ? '退出多选' : '批量选择'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {galleryIsLoading && galleryAllPhotos.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : galleryFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-text-tertiary">
                  <FileSearch className="mb-3 h-8 w-8" />
                  <p className="text-sm">
                    {galleryTab === 'trash' ? '回收站为空' : galleryTab === 'starred' ? '暂无收藏' : gallerySearch ? '没有找到匹配的图片' : '当前没有图片'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {galleryFiltered.map((photo) => {
                      const isSelected = gallerySelected.has(photo.id);
                      const isFocused = galleryFocusedPhoto?.id === photo.id;
                      return (
                        <div
                          key={photo.id}
                          className={cn(
                            'group overflow-hidden rounded-xl border transition-all duration-normal',
                            isFocused || isSelected
                              ? 'border-accent/30 bg-accent/6 shadow-panel'
                              : 'border-border bg-bg-secondary hover:border-border-strong hover:bg-bg-muted',
                          )}
                        >
                          <div className="relative aspect-square overflow-hidden">
                            <img src={photo.imageFull} alt={photo.tag} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
                            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                              <span className="max-w-[60%] truncate rounded-full bg-bg-surface/70 px-2 py-0.5 text-[11px] font-medium text-text-primary backdrop-blur-sm">{photo.tag}</span>
                              <div className="flex items-center gap-2">
                                {photo.starred && (
                                  <div className="rounded-full bg-warning-muted p-1.5 backdrop-blur"><Star className="h-3 w-3 fill-warning text-warning" /></div>
                                )}
                                {gallerySelectMode && (
                                  <button type="button" className="rounded-full bg-bg-surface/70 p-1.5 text-text-primary backdrop-blur-sm" onClick={() => galleryToggleSelect(photo.id)}>
                                    {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                              <button type="button" className="min-w-0 text-left" onClick={() => setGalleryFocusedId(photo.id)}>
                                <p className="truncate text-sm font-medium text-text-primary">#{photo.id}</p>
                                <p className="text-xs text-text-secondary">{photo.date}</p>
                              </button>
                              <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-normal group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => { setGalleryFocusedId(photo.id); setGalleryPreviewId(photo.id); }}
                                  className="rounded-full border border-border/65 bg-bg-secondary/92 p-1.5 text-text-primary shadow-panel backdrop-blur transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-primary"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => galleryHandleToggleStar(photo.id)}
                                  className="rounded-full border border-border/65 bg-bg-secondary/92 p-1.5 text-text-primary shadow-panel backdrop-blur transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-bg-primary"
                                >
                                  <Star className={cn('h-3.5 w-3.5', photo.starred && 'fill-current text-warning')} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {galleryTab !== 'trash' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>第 {galleryPage} 页</span>
                        {galleryIsFetching && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                        <span className="text-xs">共 {galleryTotal} 张</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setGalleryPage((p) => Math.max(p - 1, 1))}>上一页</Button>
                        <Button variant="outline" size="sm" onClick={() => setGalleryPage((p) => p + 1)}>下一页</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
              {galleryFocusedPhoto ? (
                <>
                  <div className="overflow-hidden rounded-xl">
                    <img src={galleryFocusedPhoto.imageFull} alt={galleryFocusedPhoto.tag} className="aspect-[4/3] w-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    <DetailPanel className="py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">上传时间</span>
                        <span className="text-xs font-medium text-text-primary">{galleryFocusedPhoto.date} {galleryFocusedPhoto.time}</span>
                      </div>
                    </DetailPanel>
                    <DetailPanel className="py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">标签</span>
                        <span className="max-w-[60%] truncate text-right text-xs font-medium text-text-primary">{galleryFocusedPhoto.tag || '—'}</span>
                      </div>
                    </DetailPanel>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setGalleryPreviewId(galleryFocusedPhoto.id)}><Eye className="h-3.5 w-3.5" />放大</Button>
                    <Button variant="secondary" size="sm" onClick={() => galleryHandleToggleStar(galleryFocusedPhoto.id)}>
                      <Star className={cn('h-3.5 w-3.5', galleryFocusedPhoto.starred && 'fill-current')} />
                      {galleryFocusedPhoto.starred ? '取消' : '收藏'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => galleryDownload(galleryFocusedPhoto.imageFull, galleryFocusedPhoto.id)}><Share2 className="h-3.5 w-3.5" />下载</Button>
                    <Button variant="outline" size="sm" onClick={() => void galleryShare(galleryFocusedPhoto.imageFull)}><Share2 className="h-3.5 w-3.5" />分享</Button>
                  </div>
                </>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-secondary">选择图片查看详情</div>
              )}

              {gallerySelectedCount > 0 && (
                <div className="space-y-2 rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <p className="text-xs text-text-secondary">已选中 {gallerySelectedCount} 张</p>
                  <div className="grid gap-2">
                    {galleryTab === 'trash' ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => galleryHandleRestore([...gallerySelected])}><RotateCcw className="h-3.5 w-3.5" />批量恢复</Button>
                        <Button variant="destructive" size="sm" onClick={() => galleryHandlePermanentDelete([...gallerySelected])}><Trash2 className="h-3.5 w-3.5" />彻底删除</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setGalleryAnalysisOpen(true)}><Sparkles className="h-3.5 w-3.5" />AI 分析</Button>
                        <Button size="sm" onClick={() => setGalleryReportOpen(true)}><ScrollText className="h-3.5 w-3.5" />生成报告</Button>
                        <Button variant="secondary" size="sm" onClick={() => galleryHandleDedupe([...gallerySelected])}><Sparkles className="h-3.5 w-3.5" />一键去重</Button>
                        <Button variant="outline" size="sm" onClick={() => galleryHandleMoveToTrash([...gallerySelected])}><Trash2 className="h-3.5 w-3.5" />移入回收站</Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={gallerySelectAll}>
                      {gallerySelected.size === galleryFiltered.length ? '取消全选' : '全选当前页'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
                      'rounded-xl px-3 py-3 text-left transition-all duration-normal',
                      selectedItem?.id === item.id
                        ? 'bg-accent/10 border border-accent/20'
                        : 'bg-bg-tertiary/50 hover:bg-bg-muted',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{item.folder}</p>
                      </div>
                      <StatusPill
                        tone={
                          item.kind === '缺陷记录'
                            ? 'warning'
                            : item.kind === '录像'
                            ? 'accent'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {item.kind}
                      </StatusPill>
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
                    <FilterPillGroup>
                      <FilterPill active={selectedItem.kind === '缺陷记录'}>
                        {selectedItem.kind}
                      </FilterPill>
                      <FilterPill>
                        {selectedItem.folder}
                      </FilterPill>
                    </FilterPillGroup>
                    <DetailPanel>
                      <p className="text-sm leading-6 text-text-secondary">{selectedItem.summary}</p>
                    </DetailPanel>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">选择左侧资料查看详情</p>
                )}
              </div>

              <div className="min-h-0 flex-1 space-y-3">
                <p className="text-sm font-medium text-text-primary">关联上下文</p>
                <div className="space-y-3">
                  <DetailPanel>
                    <p className="text-xs text-text-tertiary">来源对象</p>
                    <p className="mt-1 text-sm text-text-primary">
                      {relatedStream ? String(relatedStream.name ?? '') : '当前资料未直接绑定视频源'}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {relatedStream ? String(relatedStream.location ?? '') : '可继续通过智能检索补全来源上下文。'}
                    </p>
                  </DetailPanel>
                </div>

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
                            className="w-full rounded-xl border border-border bg-bg-primary/65 px-4 py-3 text-left transition-colors hover:bg-bg-muted"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-text-primary">{String(alert.title ?? '')}</p>
                              <StatusPill tone={String(alert.level ?? '') === '紧急' ? 'danger' : 'warning'} size="sm">
                                {String(alert.level ?? '提示')}
                              </StatusPill>
                            </div>
                            <p className="mt-2 text-xs text-text-secondary">{String(alert.message ?? '')}</p>
                          </button>
                        ))
                      ) : (
                        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
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
                          className="w-full rounded-xl bg-bg-primary px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg-muted"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                </section>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Dialogs */}
      <DefectAnalyzeDialog
        open={_galleryAnalysisOpen}
        onOpenChange={setGalleryAnalysisOpen}
        selectedPhotos={gallerySelectedList}
        onAnalyzeComplete={(results) => {
          const confirmedRegions = results.reduce((sum, r) => sum + r.regions.length, 0);
          toast({ title: `分析完成`, description: `已确认 ${confirmedRegions} 个缺陷区域` });
        }}
      />
      <ReportDialog
        open={_galleryReportOpen}
        onOpenChange={setGalleryReportOpen}
        selectedPhotos={gallerySelectedList as Parameters<typeof ReportDialog>[0]['selectedPhotos']}
      />

      <BatchToolbar
        selectedIds={gallerySelected}
        onStar={(ids) => ids.forEach((id) => galleryHandleToggleStar(id))}
        onDelete={galleryHandleMoveToTrash}
        onMove={galleryHandleMoveToTrash}
        onDownload={galleryHandleDownload}
        onClearSelection={galleryHandleClearSelection}
        onAIAnalyze={galleryTab !== 'trash' ? () => setGalleryAnalysisOpen(true) : undefined}
        onGenerateReport={galleryTab !== 'trash' ? () => setGalleryReportOpen(true) : undefined}
      />

      {galleryPreviewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4" onClick={() => setGalleryPreviewId(null)}>
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="surface-panel overflow-hidden rounded-2xl bg-black/70">
              <div className="flex items-center justify-between border-b border-border-strong px-5 py-4 text-text-primary">
                <div>
                  <p className="text-sm font-medium">{galleryPreviewPhoto.tag || '照片'}</p>
                  <p className="mt-1 text-xs text-text-primary/70">{galleryPreviewPhoto.date} · {galleryPreviewPhoto.time} · #{galleryPreviewPhoto.id}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setGalleryPreviewId(null)} className="text-text-primary hover:bg-bg-muted"><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex items-center justify-center bg-black p-4">
                  <img src={galleryPreviewPhoto.imageFull} alt={galleryPreviewPhoto.tag} className="max-h-[72vh] w-full rounded-2xl object-contain" />
                </div>
                <div className="border-l border-border-strong bg-black/30 p-5 text-text-primary">
                  <div className="space-y-3">
                    {[
                      { label: '上传时间', value: `${galleryPreviewPhoto.date} ${galleryPreviewPhoto.time}` },
                      { label: '标签', value: galleryPreviewPhoto.tag || '—' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-bg-hover px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-text-primary/55">{item.label}</p>
                        <p className="mt-2 break-all text-sm text-text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2">
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => galleryHandleToggleStar(galleryPreviewPhoto.id)}>
                      <Star className={cn('h-4 w-4', galleryPreviewPhoto.starred && 'fill-current text-warning')} />{galleryPreviewPhoto.starred ? '取消收藏' : '加入收藏'}
                    </Button>
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => galleryDownload(galleryPreviewPhoto.imageFull, galleryPreviewPhoto.id)}>
                      <Share2 className="h-4 w-4" />下载原图
                    </Button>
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => void galleryShare(galleryPreviewPhoto.imageFull)}>
                      <Share2 className="h-4 w-4" />分享链接
                    </Button>
                    {galleryTab !== 'trash' ? (
                      <Button variant="destructive" className="justify-start" onClick={() => galleryHandleMoveToTrash([galleryPreviewPhoto.id])}><Trash2 className="h-4 w-4" />移入回收站</Button>
                    ) : (
                      <>
                        <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => galleryHandleRestore([galleryPreviewPhoto.id])}><RotateCcw className="h-4 w-4" />恢复图片</Button>
                        <Button variant="destructive" className="justify-start" onClick={() => galleryHandlePermanentDelete([galleryPreviewPhoto.id])}><Trash2 className="h-4 w-4" />彻底删除</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Report Draft Card Sub-component
// =============================================================================

export function ReportDraftCard({ draft, onCompose }: { draft: ReportDraft; onCompose: (prompt: string, source?: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-bg-primary/60 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{draft.title}</p>
        <StatusPill tone={draft.status === 'approved' ? 'success' : draft.status === 'draft' ? 'warning' : 'neutral'} size="sm">
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
              className="inline-flex items-center gap-1 rounded-md bg-bg-tertiary px-2.5 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-bg-muted"
            >
              <Bot className="h-3 w-3" /> 编辑
            </button>
            <button
              type="button"
              onClick={() => onCompose(`请确认报告草稿「${draft.title}」，检查内容完整性后转为正式报告。`, draft.title)}
              className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              <FileCheck className="h-3 w-3" /> 确认归档
            </button>
          </>
        )}
        {draft.status === 'approved' && (
          <button
            type="button"
            onClick={() => onCompose(`请导出报告「${draft.title}」为 PDF 格式。`, draft.title)}
            className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
          >
            <ScrollText className="h-3 w-3" /> 导出
          </button>
        )}
      </div>
    </div>
  );
}
