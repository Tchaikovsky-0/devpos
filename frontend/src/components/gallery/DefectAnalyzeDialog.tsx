import React, { useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import {
  Loader2,
  Sparkles,
  Check,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  DEFECT_FAMILY_LABELS,
  DEFECT_TYPE_LABELS,
  type DefectType,
  type DefectFamily,
  type Severity,
} from '@/types/api/defectCase';
import { cn } from '@/lib/utils';
import { useDefectAnalyzeMediaMutation, useSaveDefectEvidenceMutation } from '@/store/api/mediaApi';

/** Photo type matching Gallery/index.tsx */
export interface Photo {
  id: number;
  imageFull: string;
  tag: string;
  time: string;
  date: string;
  alt?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface DefectRegion {
  id: string;
  /** Bounding box in normalized [0-1] coordinates: [x1, y1, x2, y2] */
  bbox: [number, number, number, number];
  defectType: DefectType;
  family: DefectFamily;
  severity: Severity;
  confidence: number;
  /** User confirmed this region */
  confirmed: boolean;
}

export interface DefectAnalysisResult {
  photoId: number;
  regions: DefectRegion[];
}

/** AI analysis API payload */
export interface DefectAnalyzeRequest {
  media_ids: number[];
}

interface DefectAnalyzeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotos: Photo[];
  onAnalyzeComplete?: (results: DefectAnalysisResult[]) => void;
}

const DEFECT_FAMILY_OPTIONS: { value: DefectFamily; label: string }[] = [
  { value: 'security', label: '安防' },
  { value: 'env', label: '环境' },
  { value: 'structure', label: '结构' },
  { value: 'equipment', label: '设备' },
];

const DEFECT_TYPE_OPTIONS: { value: DefectType; label: string; family: DefectFamily }[] = [
  // security
  { value: 'intrusion', label: '入侵', family: 'security' },
  { value: 'fire', label: '火情', family: 'security' },
  // env
  { value: 'algae', label: '蓝藻', family: 'env' },
  { value: 'water_pollution', label: '水体污染', family: 'env' },
  { value: 'waste_accumulation', label: '固废堆积', family: 'env' },
  { value: 'gas_leak', label: '气体泄漏', family: 'env' },
  { value: 'smoke', label: '烟雾', family: 'env' },
  // structure
  { value: 'crack', label: '裂缝', family: 'structure' },
  { value: 'wall_damage', label: '墙损', family: 'structure' },
  { value: 'stair_damage', label: '楼梯损伤', family: 'structure' },
  { value: 'corrosion', label: '金属腐蚀', family: 'structure' },
  { value: 'deformation', label: '结构变形', family: 'structure' },
  { value: 'seepage', label: '渗水', family: 'structure' },
  // equipment
  { value: 'vehicle', label: '车辆异常', family: 'equipment' },
  { value: 'personnel', label: '人员异常', family: 'equipment' },
  { value: 'meter_abnormal', label: '仪表异常', family: 'equipment' },
  { value: 'vibration_abnormal', label: '振动异常', family: 'equipment' },
  { value: 'temperature_exceed', label: '温度超标', family: 'equipment' },
  { value: 'seal_damage', label: '密封损坏', family: 'equipment' },
  // other
  { value: 'leak', label: '泄漏', family: 'env' },
  { value: 'other', label: '其他', family: 'env' },
];

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'critical', label: '紧急', color: 'text-error bg-error-muted' },
  { value: 'high', label: '高', color: 'text-orange-400 bg-orange-500/10' },
  { value: 'medium', label: '中', color: 'text-warning bg-warning-muted' },
  { value: 'low', label: '低', color: 'text-blue-400 bg-blue-500/10' },
];

const REGION_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

/** Bounding box color by index */
function getRegionColor(index: number): string {
  return REGION_COLORS[index % REGION_COLORS.length];
}

/** Single photo with defect regions */
interface PhotoWithRegions {
  photo: Photo;
  regions: DefectRegion[];
  imageLoaded: boolean;
}

function DefectRegionOverlay({
  regions,
  width,
  height,
  selectedRegionId,
  onRegionClick,
}: {
  regions: DefectRegion[];
  width: number;
  height: number;
  selectedRegionId: string | null;
  onRegionClick: (id: string) => void;
}) {
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-10"
      width={width}
      height={height}
      style={{ width, height }}
    >
      {regions.map((region, idx) => {
        const [x1, y1, x2, y2] = region.bbox;
        const color = getRegionColor(idx);
        const isSelected = selectedRegionId === region.id;
        const w = (x2 - x1) * width;
        const h = (y2 - y1) * height;
        const label = `${DEFECT_TYPE_LABELS[region.defectType]} ${(region.confidence * 100).toFixed(0)}%`;

        return (
          <g key={region.id}>
            {/* Bounding box */}
            <rect
              x={x1 * width}
              y={y1 * height}
              width={w}
              height={h}
              fill={`${color}20`}
              stroke={isSelected ? '#FFFFFF' : color}
              strokeWidth={isSelected ? 3 : 2}
              className={cn('pointer-events-auto cursor-pointer transition-all', !region.confirmed && 'stroke-dashed')}
              onClick={(e) => {
                e.stopPropagation();
                onRegionClick(region.id);
              }}
            />
            {/* Label */}
            <rect
              x={x1 * width}
              y={y1 * height - 20}
              width={label.length * 8 + 8}
              height={18}
              fill={color}
              rx={3}
            />
            <text
              x={x1 * width + 4}
              y={y1 * height - 7}
              fill="white"
              fontSize={11}
              fontFamily="system-ui, sans-serif"
            >
              {label}
            </text>
            {/* Status indicator */}
            {region.confirmed && (
              <circle
                cx={x2 * width - 8}
                cy={y2 * height - 8}
                r={8}
                fill="#22C55E"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Region editor panel for selected region */
function RegionEditor({
  region,
  allTypes,
  onUpdate,
  onDelete,
  onConfirm,
}: {
  region: DefectRegion;
  allTypes: typeof DEFECT_TYPE_OPTIONS;
  onUpdate: (updated: DefectRegion) => void;
  onDelete: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">缺陷标注</span>
        <div className="flex items-center gap-1">
          {!region.confirmed && (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 transition-colors"
            >
              <Check className="h-3 w-3" /> 确认
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md bg-error/10 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/20 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> 删除
          </button>
        </div>
      </div>

      {/* Defect Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">缺陷类型</label>
        <select
          value={region.defectType}
          onChange={(e) => {
            const newType = e.target.value as DefectType;
            const typeOption = allTypes.find((t) => t.value === newType);
            onUpdate({
              ...region,
              defectType: newType,
              family: typeOption?.family ?? region.family,
            });
          }}
          className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/40"
        >
          {DEFECT_FAMILY_OPTIONS.map((fam) => (
            <optgroup key={fam.value} label={fam.label}>
              {allTypes
                .filter((t) => t.family === fam.value)
                .map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Severity */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">严重度</label>
        <div className="flex gap-1.5">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ ...region, severity: opt.value })}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                region.severity === opt.value
                  ? opt.color
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-muted',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* BBox coordinates (read-only) */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">区域坐标</label>
        <div className="grid grid-cols-4 gap-1 text-xs text-text-tertiary">
          <span>x1: {region.bbox[0].toFixed(2)}</span>
          <span>y1: {region.bbox[1].toFixed(2)}</span>
          <span>x2: {region.bbox[2].toFixed(2)}</span>
          <span>y2: {region.bbox[3].toFixed(2)}</span>
        </div>
      </div>

      {/* Confidence */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">置信度</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${region.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary">
            {(region.confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export const DefectAnalyzeDialog: React.FC<DefectAnalyzeDialogProps> = ({
  open,
  onOpenChange,
  selectedPhotos,
  onAnalyzeComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photosWithRegions, setPhotosWithRegions] = useState<PhotoWithRegions[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const [defectAnalyze] = useDefectAnalyzeMediaMutation();
  const [saveEvidence] = useSaveDefectEvidenceMutation();

  const currentPhoto = photosWithRegions[currentIndex];
  const selectedRegion = currentPhoto?.regions.find((r) => r.id === selectedRegionId) ?? null;

  const generateId = () => `region_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const handleAnalyze = useCallback(async () => {
    if (selectedPhotos.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setPhotosWithRegions([]);
    setCurrentIndex(0);
    setSelectedRegionId(null);

    try {
      // Call AI defect analysis API
      const response = await defectAnalyze({
        media_ids: selectedPhotos.map((p) => p.id),
      }).unwrap();

      // Transform API response to PhotoWithRegions format
      const results: PhotoWithRegions[] = response.map((result) => ({
        photo: selectedPhotos.find((p) => p.id === result.media_id) || selectedPhotos[0],
        regions: result.defects.map((defect) => ({
          id: defect.id || generateId(),
          bbox: defect.bbox as [number, number, number, number],
          defectType: defect.defectType,
          family: defect.family,
          severity: defect.severity,
          confidence: defect.confidence,
          confirmed: defect.confirmed,
        })),
        imageLoaded: false,
      }));

      setPhotosWithRegions(results);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('AI 分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedPhotos, defectAnalyze, generateId]);

  const handleRegionClick = useCallback((regionId: string) => {
    setSelectedRegionId((prev) => (prev === regionId ? null : regionId));
  }, []);

  const handleConfirmRegion = useCallback((regionId: string) => {
    setPhotosWithRegions((prev) =>
      prev.map((pw, idx) =>
        idx === currentIndex
          ? { ...pw, regions: pw.regions.map((r) => (r.id === regionId ? { ...r, confirmed: true } : r)) }
          : pw,
      ),
    );
    setSelectedRegionId(null);
  }, [currentIndex]);

  const handleDeleteRegion = useCallback((regionId: string) => {
    setPhotosWithRegions((prev) =>
      prev.map((pw, idx) =>
        idx === currentIndex
          ? { ...pw, regions: pw.regions.filter((r) => r.id !== regionId) }
          : pw,
      ),
    );
    setSelectedRegionId(null);
  }, [currentIndex]);

  const handleUpdateRegion = useCallback((updated: DefectRegion) => {
    setPhotosWithRegions((prev) =>
      prev.map((pw, idx) =>
        idx === currentIndex
          ? { ...pw, regions: pw.regions.map((r) => (r.id === updated.id ? updated : r)) }
          : pw,
      ),
    );
  }, [currentIndex]);

  const handleAddRegion = useCallback(() => {
    // Add a default region in the center
    const newRegion: DefectRegion = {
      id: generateId(),
      bbox: [0.3, 0.3, 0.6, 0.6],
      defectType: 'other',
      family: 'env',
      severity: 'medium',
      confidence: 0.8,
      confirmed: false,
    };
    setPhotosWithRegions((prev) =>
      prev.map((pw, idx) =>
        idx === currentIndex ? { ...pw, regions: [...pw.regions, newRegion] } : pw,
      ),
    );
    setSelectedRegionId(newRegion.id);
  }, [currentIndex]);

  const handleConfirmAll = useCallback(() => {
    // Mark all regions in current photo as confirmed
    setPhotosWithRegions((prev) =>
      prev.map((pw, idx) =>
        idx === currentIndex
          ? { ...pw, regions: pw.regions.map((r) => ({ ...r, confirmed: true })) }
          : pw,
      ),
    );
    setSelectedRegionId(null);
  }, [currentIndex]);

  const handleImageLoad = useCallback((photoId: number) => {
    setPhotosWithRegions((prev) =>
      prev.map((pw) =>
        pw.photo.id === photoId ? { ...pw, imageLoaded: true } : pw,
      ),
    );
  }, []);

  const handleClose = () => {
    setPhotosWithRegions([]);
    setSelectedRegionId(null);
    setCurrentIndex(0);
    setError(null);
    onOpenChange(false);
  };

  const handleFinish = async () => {
    // Save all confirmed defects as evidence
    const savePromises: Promise<unknown>[] = [];

    for (const pw of photosWithRegions) {
      for (const region of pw.regions.filter((r) => r.confirmed)) {
        savePromises.push(
          saveEvidence({
            media_id: pw.photo.id,
            family: region.family,
            defect_type: region.defectType,
            severity: region.severity,
            confidence: region.confidence,
            bbox: region.bbox,
          }).unwrap().catch((err) => {
            console.error('Failed to save evidence:', err);
          })
        );
      }
    }

    // Wait for all saves to complete (non-blocking)
    await Promise.all(savePromises);

    const results: DefectAnalysisResult[] = photosWithRegions.map((pw) => ({
      photoId: pw.photo.id,
      regions: pw.regions.filter((r) => r.confirmed),
    }));
    onAnalyzeComplete?.(results);
    handleClose();
  };

  const confirmedCount = photosWithRegions.reduce(
    (sum, pw) => sum + pw.regions.filter((r) => r.confirmed).length,
    0,
  );
  const totalRegions = photosWithRegions.reduce((sum, pw) => sum + pw.regions.length, 0);

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI 缺陷分析
          </AlertDialogTitle>
          <AlertDialogDescription>
            {photosWithRegions.length === 0
              ? `将对选中的 ${selectedPhotos.length} 张照片进行 AI 缺陷分析，识别缺陷区域并生成标注`
              : `已完成分析：${photosWithRegions.length} 张照片，${totalRegions} 个缺陷区域，${confirmedCount} 个已确认`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {photosWithRegions.length === 0 ? (
            /* Analysis preview - show selected photos */
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-auto">
                {selectedPhotos.slice(0, 12).map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-surface"
                  >
                    <img
                      src={photo.imageFull}
                      alt={`照片 ${photo.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {selectedPhotos.length > 12 && (
                  <div className="aspect-square rounded-2xl border border-border bg-bg-surface flex items-center justify-center text-text-secondary text-xs">
                    +{selectedPhotos.length - 12}
                  </div>
                )}
              </div>
              {error && (
                <div className="rounded-xl bg-error/10 p-3 text-sm text-error flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            /* Analysis results - photo navigation */
            <div className="flex h-full gap-4" style={{ minHeight: 400 }}>
              {/* Photo viewer */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex((i) => Math.max(0, i - 1));
                        setSelectedRegionId(null);
                      }}
                      disabled={currentIndex === 0}
                      className="rounded-md border border-border p-1.5 text-text-secondary hover:bg-bg-muted disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-text-secondary">
                      {currentIndex + 1} / {photosWithRegions.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex((i) => Math.min(photosWithRegions.length - 1, i + 1));
                        setSelectedRegionId(null);
                      }}
                      disabled={currentIndex === photosWithRegions.length - 1}
                      className="rounded-md border border-border p-1.5 text-text-secondary hover:bg-bg-muted disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-text-secondary truncate max-w-[200px]" title={currentPhoto?.photo.tag}>
                    {currentPhoto?.photo.tag || `照片 #${currentPhoto?.photo.id}`}
                  </span>
                </div>

                {/* Image with overlay */}
                <div
                  ref={imageRef}
                  className="relative flex-1 rounded-xl overflow-hidden bg-bg-tertiary flex items-center justify-center"
                  onClick={() => setSelectedRegionId(null)}
                >
                  {currentPhoto && (
                    <>
                      <img
                        src={currentPhoto.photo.imageFull}
                        alt={`照片 ${currentPhoto.photo.id}`}
                        className="max-w-full max-h-full object-contain"
                        onLoad={() => handleImageLoad(currentPhoto.photo.id)}
                      />
                      <DefectRegionOverlay
                        regions={currentPhoto.regions}
                        width={imageRef.current?.clientWidth || 600}
                        height={imageRef.current?.clientHeight || 400}
                        selectedRegionId={selectedRegionId}
                        onRegionClick={handleRegionClick}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Right sidebar: region list */}
              <div className="w-72 flex flex-col gap-3 overflow-auto">
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">缺陷区域</span>
                  <div className="flex items-center gap-1.5">
                    {totalRegions > 0 && (
                      <button
                        type="button"
                        onClick={handleConfirmAll}
                        className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success hover:bg-success/20 transition-colors"
                      >
                        <Check className="h-3 w-3" /> 全部确认
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddRegion}
                      className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> 添加
                    </button>
                  </div>
                </div>

                {/* Region list */}
                {currentPhoto && currentPhoto.regions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
                    <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">未检测到缺陷区域</p>
                    <p className="text-xs mt-1">点击"添加"手动标注</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPhoto?.regions.map((region, idx) => (
                      <div
                        key={region.id}
                        className={cn(
                          'rounded-xl border p-3 cursor-pointer transition-all',
                          selectedRegionId === region.id
                            ? 'border-accent bg-accent/5'
                            : region.confirmed
                            ? 'border-success/30 bg-success/5'
                            : 'border-border bg-bg-surface hover:border-border-emphasis',
                        )}
                        onClick={() => handleRegionClick(region.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: getRegionColor(idx) }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {DEFECT_TYPE_LABELS[region.defectType]}
                              </p>
                              <p className="text-xs text-text-tertiary">
                                {DEFECT_FAMILY_LABELS[region.family]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                SEVERITY_OPTIONS.find((s) => s.value === region.severity)?.color,
                              )}
                            >
                              {SEVERITY_OPTIONS.find((s) => s.value === region.severity)?.label}
                            </span>
                            {region.confirmed && (
                              <span className="rounded-full bg-success/10 p-1">
                                <Check className="h-3 w-3 text-success" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected region editor */}
                {selectedRegion && (
                  <RegionEditor
                    region={selectedRegion}
                    allTypes={DEFECT_TYPE_OPTIONS}
                    onUpdate={handleUpdateRegion}
                    onDelete={() => handleDeleteRegion(selectedRegion.id)}
                    onConfirm={() => handleConfirmRegion(selectedRegion.id)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {photosWithRegions.length > 0 ? '取消' : '关闭'}
          </AlertDialogCancel>

          {photosWithRegions.length === 0 && !isAnalyzing && (
            <AlertDialogAction onClick={handleAnalyze}>
              <Sparkles className="h-4 w-4" />
              开始分析
            </AlertDialogAction>
          )}

          {isAnalyzing && (
            <Button variant="primary" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
              分析中...
            </Button>
          )}

          {photosWithRegions.length > 0 && !isAnalyzing && (
            <AlertDialogAction onClick={handleFinish}>
              <Check className="h-4 w-4" />
              确认 {confirmedCount} 个缺陷
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DefectAnalyzeDialog;
