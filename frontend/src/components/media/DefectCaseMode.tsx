// DefectCaseMode - 缺陷案例模式主容器组件
// 整合案例队列、证据板和AI副驾

import React, { useMemo } from 'react';
import { MetricTile } from '@/components/workspace/WorkspacePrimitives';
import CaseQueue from './CaseQueue';
import EvidenceBoard from './EvidenceBoard';
import OpenClawCopilot from './OpenClawCopilot';
import {
  type DefectCase,
  type DefectCaseDetail,
} from '@/types/api/defectCase';

interface DefectCaseModeProps {
  defectCases?: DefectCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onComposeOpenClaw: (message: string, title?: string) => void;
  getFamilyIcon: (family: string) => React.ComponentType<{ className?: string }>;
  filters: {
    severity: string;
    status: string;
    keyword: string;
  };
  onFilterChange: (filters: DefectCaseModeProps['filters']) => void;
}

export const DefectCaseMode: React.FC<DefectCaseModeProps> = ({
  defectCases,
  selectedCaseId,
  onSelectCase,
  onComposeOpenClaw,
  getFamilyIcon,
  filters,
  onFilterChange,
}) => {
  const stats = useMemo(() => {
    if (!defectCases) {
      return { total: 0, open: 0, draft: 0, evidence: 0 };
    }
    return {
      total: defectCases.length,
      open: defectCases.filter((c) => ['draft', 'confirmed', 'processing'].includes(c.status)).length,
      draft: defectCases.filter((c) => c.report_status === 'draft').length,
      evidence: defectCases.reduce((sum, c) => sum + c.evidence_count, 0),
    };
  }, [defectCases]);

  const caseDetail = useMemo(() => {
    if (!selectedCaseId || !defectCases) return undefined;
    return defectCases.find((c) => String(c.id) === selectedCaseId) as DefectCaseDetail | undefined;
  }, [selectedCaseId, defectCases]);

  return (
    <>
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="案例总数" value={stats.total} helper="包含全部状态" />
        <MetricTile label="待处理" value={stats.open} helper="候选 + 已确认 + 处理中" />
        <MetricTile label="草稿报告" value={stats.draft} helper="待审核确认" />
        <MetricTile label="证据总量" value={stats.evidence} helper="去重前原始证据数" />
      </div>

      {/* Three-column layout */}
      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* ---- Left Column: Case Queue ---- */}
        <CaseQueue
          defectCases={defectCases}
          selectedCaseId={selectedCaseId}
          onSelectCase={onSelectCase}
          filters={filters}
          onFilterChange={onFilterChange}
          getFamilyIcon={getFamilyIcon}
        />

        {/* ---- Center Column: Evidence Board ---- */}
        <EvidenceBoard
          caseDetail={caseDetail}
          onComposeOpenClaw={onComposeOpenClaw}
          getFamilyIcon={getFamilyIcon}
        />

        {/* ---- Right Column: OpenClaw Copilot ---- */}
        <OpenClawCopilot
          caseDetail={caseDetail}
          onComposeOpenClaw={onComposeOpenClaw}
        />
      </div>
    </>
  );
};

export default DefectCaseMode;
