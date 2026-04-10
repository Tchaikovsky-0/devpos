import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Sparkles, Check, Loader2 } from 'lucide-react';

interface DedupeGroup {
  kept_id: number;
  kept_name: string;
  kept_url: string;
  removed_ids: number[];
  removed_info: Array<{ id: number; name: string; url: string; size: number; width: number; height: number }>;
  similarity: number;
  reason: string;
}

interface SemanticDedupeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onConfirm: (ids: number[]) => void;
}

export const SemanticDedupeDialog: React.FC<SemanticDedupeDialogProps> = ({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<DedupeGroup[]>([]);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/media/batch/semantic-dedupe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds, auto_mode: false }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data) {
        setGroups(data.data.groups || []);
        setAnalyzed(true);
      }
    } catch (err) {
      console.error('语义去重分析失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const allRemoved = groups.flatMap(g => g.removed_ids);
    onConfirm(allRemoved.length > 0 ? allRemoved : selectedIds);
    setGroups([]);
    setAnalyzed(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setGroups([]);
    setAnalyzed(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            智能去重
          </AlertDialogTitle>
          <AlertDialogDescription>
            AI 将识别拍摄同一缺陷的相似照片，每组只保留最佳质量的一张
          </AlertDialogDescription>
        </AlertDialogHeader>

        {!analyzed ? (
          <div className="py-8 text-center">
            <Sparkles className="w-12 h-12 text-accent/30 mx-auto mb-4" />
            <p className="text-sm text-text-secondary mb-4">
              已选择 {selectedIds.length} 个文件，AI 将分析图片相似度
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  开始分析
                </>
              )}
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-8 text-center">
            <Check className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-sm text-text-secondary">
              未发现相似图片，无需去重
            </p>
            <Button onClick={handleClose} className="mt-4">关闭</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                发现 {groups.length} 组相似图片，将移除 {groups.reduce((sum, g) => sum + g.removed_ids.length, 0)} 个文件
              </span>
            </div>
            {groups.map((group, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="info">第 {idx + 1} 组</Badge>
                  <span className="text-xs text-text-secondary">
                    相似度 {Math.round(group.similarity * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative border-2 border-success rounded-lg overflow-hidden">
                    <div className="absolute top-1 left-1 z-10">
                      <Badge variant="success" className="text-white text-xs">保留</Badge>
                    </div>
                    <img
                      src={group.kept_url}
                      alt={group.kept_name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="p-2 bg-bg-hover">
                      <p className="text-xs truncate">{group.kept_name}</p>
                    </div>
                  </div>
                  {group.removed_info.map((removed) => (
                    <div key={removed.id} className="relative border border-border rounded-lg overflow-hidden opacity-60">
                      <div className="absolute top-1 left-1 z-10">
                        <Badge variant="danger" className="text-xs">移除</Badge>
                      </div>
                      <img
                        src={removed.url}
                        alt={removed.name}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="p-2 bg-bg-hover">
                        <p className="text-xs truncate">{removed.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-secondary">{group.reason}</p>
              </div>
            ))}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          {analyzed && groups.length > 0 && (
            <AlertDialogAction onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              确认去重
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
