import React, { useState, useCallback } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Loader2, Sparkles } from 'lucide-react';

interface Photo {
  id: number;
  imageFull: string;
  tag: string;
  time: string;
  date: string;
}

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotos: Photo[];
  onAnalysisComplete?: (results: AnalysisResult[]) => void;
}

interface AnalysisResult {
  photoId: number;
  summary: string;
  confidence: number;
  details: {
    patterns: string[];
    factors: string[];
    recommendations: string[];
  };
}

export const AnalysisDialog: React.FC<AnalysisDialogProps> = ({
  open,
  onOpenChange,
  selectedPhotos,
  onAnalysisComplete,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (selectedPhotos.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      // 模拟AI分析（实际应调用 aiApi.analyze）
      const mockResults: AnalysisResult[] = selectedPhotos.map((photo) => ({
        photoId: photo.id,
        summary: `照片 ${photo.id} 分析完成`,
        confidence: 0.85 + Math.random() * 0.1,
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

      // 模拟延迟
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResults(mockResults);
      onAnalysisComplete?.(mockResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedPhotos, onAnalysisComplete]);

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
            将对选中的 {selectedPhotos.length} 张照片进行AI分析
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 选中照片预览 */}
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {selectedPhotos.slice(0, 8).map((photo) => (
              <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-surface">
                <img
                  src={photo.imageFull || photo.imageFull}
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
              正在分析中...
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
              {results.map((result) => (
                <div
                  key={result.photoId}
                  className="rounded-2xl border border-border bg-bg-surface p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      照片 #{result.photoId}
                    </span>
                    <span className="text-xs text-text-secondary">
                      置信度: {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{result.summary}</p>
                  
                  {result.details.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-text-primary">
                        建议:
                      </span>
                      <ul className="text-xs text-text-secondary list-disc list-inside">
                        {result.details.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {results.length > 0 ? '关闭' : '取消'}
          </AlertDialogCancel>
          {!isAnalyzing && results.length === 0 && (
            <AlertDialogAction onClick={handleAnalyze}>
              开始分析
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
