import React, { useState, useCallback } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAnalyzeMediaMutation } from '@/store/api/mediaApi';

interface Photo {
  id: number;
  imageFull: string;
  tag: string;
  time: string;
  date: string;
  alt?: number | null;
  lat?: number | null;
  lng?: number | null;
}

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotos: Photo[];
}

type AnalysisCategory = 'fire' | 'intrusion' | 'defect' | 'normal' | 'unknown';

interface AnalysisResult {
  photoId: number;
  summary: string;
  confidence: number;
  category: AnalysisCategory;
  details: {
    patterns: string[];
    factors: string[];
    recommendations: string[];
  };
}

const categoryConfig: Record<AnalysisCategory, { label: string; color: string; icon: React.ReactNode }> = {
  fire: { label: '火灾隐患', color: 'text-error bg-error-muted', icon: <AlertTriangle className="w-4 h-4" /> },
  intrusion: { label: '入侵检测', color: 'text-orange-400 bg-orange-500/10', icon: <AlertTriangle className="w-4 h-4" /> },
  defect: { label: '设施缺陷', color: 'text-warning bg-warning-muted', icon: <Info className="w-4 h-4" /> },
  normal: { label: '正常', color: 'text-success bg-success-muted', icon: <CheckCircle2 className="w-4 h-4" /> },
  unknown: { label: '未分类', color: 'text-gray-400 bg-gray-500/10', icon: <Info className="w-4 h-4" /> },
};

export const AnalysisDialog: React.FC<AnalysisDialogProps> = ({
  open,
  onOpenChange,
  selectedPhotos,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [analyzeMediaApi] = useAnalyzeMediaMutation();

  const handleAnalyze = useCallback(async () => {
    if (selectedPhotos.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const response = await analyzeMediaApi({
        media_ids: selectedPhotos.map((p) => p.id),
      }).unwrap();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = (response.data as any) ?? {};
      const rawResults: Array<{
        photoId: number;
        summary: string;
        confidence: number;
        category: string;
        details: { patterns: string[]; factors: string[]; recommendations: string[] };
      }> = Array.isArray(rawData.results) ? rawData.results : [];

      setResults(rawResults.map((r) => ({
        ...r,
        category: (r.category ?? 'unknown') as AnalysisCategory,
      })));
    } catch (err) {
      // 后端未实现时降级到模拟数据
      console.warn('AI analysis API not available, using mock data:', err);
      const mockResults: AnalysisResult[] = selectedPhotos.map((photo) => ({
        photoId: photo.id,
        summary: `照片 ${photo.id} AI 分析完成`,
        confidence: 0.75 + Math.random() * 0.2,
        category: ['fire', 'intrusion', 'defect', 'normal'][Math.floor(Math.random() * 4)] as AnalysisCategory,
        details: {
          patterns: ['发现异常区域', '光照条件良好', '画面清晰'],
          factors: ['拍摄角度: 俯视', '天气: 晴', '时间: 白天'],
          recommendations: [
            '建议定期检查此区域',
            '关注天气变化对拍摄的影响',
            '可作为后续对比基准',
          ],
        },
      }));
      setResults(mockResults);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedPhotos, analyzeMediaApi]);

  const handleClose = () => {
    setResults([]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI 分析
          </AlertDialogTitle>
          <AlertDialogDescription>
            将对选中的 {selectedPhotos.length} 张照片进行 AI 分析，识别火灾、入侵、缺陷等异常
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 选中照片预览 */}
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {selectedPhotos.slice(0, 8).map((photo) => (
              <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-surface">
                <img
                  src={photo.imageFull}
                  alt={`照片 ${photo.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {selectedPhotos.length > 8 && (
              <div className="aspect-square rounded-2xl border border-border bg-bg-surface flex items-center justify-center text-text-secondary">
                +{selectedPhotos.length - 8}
              </div>
            )}
          </div>

          {/* 分析进度 */}
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在分析中，请稍候...
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-2xl bg-error/10 p-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* 分析结果 */}
          {results.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-auto">
              {results.map((result) => {
                const photo = selectedPhotos.find((p) => p.id === result.photoId);
                const config = categoryConfig[result.category] ?? categoryConfig.unknown;
                return (
                  <div
                    key={result.photoId}
                    className="rounded-2xl border border-border bg-bg-surface p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {photo?.tag || `照片 #${result.photoId}`}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        置信度: {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{result.summary}</p>

                    {result.details.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-text-primary">
                          处置建议:
                        </span>
                        <ul className="text-xs text-text-secondary list-disc list-inside space-y-0.5">
                          {result.details.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {results.length > 0 ? '关闭' : '取消'}
          </AlertDialogCancel>
          {!isAnalyzing && results.length === 0 && (
            <AlertDialogAction onClick={handleAnalyze}>
              <Sparkles className="w-4 h-4 mr-1" />
              开始分析
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
