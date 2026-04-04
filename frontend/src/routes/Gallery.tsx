import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brain,
  CheckSquare,
  Download,
  Eye,
  FileText,
  Heart,
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/Input';
import { toast } from '../components/ui/toast';
import { AnalysisDialog, ReportDialog } from '../components/gallery';
import { EmptyPanel, MetaPill, PageHeader, SegmentedControl } from '../components/workspace/Workbench';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'coai-gallery-v1';

type GalleryTab = 'all' | 'starred' | 'trash';

type Photo = {
  id: number;
  time: string;
  date: string;
  alt: number;
  lat: number;
  lng: number;
  tag: string;
  starred: boolean;
  image: string;
  imageFull: string;
};

const DRONE_SQUARE_THUMB_QS = 'w=560&h=560&fit=crop&auto=format&q=80';
const DRONE_FULL_QS = 'w=1920&h=1280&fit=crop&auto=format&q=82';

const droneImageIds = [
  'photo-1507619579562-f2e10da1ec86',
  'photo-1497435334941-8c899ee9e8e9',
  'photo-1530044426743-4b7125613d93',
  'photo-1506624183912-c602f4a21ca7',
  'photo-1564450361329-c045112726b2',
  'photo-1633792892356-cc6ba577dd9e',
  'photo-1715199399795-73deba5bee63',
  'photo-1678872590530-181ff9b5db92',
  'photo-1640108641535-d8ed7f1071f1',
  'photo-1719176006159-a86dd4c84696',
  'photo-1713342902715-6248e4409a8f',
  'photo-1652044812681-cbddd059fdc1',
] as const;

const droneSquareThumb = (id: string) => `https://images.unsplash.com/${id}?${DRONE_SQUARE_THUMB_QS}`;
const droneFull = (id: string) => `https://images.unsplash.com/${id}?${DRONE_FULL_QS}`;

const mockPhotos: Photo[] = Array.from({ length: 12 }, (_, index) => {
  const id = droneImageIds[index];
  return {
    id: index + 1,
    time: `14:${(30 + index * 2).toString().padStart(2, '0')}:${(10 + index * 5) % 60}`.padEnd(8, '0').slice(0, 8),
    date: '2026-03-23',
    alt: 60 + Math.round(Math.random() * 100),
    lat: 31.2397 + (Math.random() - 0.5) * 0.01,
    lng: 121.4998 + (Math.random() - 0.5) * 0.01,
    tag: ['巡检', '监测', '测绘', '搜救'][index % 4],
    starred: false,
    image: droneSquareThumb(id),
    imageFull: droneFull(id),
  };
});

function loadStored(): { photos: Photo[]; trash: Photo[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.photos) || !Array.isArray(parsed.trash)) return null;
    return { photos: parsed.photos as Photo[], trash: parsed.trash as Photo[] };
  } catch {
    return null;
  }
}

const tabOptions: Array<{ value: GalleryTab; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'starred', label: '收藏' },
  { value: 'trash', label: '回收站' },
];

export const Gallery = () => {
  const [photos, setPhotos] = useState<Photo[]>(() =>
    typeof window !== 'undefined' ? loadStored()?.photos ?? mockPhotos : mockPhotos,
  );
  const [trash, setTrash] = useState<Photo[]>(() =>
    typeof window !== 'undefined' ? loadStored()?.trash ?? [] : [],
  );

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
  const pageSize = 12;
  const totalPhotos = 96;
  const [isLoading, setIsLoading] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setPreviewShowMeta(false);
  }, [preview]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ photos, trash }));
    } catch (error) {
      console.warn('Failed to persist gallery state:', error);
    }
  }, [photos, trash]);

  const loadMorePhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhotos((previous) => {
        const start = previous.length;
        const extraPhotos = Array.from({ length: pageSize }, (_, index) => {
          const imageId = droneImageIds[(start + index) % droneImageIds.length];
          return {
            id: start + index + 1,
            time: `15:${(index * 3 + 10).toString().padStart(2, '0')}:${(index * 7) % 60}`.padEnd(8, '0').slice(0, 8),
            date: '2026-03-24',
            alt: 60 + Math.round(Math.random() * 120),
            lat: 31.2397 + (Math.random() - 0.5) * 0.01,
            lng: 121.4998 + (Math.random() - 0.5) * 0.01,
            tag: ['巡检', '监测', '测绘', '搜救'][index % 4],
            starred: false,
            image: droneSquareThumb(imageId),
            imageFull: droneFull(imageId),
          };
        });
        return [...previous, ...extraPhotos];
      });
    } catch (error) {
      toast({ title: '加载失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sourceList = useMemo(() => {
    if (tab === 'trash') return trash;
    if (tab === 'starred') return photos.filter((photo) => photo.starred);
    return photos;
  }, [photos, tab, trash]);

  const filtered = useMemo(() => {
    let nextList = sourceList;
    if (search.trim()) {
      const query = search.toLowerCase();
      nextList = nextList.filter(
        (photo) =>
          photo.tag.toLowerCase().includes(query) ||
          photo.time.includes(query) ||
          photo.date.includes(query),
      );
    }
    return nextList;
  }, [search, sourceList]);

  const paginatedPhotos = useMemo(() => {
    if (tab !== 'all') return filtered;
    return filtered.slice(0, currentPage * pageSize);
  }, [currentPage, filtered, tab]);

  const selectedPhotoList = useMemo(
    () => [...photos, ...trash].filter((photo) => selected.has(photo.id)),
    [photos, selected, trash],
  );

  const previewPhoto = useMemo(
    () => (preview == null ? null : [...photos, ...trash].find((photo) => photo.id === preview) ?? null),
    [photos, preview, trash],
  );

  const focusedPhoto = useMemo(() => {
    if (focusedPhotoId != null) {
      const target = [...photos, ...trash].find((photo) => photo.id === focusedPhotoId);
      if (target) return target;
    }
    return selectedPhotoList[0] ?? paginatedPhotos[0] ?? null;
  }, [focusedPhotoId, paginatedPhotos, photos, selectedPhotoList, trash]);

  const previewInTrash = previewPhoto ? trash.some((item) => item.id === previewPhoto.id) : false;

  useEffect(() => {
    if (paginatedPhotos.length === 0) {
      setFocusedPhotoId(null);
      return;
    }

    if (focusedPhotoId && paginatedPhotos.some((photo) => photo.id === focusedPhotoId)) {
      return;
    }

    setFocusedPhotoId(paginatedPhotos[0].id);
  }, [focusedPhotoId, paginatedPhotos]);

  const toggleSelect = (id: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === paginatedPhotos.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(paginatedPhotos.map((photo) => photo.id)));
  };

  const moveToTrash = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      const idSet = new Set(ids);
      const nextTrash = photos.filter((photo) => idSet.has(photo.id));
      if (!nextTrash.length) return;
      setPhotos((previous) => previous.filter((photo) => !idSet.has(photo.id)));
      setTrash((previous) => [...nextTrash, ...previous]);
      setSelected(new Set());
      setPreview((id) => (id != null && idSet.has(id) ? null : id));
      setFocusedPhotoId((id) => (id != null && idSet.has(id) ? null : id));
      toast({ title: `已移入回收站（${nextTrash.length} 张）` });
    },
    [photos],
  );

  const restoreFromTrash = useCallback(
    (ids: number[]) => {
      if (!ids.length) return;
      const idSet = new Set(ids);
      const restored = trash.filter((photo) => idSet.has(photo.id));
      setTrash((previous) => previous.filter((photo) => !idSet.has(photo.id)));
      setPhotos((previous) => [...restored, ...previous]);
      setSelected(new Set());
      setFocusedPhotoId(restored[0]?.id ?? null);
      toast({ title: `已恢复 ${restored.length} 张照片` });
    },
    [trash],
  );

  const permanentDelete = useCallback((ids: number[]) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setTrash((previous) => previous.filter((photo) => !idSet.has(photo.id)));
    setSelected(new Set());
    setPreview((id) => (id != null && idSet.has(id) ? null : id));
    setFocusedPhotoId((id) => (id != null && idSet.has(id) ? null : id));
    toast({ title: `已永久删除 ${ids.length} 张照片` });
  }, []);

  const toggleStar = useCallback((id: number) => {
    const updatePhoto = (photo: Photo) => (photo.id === id ? { ...photo, starred: !photo.starred } : photo);
    setPhotos((previous) => previous.map(updatePhoto));
    setTrash((previous) => previous.map(updatePhoto));
  }, []);

  const copyImageLink = (url: string) => {
    void navigator.clipboard.writeText(url).then(
      () => toast({ title: '图片链接已复制' }),
      () => toast({ title: '复制失败', variant: 'destructive' }),
    );
  };

  const sharePhoto = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '航拍照片', text: '来自巡检宝图片库', url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.warn('Share failed, falling back to copy link:', error);
      }
    }

    copyImageLink(url);
  };

  const downloadImage = (url: string, id: number) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `drone_${id}.jpg`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
    toast({ title: '已开始下载', description: '若未开始，请在新标签页中右键保存图片' });
  };

  const totalPages = Math.ceil(totalPhotos / pageSize) || 1;
  const selectedCount = selected.size;

  return (
    <div className="px-4 py-6 md:px-8">
      <PageHeader
        title="图片库"
        meta={
          <>
            <MetaPill label="总图片" value={photos.length} />
            <MetaPill label="收藏" value={photos.filter((photo) => photo.starred).length} tone="accent" />
            <MetaPill label="回收站" value={trash.length} tone={trash.length > 0 ? 'warning' : 'default'} />
          </>
        }
        actions={
          <>
            <Button
              variant={selectMode ? 'primary' : 'secondary'}
              onClick={() => {
                setSelectMode((enabled) => !enabled);
                setSelected(new Set());
              }}
            >
              {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {selectMode ? '退出多选' : '批量选择'}
            </Button>
            <Button variant="secondary" onClick={() => toast({ title: '上传入口即将接入本地资产流转' })}>
              <Plus className="h-4 w-4" />
              导入图片
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              value={tab}
              onChange={(value) => {
                setTab(value as GalleryTab);
                setSelected(new Set());
                setCurrentPage(1);
              }}
              options={tabOptions}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tab === 'trash' ? '搜索回收站' : '搜索标签、日期'}
              prefix={<Search className="h-4 w-4" />}
              className="w-64"
            />
          </div>

          {paginatedPhotos.length === 0 ? (
            <EmptyPanel
              title={tab === 'trash' ? '回收站还是空的' : tab === 'starred' ? '还没有收藏图片' : '当前没有图片'}
              description={tab === 'trash' ? '删除图片后会先进入回收站，这里可以继续恢复或永久删除。' : '调整筛选条件，或者导入新的巡检图片。'}
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {paginatedPhotos.map((photo) => {
                    const isSelected = selected.has(photo.id);
                    const isFocused = focusedPhoto?.id === photo.id;

                    return (
                      <div
                        key={photo.id}
                        className={cn(
                          'group overflow-hidden rounded-[24px] border transition-all duration-normal',
                          isFocused || isSelected
                            ? 'border-accent/30 bg-accent/6 shadow-panel'
                            : 'border-border bg-bg-surface hover:border-border-emphasis hover:bg-bg-light',
                        )}
                      >
                        <div className="relative aspect-[1/1] overflow-hidden">
                          <img
                            src={photo.image || '/drone-feed.jpg'}
                            alt={photo.tag}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                              {photo.tag}
                            </span>
                            <div className="flex items-center gap-2">
                              {photo.starred && (
                                <div className="rounded-full bg-amber-400/18 p-2 backdrop-blur">
                                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                                </div>
                              )}
                              {selectMode && (
                                <button
                                  type="button"
                                  className="rounded-full bg-black/45 p-2 text-white backdrop-blur"
                                  onClick={() => toggleSelect(photo.id)}
                                >
                                  {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                            <button
                              type="button"
                              className="min-w-0 text-left"
                              onClick={() => setFocusedPhotoId(photo.id)}
                            >
                              <p className="truncate text-sm font-medium text-white">#{photo.id}</p>
                              <p className="mt-1 text-xs text-white/75">{photo.date} · {photo.time}</p>
                            </button>
                            <div className="flex items-center gap-2 opacity-0 transition-opacity duration-normal group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setFocusedPhotoId(photo.id);
                                  setPreview(photo.id);
                                }}
                                className="rounded-full border border-border/65 bg-bg-base/92 p-2 text-text-primary shadow-panel backdrop-blur transition-all duration-normal hover:-translate-y-0.5 hover:border-border-emphasis hover:bg-bg-primary"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="rounded-full border border-border/65 bg-bg-base/92 p-2 text-text-primary shadow-panel backdrop-blur transition-all duration-normal hover:-translate-y-0.5 hover:border-border-emphasis hover:bg-bg-primary"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setFocusedPhotoId(photo.id);
                                      setPreview(photo.id);
                                    }}
                                  >
                                    预览
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStar(photo.id)}>
                                    <Star className="mr-2 h-4 w-4" />
                                    {photo.starred ? '取消收藏' : '加入收藏'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadImage(photo.imageFull, photo.id)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    下载
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => void sharePhoto(photo.imageFull)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    分享
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {tab !== 'trash' ? (
                                    <DropdownMenuItem className="text-error focus:text-error" onClick={() => moveToTrash([photo.id])}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      移入回收站
                                    </DropdownMenuItem>
                                  ) : (
                                    <>
                                      <DropdownMenuItem onClick={() => restoreFromTrash([photo.id])}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        恢复
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-error focus:text-error" onClick={() => permanentDelete([photo.id])}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        彻底删除
                                      </DropdownMenuItem>
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

                {tab === 'all' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-border bg-bg-surface px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <span>
                        第 {currentPage} / {totalPages} 页
                      </span>
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1 || isLoading}
                        onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages || isLoading}
                        onClick={async () => {
                          const nextPage = currentPage + 1;
                          if (nextPage * pageSize > photos.length && photos.length < totalPhotos) {
                            await loadMorePhotos();
                          }
                          setCurrentPage(nextPage);
                        }}
                      >
                        下一页
                      </Button>
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
                <img
                  src={focusedPhoto.imageFull || focusedPhoto.image}
                  alt={focusedPhoto.tag}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                {[
                  { label: '拍摄时间', value: `${focusedPhoto.date} ${focusedPhoto.time}` },
                  { label: '飞行高度', value: `${focusedPhoto.alt} m` },
                  { label: '坐标', value: `${focusedPhoto.lat.toFixed(5)}, ${focusedPhoto.lng.toFixed(5)}` },
                  { label: '标签', value: focusedPhoto.tag },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[14px] bg-bg-surface/50 px-3 py-2">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                    <span className="text-xs font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPreview(focusedPhoto.id)}>
                  <Eye className="h-3.5 w-3.5" />
                  放大
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toggleStar(focusedPhoto.id)}>
                  <Heart className={cn('h-3.5 w-3.5', focusedPhoto.starred && 'fill-current')} />
                  {focusedPhoto.starred ? '取消收藏' : '收藏'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadImage(focusedPhoto.imageFull, focusedPhoto.id)}>
                  <Download className="h-3.5 w-3.5" />
                  下载
                </Button>
                <Button variant="outline" size="sm" onClick={() => void sharePhoto(focusedPhoto.imageFull)}>
                  <Share2 className="h-3.5 w-3.5" />
                  分享
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-text-secondary">
              选择一张图片查看详情
            </div>
          )}

          {selectedCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">已选中 {selectedCount} 张</p>
              <div className="grid gap-2">
                {tab === 'trash' ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => restoreFromTrash([...selected])}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      批量恢复
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setBulkPermanentOpen(true)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      彻底删除
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setAnalysisOpen(true)}>
                      <Brain className="h-3.5 w-3.5" />
                      AI 分析
                    </Button>
                    <Button size="sm" onClick={() => setReportOpen(true)}>
                      <FileText className="h-3.5 w-3.5" />
                      生成报告
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => moveToTrash([...selected])}>
                      <Trash2 className="h-3.5 w-3.5" />
                      移入回收站
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {selected.size === paginatedPhotos.length ? '取消全选' : '全选当前页'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {preview !== null && previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <div className="surface-panel overflow-hidden rounded-[28px] bg-black/70">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
                <div>
                  <p className="text-sm font-medium">照片 #{previewPhoto.id}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {previewPhoto.date} · {previewPhoto.time} · #{previewPhoto.tag}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setPreview(null)} className="text-white hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex items-center justify-center bg-black p-4">
                  <img
                    src={previewPhoto.imageFull || previewPhoto.image}
                    alt={previewPhoto.tag}
                    className="max-h-[72vh] w-full rounded-[24px] object-contain"
                  />
                </div>

                <div className="border-l border-white/10 bg-black/30 p-5 text-white">
                  <div className="space-y-3">
                    {[
                      { label: '拍摄时间', value: `${previewPhoto.date} ${previewPhoto.time}` },
                      { label: '高度', value: `${previewPhoto.alt} m` },
                      { label: '坐标', value: `${previewPhoto.lat.toFixed(5)}, ${previewPhoto.lng.toFixed(5)}` },
                      { label: '标签', value: previewPhoto.tag },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[18px] bg-white/6 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-white/55">{item.label}</p>
                        <p className="mt-2 text-sm text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-2">
                    <Button variant="secondary" className="justify-start bg-white/8 text-white hover:bg-white/12" onClick={() => toggleStar(previewPhoto.id)}>
                      <Star className={cn('h-4 w-4', previewPhoto.starred && 'fill-current text-amber-300')} />
                      {previewPhoto.starred ? '取消收藏' : '加入收藏'}
                    </Button>
                    <Button variant="secondary" className="justify-start bg-white/8 text-white hover:bg-white/12" onClick={() => downloadImage(previewPhoto.imageFull, previewPhoto.id)}>
                      <Download className="h-4 w-4" />
                      下载原图
                    </Button>
                    <Button variant="secondary" className="justify-start bg-white/8 text-white hover:bg-white/12" onClick={() => void sharePhoto(previewPhoto.imageFull)}>
                      <Share2 className="h-4 w-4" />
                      分享链接
                    </Button>
                    <Button
                      variant="secondary"
                      className="justify-start bg-white/8 text-white hover:bg-white/12"
                      onClick={() => setPreviewShowMeta((visible) => !visible)}
                    >
                      <Info className="h-4 w-4" />
                      {previewShowMeta ? '隐藏详情' : '显示详情'}
                    </Button>
                    {!previewInTrash ? (
                      <Button variant="destructive" className="justify-start" onClick={() => moveToTrash([previewPhoto.id])}>
                        <Trash2 className="h-4 w-4" />
                        移入回收站
                      </Button>
                    ) : (
                      <>
                        <Button variant="secondary" className="justify-start bg-white/8 text-white hover:bg-white/12" onClick={() => restoreFromTrash([previewPhoto.id])}>
                          <RotateCcw className="h-4 w-4" />
                          恢复图片
                        </Button>
                        <Button variant="destructive" className="justify-start" onClick={() => permanentDelete([previewPhoto.id])}>
                          <Trash2 className="h-4 w-4" />
                          彻底删除
                        </Button>
                      </>
                    )}
                  </div>

                  {previewShowMeta && (
                    <div className="mt-5 rounded-[20px] bg-white/6 p-4 text-xs text-white/75">
                      图片 ID {previewPhoto.id} · 来源为无人机巡检图库，适合继续进入 AI 分析或生成报告工作流。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnalysisDialog open={analysisOpen} onOpenChange={setAnalysisOpen} selectedPhotos={selectedPhotoList} />

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} selectedPhotos={selectedPhotoList} />

      <AlertDialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清空回收站？</AlertDialogTitle>
            <AlertDialogDescription>将永久删除回收站中的 {trash.length} 张照片，此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                const count = trash.length;
                setTrash([]);
                setSelected(new Set());
                setPreview(null);
                setFocusedPhotoId(null);
                setEmptyTrashOpen(false);
                toast({ title: `已清空回收站（${count} 张）` });
              }}
            >
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
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => {
                permanentDelete([...selected]);
                setBulkPermanentOpen(false);
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Gallery;
