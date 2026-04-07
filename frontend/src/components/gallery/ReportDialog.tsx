import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { FileText, Download, Loader2, FileJson } from 'lucide-react';
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

    // Calculate defect statistics
    const totalDefects = defectResults.reduce(
      (sum, r) => sum + r.regions.filter((d) => d.confirmed).length,
      0
    );
    const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
    const familyCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};

    defectResults.forEach((result) => {
      result.regions.filter((d) => d.confirmed).forEach((defect) => {
        severityCount[defect.severity]++;
        familyCount[defect.family] = (familyCount[defect.family] || 0) + 1;
        typeCount[defect.defectType] = (typeCount[defect.defectType] || 0) + 1;
      });
    });

    const hasDefects = totalDefects > 0;
    const photosWithDefects = defectResults.filter((r) => r.regions.some((d) => d.confirmed)).length;

    // Pre-compute most common defect type
    const sortedTypeEntries = Object.entries(typeCount).sort((a, b) => b[1] - a[1]);
    const mostCommonType = sortedTypeEntries[0]?.[0];
    const mostCommonTypeLabel = mostCommonType ? (DEFECT_TYPE_LABELS[mostCommonType as DefectType] || mostCommonType) : '无';

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
${hasDefects ? `- **检测到缺陷**: ${totalDefects} 个` : ''}

---

## 照片列表

| 序号 | 标签 | 拍摄时间 | 高度 | 坐标 | 缺陷数 |
|------|------|----------|------|------|--------|
${selectedPhotos.map((photo, index) => {
  const date = photo.date || now.toLocaleDateString('zh-CN');
  const time = photo.time || 'N/A';
  const alt = photo.alt ? `${photo.alt}m` : 'N/A';
  const coords = photo.lat && photo.lng
    ? `${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}`
    : 'N/A';
  const photoDefects = defectResults.find((r) => r.media_id === photo.id);
  const defectCount = photoDefects?.regions.filter((d) => d.confirmed).length || 0;

  return `| ${index + 1} | ${photo.tag} | ${date} ${time} | ${alt} | ${coords} | ${hasDefects ? defectCount : '-'} |`;
}).join('\n')}

${hasDefects ? `---

## 缺陷统计

### 按严重度

| 严重度 | 数量 |
|--------|------|
| 严重 (critical) | ${severityCount.critical} |
| 高 (high) | ${severityCount.high} |
| 中 (medium) | ${severityCount.medium} |
| 低 (low) | ${severityCount.low} |

### 按分类

| 分类 | 数量 |
|------|------|
${Object.entries(familyCount).map(([family, count]) => `| ${DEFECT_FAMILY_LABELS[family as DefectFamily] || family} | ${count} |`).join('\n')}

### 按类型

| 类型 | 数量 |
|------|------|
${Object.entries(typeCount).map(([type, count]) => `| ${DEFECT_TYPE_LABELS[type as DefectType] || type} | ${count} |`).join('\n')}

---

## 缺陷详情

${defectResults
  .filter((r) => r.regions.some((d) => d.confirmed))
  .map((result) => {
    const photo = selectedPhotos.find((p) => p.id === result.media_id);
    const confirmedDefects = result.regions.filter((d) => d.confirmed);
    return `### 照片 ${photo?.tag || result.media_id} (${photo?.date || ''})

| 缺陷类型 | 分类 | 严重度 | 置信度 | 位置 |
|----------|------|--------|--------|------|
${confirmedDefects
      .map(
        (d) =>
          `| ${DEFECT_TYPE_LABELS[d.defectType] || d.defectType} | ${DEFECT_FAMILY_LABELS[d.family] || d.family} | ${d.severity} | ${(d.confidence * 100).toFixed(0)}% | [${(d.bbox[0] * 100).toFixed(0)}%, ${(d.bbox[1] * 100).toFixed(0)}% - ${(d.bbox[2] * 100).toFixed(0)}%, ${(d.bbox[3] * 100).toFixed(0)}%] |`
      )
      .join('\n')}`;
  })
  .join('\n\n')}

` : ''}---

## 分析总结

本次巡检共采集 **${selectedPhotos.length}** 张照片${hasDefects ? `，检测到 **${totalDefects}** 个缺陷` : ''}。

### 主要发现

${hasDefects ? `1. **缺陷检测**: 在 ${photosWithDefects} 张照片中发现缺陷
2. **高危缺陷**: ${severityCount.critical + severityCount.high} 个（严重/高）
3. **主要类型**: ${mostCommonTypeLabel}（最多）
` : `1. **拍摄质量**: 所有照片画质清晰，光照条件良好
2. **覆盖范围**: 涵盖了预设的巡检路线
3. **数据完整性**: GPS坐标和高度数据完整`}

### 建议

${hasDefects ? `1. 建议优先处理 **${severityCount.critical + severityCount.high}** 个高危缺陷
2. 关注 **${familyCount.structure || 0}** 个结构类缺陷，可能影响设施安全
3. 定期复查已确认的缺陷，监测其变化趋势
` : `1. 建议定期对比不同时期的照片，监测变化
2. 关注特殊天气条件下的拍摄效果
3. 保持设备清洁，确保拍摄质量`}

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
  }, [reportId, reportType, selectedPhotos, defectResults]);

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
