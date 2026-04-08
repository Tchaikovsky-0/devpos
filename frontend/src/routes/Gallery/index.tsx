import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  CheckSquare,
  Download,
  Eye,
  FileText,
  Heart,
  Info,
  Loader2,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Square,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/toast';
import { DefectAnalyzeDialog, ReportDialog } from '@/components/gallery';
import { BatchToolbar } from '@/components/media/BatchToolbar';
import { composeOpenClaw } from '@/components/openclaw/openclawBridge';
import { EmptyPanel, MetaPill, PageHeader, SegmentedControl } from '@/components/workspace/Workbench';
import { AIFab, type AIFabAction } from '@/components/layout/AIFab';
import { cn } from '@/lib/utils';
import {
  MediaItem,
  useListMediaQuery,
  useListTrashMediaQuery,
  useToggleStarMutation,
  useMoveToTrashMutation,
  useRestoreFromTrashMutation,
  usePermanentDeleteTrashMutation,
} from '@/store/api/mediaApi';

type GalleryTab = 'all' | 'starred' | 'trash';

/** Shared Photo type used by Gallery and its dialogs */
export interface Photo {
  id: number;
  imageFull: string;
  tag: string;
  time: string;
  date: string;
  starred?: boolean;
  alt?: number | null;
  lat?: number | null;
  lng?: number | null;
}

function toPhoto(item: MediaItem): Photo {
  const createdAt = item.created_at ? new Date(item.created_at) : new Date();
  const dateStr = createdAt.toLocaleDateString('zh-CN');
  const timeStr = createdAt.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const tag = item.description || item.original_name || item.filename;

  return {
    id: item.id,
    imageFull: item.url,
    tag,
    date: dateStr,
    time: timeStr,
    starred: item.starred ?? false,
    alt: null,
    lat: null,
    lng: null,
  };
}

const tabOptions: Array<{ value: GalleryTab; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'starred', label: '收藏' },
  { value: 'trash', label: '回收站' },
];

export const Gallery = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<GalleryTab>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [focusedPhotoId, setFocusedPhotoId] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [previewShowMeta, setPreviewShowMeta] = useState(false);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [bulkPermanentOpen, setBulkPermanentOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const pageSize = 24;

  const {
    data: allMediaData,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
  } = useListMediaQuery({ page: currentPage, page_size: pageSize }, { skip: tab === 'trash' });

  const {
    data: trashData,
    isLoading: isLoadingTrash,
    isFetching: isFetchingTrash,
  } = useListTrashMediaQuery({ page: currentPage, page_size: pageSize }, { skip: tab !== 'trash' });

  const [toggleStarApi] = useToggleStarMutation();
  const [moveToTrashApi] = useMoveToTrashMutation();
  const [restoreFromTrashApi] = useRestoreFromTrashMutation();
  const [permanentDeleteTrashApi] = usePermanentDeleteTrashMutation();

  const allPhotos = useMemo<Photo[]>(() => {
    const inner = allMediaData as { data: MediaItem[]; total: number; page: number; page_size: number } | undefined;
    return (inner?.data ?? []).map(toPhoto);
  }, [allMediaData]);
  const trashPhotos = useMemo<Photo[]>(() => {
    const inner = trashData as { data: MediaItem[]; total: number; page: number; page_size: number } | undefined;
    return (inner?.data ?? []).map(toPhoto);
  }, [trashData]);

  const total = (allMediaData as { data: MediaItem[]; total: number } | undefined)?.total ?? 0;
  const trashTotal = (trashData as { data: MediaItem[]; total: number } | undefined)?.total ?? 0;
  const isLoading = tab === 'trash' ? isLoadingTrash : isLoadingAll;
  const isFetching = tab === 'trash' ? isFetchingTrash : isFetchingAll;

  const sourceList = useMemo(() => {
    if (tab === 'trash') return trashPhotos;
    if (tab === 'starred') return allPhotos.filter((p) => p.starred);
    return allPhotos;
  }, [tab, allPhotos, trashPhotos]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sourceList;
    const query = search.toLowerCase();
    return sourceList.filter(
      (p) =>
        p.tag.toLowerCase().includes(query) ||
        p.date.includes(query) ||
        p.imageFull.toLowerCase().includes(query),
    );
  }, [search, sourceList]);

  const starredCount = allPhotos.filter((p) => p.starred).length;
  const selectedCount = selected.size;

  const selectedPhotoList = useMemo(
    () => sourceList.filter((p) => selected.has(p.id)),
    [sourceList, selected],
  );

  const previewPhoto = useMemo(
    () => (preview == null ? null : sourceList.find((p) => p.id === preview) ?? null),
    [sourceList, preview],
  );

  const focusedPhoto = useMemo(() => {
    if (focusedPhotoId != null) {
      const target = sourceList.find((p) => p.id === focusedPhotoId);
      if (target) return target;
    }
    return selectedPhotoList[0] ?? filtered[0] ?? null;
  }, [focusedPhotoId, sourceList, selectedPhotoList, filtered]);

  const previewInTrash = tab === 'trash';

  // AIFab 操作
  const galleryAiActions: AIFabAction[] = useMemo(
    () => [
      {
        label: 'AI 分析',
        description: selectedCount > 0 ? `${selectedCount} 张选中` : '请先选择图片',
        tone: 'accent' as const,
        onClick: () => {
          if (selectedCount === 0) {
            toast({ title: '请先选择图片', variant: 'destructive' });
            return;
          }
          setAnalysisOpen(true);
        },
      },
      {
        label: '生成报告',
        onClick: () => {
          if (selectedCount === 0) {
            toast({ title: '请先选择图片', variant: 'destructive' });
            return;
          }
          setReportOpen(true);
        },
      },
      {
        label: 'OpenClaw 研判',
        onClick: () => {
          if (selectedCount === 0) {
            toast({ title: '请先选择图片', variant: 'destructive' });
            return;
          }
          const first = selectedPhotoList[0];
          composeOpenClaw({
            prompt: `请分析以下航拍图片：${selectedCount} 张选中照片。分析内容：识别潜在缺陷、异常或安全隐患，并给出专业处置建议。`,
            source: first?.tag ?? first?.imageFull ?? '航拍图片',
          });
        },
      },
    ],
    [selectedCount, selectedPhotoList],
  );

  useEffect(() => { setPreviewShowMeta(false); }, [preview]);
  useEffect(() => { setCurrentPage(1); setSelected(new Set()); }, [tab, search]);
  useEffect(() => {
    if (filtered.length > 0) {
      if (!focusedPhotoId || !filtered.some((p) => p.id === focusedPhotoId)) {
        setFocusedPhotoId(filtered[0].id);
      }
    } else {
      setFocusedPhotoId(null);
    }
  }, [filtered, focusedPhotoId]);

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }, [filtered, selected.size]);

  const loadMore = useCallback(() => {
    if (!isFetching) setCurrentPage((p) => p + 1);
  }, [isFetching]);

  const handleToggleStar = useCallback(
    (id: number) => {
      toggleStarApi(id)
        .unwrap()
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [toggleStarApi],
  );

  const handleMoveToTrash = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      ids.forEach((id) => {
        moveToTrashApi(id)
          .unwrap()
          .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
      });
      setSelected(new Set());
      toast({ title: `已移入回收站（${ids.length} 张）` });
    },
    [moveToTrashApi],
  );

  const handleRestore = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      restoreFromTrashApi({ ids })
        .unwrap()
        .then(() => toast({ title: `已恢复 ${ids.length} 张照片` }))
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [restoreFromTrashApi],
  );

  const handlePermanentDelete = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      permanentDeleteTrashApi({ ids })
        .unwrap()
        .then(() => toast({ title: `已彻底删除 ${ids.length} 张照片` }))
        .catch(() => toast({ title: '操作失败，请重试', variant: 'destructive' }));
    },
    [permanentDeleteTrashApi],
  );

  const handleAIAnalyze = useCallback(() => {
    setAnalysisOpen(true);
  }, []);

  const handleGenerateReport = useCallback(() => {
    setReportOpen(true);
  }, []);

  const handleDownload = useCallback(
    (ids: number[]) => {
      ids.forEach((id) => {
        const photo = sourceList.find((p) => p.id === id);
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
    [sourceList],
  );

  const handleClearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const totalPages = Math.ceil((tab === 'trash' ? trashTotal : total) / pageSize) || 1;

  return (
    <div className="px-4 py-6 md:px-8">
      <PageHeader
        title="图片库"
        meta={
          <>
            <MetaPill label="总图片" value={total} />
            <MetaPill label="收藏" value={starredCount} tone="accent" />
            <MetaPill label="回收站" value={trashTotal} tone={trashTotal > 0 ? 'warning' : 'default'} />
          </>
        }
        actions={
          <>
            <Button
              variant={selectMode ? 'primary' : 'secondary'}
              onClick={() => { setSelectMode((e) => !e); setSelected(new Set()); }}
            >
              {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {selectMode ? '退出多选' : '批量选择'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/media')}>
              <Plus className="h-4 w-4" />
              导入图片
            </Button>
          </>
        }
      />

      <AIFab actions={galleryAiActions} />

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl value={tab} onChange={(v) => setTab(v as GalleryTab)} options={tabOptions} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'trash' ? '搜索回收站' : '搜索标签、文件名'}
              prefix={<Search className="h-4 w-4" />}
              className="w-64"
            />
          </div>

          {isLoading && allPhotos.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyPanel
              title={tab === 'trash' ? '回收站还是空的' : tab === 'starred' ? '还没有收藏图片' : search ? '没有找到匹配的图片' : '当前没有图片'}
              description={tab === 'trash' ? '删除图片后会先进入回收站，这里可以继续恢复或永久删除。' : search ? '调整搜索条件后重试。' : '导入新的巡检图片开始使用。'}
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((photo) => {
                  const isSelected = selected.has(photo.id);
                  const isFocused = focusedPhoto?.id === photo.id;
                  return (
                    <div
                      key={photo.id}
                      className={cn(
                        'group overflow-hidden rounded-[24px] border transition-all duration-normal',
                        isFocused || isSelected ? 'border-accent/30 bg-accent/6 shadow-panel' : 'border-border bg-bg-surface hover:border-border-emphasis hover:bg-bg-light',
                      )}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <img src={photo.imageFull} alt={photo.tag} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                          <span className="max-w-[60%] truncate rounded-full bg-bg-surface/70 px-2.5 py-1 text-[11px] font-medium text-text-primary backdrop-blur-sm">{photo.tag}</span>
                          <div className="flex items-center gap-2">
                            {photo.starred && <div className="rounded-full bg-warning-muted p-2 backdrop-blur"><Star className="h-3.5 w-3.5 fill-warning text-warning" /></div>}
                            {selectMode && (
                              <button type="button" className="rounded-full bg-bg-surface/70 p-2 text-text-primary backdrop-blur-sm" onClick={() => toggleSelect(photo.id)}>
                                {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                          <button type="button" className="min-w-0 text-left" onClick={() => setFocusedPhotoId(photo.id)}>
                            <p className="truncate text-sm font-medium text-text-primary">#{photo.id}</p>
                            <p className="mt-1 text-xs text-text-secondary">{photo.date} · {photo.time}</p>
                          </button>
                          <div className="flex items-center gap-2 opacity-0 transition-opacity duration-normal group-hover:opacity-100">
                            <button type="button" onClick={() => { setFocusedPhotoId(photo.id); setPreview(photo.id); }} className="rounded-full border border-border/65 bg-bg-base/92 p-2 text-text-primary shadow-panel backdrop-blur transition-all duration-normal hover:-translate-y-0.5 hover:border-border-emphasis hover:bg-bg-primary">
                              <Eye className="h-4 w-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="rounded-full border border-border/65 bg-bg-base/92 p-2 text-text-primary shadow-panel backdrop-blur transition-all duration-normal hover:-translate-y-0.5 hover:border-border-emphasis hover:bg-bg-primary">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => { setFocusedPhotoId(photo.id); setPreview(photo.id); }}>预览</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStar(photo.id)}><Star className="mr-2 h-4 w-4" />{photo.starred ? '取消收藏' : '加入收藏'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadImage(photo.imageFull, photo.id)}><Download className="mr-2 h-4 w-4" />下载</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => void sharePhoto(photo.imageFull)}><Share2 className="mr-2 h-4 w-4" />分享</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {tab !== 'trash' ? (
                                  <DropdownMenuItem className="text-error focus:text-error" onClick={() => handleMoveToTrash([photo.id])}><Trash2 className="mr-2 h-4 w-4" />移入回收站</DropdownMenuItem>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRestore([photo.id])}><RotateCcw className="mr-2 h-4 w-4" />恢复</DropdownMenuItem>
                                    <DropdownMenuItem className="text-error focus:text-error" onClick={() => handlePermanentDelete([photo.id])}><Trash2 className="mr-2 h-4 w-4" />彻底删除</DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {tab !== 'trash' && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-border bg-bg-surface px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <span>第 {currentPage} / {totalPages} 页</span>
                    {isFetching && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                    <span className="text-xs">共 {total} 张</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 1 || isFetching} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>上一页</Button>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages || isFetching} onClick={loadMore}>下一页</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          {focusedPhoto ? (
            <>
              <div className="overflow-hidden rounded-[20px]">
                <img src={focusedPhoto.imageFull} alt={focusedPhoto.tag} className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-[14px] bg-bg-surface/50 px-3 py-2">
                  <span className="text-xs text-text-secondary">上传时间</span>
                  <span className="text-xs font-medium text-text-primary">{focusedPhoto.date} {focusedPhoto.time}</span>
                </div>
                <div className="flex items-center justify-between rounded-[14px] bg-bg-surface/50 px-3 py-2">
                  <span className="text-xs text-text-secondary">标签</span>
                  <span className="max-w-[60%] truncate text-right text-xs font-medium text-text-primary">{focusedPhoto.tag || '—'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPreview(focusedPhoto.id)}><Eye className="h-3.5 w-3.5" />放大</Button>
                <Button variant="secondary" size="sm" onClick={() => handleToggleStar(focusedPhoto.id)}><Heart className={cn('h-3.5 w-3.5', focusedPhoto.starred && 'fill-current')} />{focusedPhoto.starred ? '取消收藏' : '收藏'}</Button>
                <Button variant="outline" size="sm" onClick={() => downloadImage(focusedPhoto.imageFull, focusedPhoto.id)}><Download className="h-3.5 w-3.5" />下载</Button>
                <Button variant="outline" size="sm" onClick={() => void sharePhoto(focusedPhoto.imageFull)}><Share2 className="h-3.5 w-3.5" />分享</Button>
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-text-secondary">选择一张图片查看详情</div>
          )}

          {selectedCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">已选中 {selectedCount} 张</p>
              <div className="grid gap-2">
                {tab === 'trash' ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => handleRestore([...selected])}><RotateCcw className="h-3.5 w-3.5" />批量恢复</Button>
                    <Button variant="destructive" size="sm" onClick={() => setBulkPermanentOpen(true)}><Trash2 className="h-3.5 w-3.5" />彻底删除</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setAnalysisOpen(true)}><Brain className="h-3.5 w-3.5" />AI 分析</Button>
                    <Button size="sm" onClick={() => setReportOpen(true)}><FileText className="h-3.5 w-3.5" />生成报告</Button>
                    <Button variant="outline" size="sm" onClick={() => handleMoveToTrash([...selected])}><Trash2 className="h-3.5 w-3.5" />移入回收站</Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={selectAll}>{selected.size === filtered.length ? '取消全选' : '全选当前页'}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {preview !== null && previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="surface-panel overflow-hidden rounded-[28px] bg-black/70">
              <div className="flex items-center justify-between border-b border-border-strong px-5 py-4 text-text-primary">
                <div>
                  <p className="text-sm font-medium">{previewPhoto.tag || '照片'}</p>
                  <p className="mt-1 text-xs text-text-primary/70">{previewPhoto.date} · {previewPhoto.time} · #{previewPhoto.id}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setPreview(null)} className="text-text-primary hover:bg-bg-muted"><X className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex items-center justify-center bg-black p-4">
                  <img src={previewPhoto.imageFull} alt={previewPhoto.tag} className="max-h-[72vh] w-full rounded-[24px] object-contain" />
                </div>
                <div className="border-l border-border-strong bg-black/30 p-5 text-text-primary">
                  <div className="space-y-3">
                    {[
                      { label: '上传时间', value: `${previewPhoto.date} ${previewPhoto.time}` },
                      { label: '标签', value: previewPhoto.tag || '—' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[18px] bg-bg-hover px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-text-primary/55">{item.label}</p>
                        <p className="mt-2 break-all text-sm text-text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-2">
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => handleToggleStar(previewPhoto.id)}>
                      <Star className={cn('h-4 w-4', previewPhoto.starred && 'fill-current text-warning')} />{previewPhoto.starred ? '取消收藏' : '加入收藏'}
                    </Button>
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => downloadImage(previewPhoto.imageFull, previewPhoto.id)}>
                      <Download className="h-4 w-4" />下载原图
                    </Button>
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => void sharePhoto(previewPhoto.imageFull)}>
                      <Share2 className="h-4 w-4" />分享链接
                    </Button>
                    <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => setPreviewShowMeta((v) => !v)}>
                      <Info className="h-4 w-4" />{previewShowMeta ? '隐藏详情' : '显示详情'}
                    </Button>
                    {!previewInTrash ? (
                      <Button variant="destructive" className="justify-start" onClick={() => handleMoveToTrash([previewPhoto.id])}><Trash2 className="h-4 w-4" />移入回收站</Button>
                    ) : (
                      <>
                        <Button variant="secondary" className="justify-start bg-bg-muted text-text-primary hover:bg-bg-muted" onClick={() => handleRestore([previewPhoto.id])}><RotateCcw className="h-4 w-4" />恢复图片</Button>
                        <Button variant="destructive" className="justify-start" onClick={() => handlePermanentDelete([previewPhoto.id])}><Trash2 className="h-4 w-4" />彻底删除</Button>
                      </>
                    )}
                  </div>
                  {previewShowMeta && (
                    <div className="mt-5 rounded-[20px] bg-bg-hover p-4 text-xs text-text-secondary">图片 ID {previewPhoto.id} · 来源为媒体库，支持继续进入 AI 分析或生成报告工作流。</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DefectAnalyzeDialog
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        selectedPhotos={selectedPhotoList}
        onAnalyzeComplete={(results) => {
          const confirmedRegions = results.reduce((sum, r) => sum + r.regions.length, 0);
          toast({
            title: `分析完成`,
            description: `已确认 ${confirmedRegions} 个缺陷区域`,
          });
        }}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedPhotos={selectedPhotoList as any}
      />

      <BatchToolbar
        selectedIds={selected}
        onStar={(ids) => ids.forEach((id) => handleToggleStar(id))}
        onDelete={handleMoveToTrash}
        onMove={handleMoveToTrash}
        onDownload={handleDownload}
        onClearSelection={handleClearSelection}
        onAIAnalyze={tab !== 'trash' ? handleAIAnalyze : undefined}
        onGenerateReport={tab !== 'trash' ? handleGenerateReport : undefined}
      />

      <AlertDialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空回收站？</AlertDialogTitle>
            <AlertDialogDescription>将永久删除回收站中的 {trashPhotos.length} 张照片，此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-error text-text-primary hover:bg-error" onClick={() => {
              const ids = trashPhotos.map((p) => p.id);
              handlePermanentDelete(ids);
              setEmptyTrashOpen(false);
              setSelected(new Set());
              setPreview(null);
              setFocusedPhotoId(null);
            }}>
              清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkPermanentOpen} onOpenChange={setBulkPermanentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>彻底删除所选图片？</AlertDialogTitle>
            <AlertDialogDescription>将永久删除 {selectedCount} 张图片，无法恢复。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-error text-text-primary hover:bg-error" onClick={() => {
              handlePermanentDelete([...selected]);
              setBulkPermanentOpen(false);
            }}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function downloadImage(url: string, id: number) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `media_${id}.jpg`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.click();
  toast({ title: '已开始下载', description: '若未开始，请在新标签页中右键保存图片' });
}

async function sharePhoto(url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title: '航拍照片', text: '来自巡检宝图片库', url });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Share failed, falling back to copy link:', err);
    }
  }
  void navigator.clipboard.writeText(url).then(() => toast({ title: '图片链接已复制' })).catch(() => toast({ title: '复制失败', variant: 'destructive' }));
}

export default Gallery;
