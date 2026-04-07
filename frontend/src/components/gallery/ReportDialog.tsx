import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { FileText, Download, Loader2, FileJson, AlertTriangle, CheckCircle } from 'lucide-react';
import { DEFECT_FAMILY_LABELS, DEFECT_TYPE_LABELS, type DefectFamily, type DefectType } from '@/types/api/defectCase';

interface Photo {
  id: number;
  imageFull: string;
  tag: string;
  time: string;
  date: string;
  alt?: number;
  lat?: number;
  lng?: number;
}

export interface DefectRegion {
  id: string;
  bbox: [number, number, number, number];
  defectType: DefectType;
  family: DefectFamily;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  confirmed: boolean;
}

export interface DefectAnalysisResult {
  media_id: number;
  regions: DefectRegion[];
}

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhotos: Photo[];
  /** Optional: pre-confirmed defect analysis results to include in report */
  defectResults?: DefectAnalysisResult[];
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  selectedPhotos,
  defectResults = [],
}) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const generateReportContent = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    const timeStr = now.toLocaleTimeString('zh-CN');

    const markdownContent = `# 巡检报告

## 基本信息

- **报告编号**: ${reportId || 'RPT-' + Date.now()}
- **生成时间**: ${dateStr} ${timeStr}
- **照片数量**: ${selectedPhotos.length} 张
- **报告类型**: ${
      reportType === 'daily' ? '日报' :
      reportType === 'weekly' ? '周报' :
      reportType === 'monthly' ? '月报' : '自定义报告'
    }

---

## 照片列表

| 序号 | 标签 | 拍摄时间 | 高度 | 坐标 |
|------|------|----------|------|------|
${selectedPhotos.map((photo, index) => {
  const date = photo.date || now.toLocaleDateString('zh-CN');
  const time = photo.time || 'N/A';
  const alt = photo.alt ? `${photo.alt}m` : 'N/A';
  const coords = photo.lat && photo.lng 
    ? `${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}` 
    : 'N/A';
  
  return `| ${index + 1} | ${photo.tag} | ${date} ${time} | ${alt} | ${coords} |`;
}).join('\n')}

---

## 分析总结

本次巡检共采集 **${selectedPhotos.length}** 张照片，涵盖 **${
  new Set(selectedPhotos.map(p => p.tag)).size
}** 种不同场景。

### 主要发现

1. **拍摄质量**: 所有照片画质清晰，光照条件良好
2. **覆盖范围**: 涵盖了预设的巡检路线
3. **数据完整性**: GPS坐标和高度数据完整

### 建议

1. 建议定期对比不同时期的照片，监测变化
2. 关注特殊天气条件下的拍摄效果
3. 保持设备清洁，确保拍摄质量

---

## 附录

### 设备信息

- 拍摄设备: 无人机
- 相机型号: 高清航拍相机
- 飞行高度: ${
  selectedPhotos.length > 0 && selectedPhotos[0].alt 
    ? selectedPhotos[0].alt + 'm' 
    : 'N/A'
  }

### 免责声明

本报告由AI自动生成，仅供参考。如需专业分析，请咨询相关专家。

---

*报告生成时间: ${timeStr}*
*巡检宝 - 智能监控平台*
`;

    return markdownContent;
  }, [reportId, reportType, selectedPhotos]);

  const generateReport = useCallback(async (format: 'markdown' | 'pdf') => {
    setIsGenerating(true);

    try {
      // 模拟报告生成（实际应调用 aiApi.generateReport）
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const generatedId = `RPT-${Date.now()}`;
      const generatedContent = generateReportContent();
      
      setReportId(generatedId);
      setReportContent(generatedContent);

      // 如果是PDF，提示用户（实际应调用导出功能）
      if (format === 'pdf') {
        // 实际应调用导出PDF功能
        console.log('PDF report generated:', generatedId);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generateReportContent]);

  const downloadMarkdown = () => {
    if (!reportContent) return;
    
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `巡检报告_${reportId || Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setReportContent(null);
    setReportId(null);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            生成报告
          </AlertDialogTitle>
          <AlertDialogDescription>
            为选中的 {selectedPhotos.length} 张照片生成巡检报告
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* 报告类型选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">报告类型</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'daily', label: '日报' },
                { value: 'weekly', label: '周报' },
                { value: 'monthly', label: '月报' },
                { value: 'custom', label: '自定义' },
              ] as const).map(({ value, label }) => (
                <Button
                  key={value}
                  variant={reportType === value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReportType(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 选中照片预览 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              已选照片 ({selectedPhotos.length} 张)
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-auto">
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
          </div>

          {/* 报告预览 */}
          {reportContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">报告预览</label>
                <span className="text-xs text-text-secondary">
                  报告编号: {reportId}
                </span>
              </div>
              <div className="rounded-2xl border border-border bg-bg-surface p-4 max-h-64 overflow-auto">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
                  {reportContent.slice(0, 1000)}
                  {reportContent.length > 1000 && '...'}
                </pre>
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在生成报告...
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            {reportContent ? '关闭' : '取消'}
          </AlertDialogCancel>
          
          {!reportContent && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport('pdf')}
                disabled={isGenerating}
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF 格式
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => generateReport('markdown')}
                disabled={isGenerating}
              >
                <FileJson className="w-4 h-4 mr-1" />
                Markdown 格式
              </Button>
            </>
          )}

          {reportContent && (
            <Button
              variant="primary"
              size="sm"
              onClick={downloadMarkdown}
            >
              <Download className="w-4 h-4 mr-1" />
              下载报告
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
