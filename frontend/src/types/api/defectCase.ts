// =============================================================================
// Defect Case Types - 缺陷案例闭环类型定义
// =============================================================================

import type { ApiResponse, PaginatedResponse, PaginationParams } from './response';

// =============================================================================
// Enums
// =============================================================================

/** 缺陷分类（一级） */
export type DefectFamily = 'security' | 'env' | 'structure' | 'equipment';

/** 缺陷类型（二级） */
export type DefectType =
  // 安全类 (security)
  | 'intrusion'              // 入侵（人员闯入）
  | 'fire'                   // 火情（火焰/烟雾）
  // 环境类 (env)
  | 'algae'                  // 蓝藻/水面污染
  | 'water_pollution'        // 水体污染（油污/废水）
  | 'waste_accumulation'     // 固废堆积
  | 'gas_leak'               // 气体泄漏
  | 'smoke'                  // 烟雾
  // 结构类 (structure)
  | 'crack'                  // 裂缝
  | 'wall_damage'            // 墙损
  | 'stair_damage'           // 楼梯损伤
  | 'corrosion'              // 金属腐蚀
  | 'deformation'             // 结构变形
  | 'seepage'                // 渗水
  // 设备类 (equipment)
  | 'vehicle'                // 车辆异常
  | 'personnel'              // 人员异常
  | 'meter_abnormal'         // 仪表读数异常
  | 'vibration_abnormal'     // 振动异常
  | 'temperature_exceed'     // 温度超标
  | 'seal_damage'            // 密封损坏
  // 其他
  | 'leak'                   // 泄漏
  | 'other';                 // 其他

/** 缺陷案例状态 */
export type DefectCaseStatus = 'draft' | 'confirmed' | 'processing' | 'resolved' | 'closed';

/** 严重度 */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** 报告草稿状态 */
export type ReportDraftStatus = 'draft' | 'reviewing' | 'approved' | 'archived';

// =============================================================================
// Label Maps (for display)
// =============================================================================

export const DEFECT_FAMILY_LABELS: Record<DefectFamily, string> = {
  security: '安防',
  env: '环境',
  structure: '结构',
  equipment: '设备',
};

export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  // 安全类
  intrusion: '入侵',
  fire: '火情',
  // 环境类
  algae: '蓝藻',
  water_pollution: '水体污染',
  waste_accumulation: '固废堆积',
  gas_leak: '气体泄漏',
  smoke: '烟雾',
  // 结构类
  crack: '裂缝',
  wall_damage: '墙损',
  stair_damage: '楼梯损伤',
  corrosion: '金属腐蚀',
  deformation: '结构变形',
  seepage: '渗水',
  // 设备类
  vehicle: '车辆异常',
  personnel: '人员异常',
  meter_abnormal: '仪表异常',
  vibration_abnormal: '振动异常',
  temperature_exceed: '温度超标',
  seal_damage: '密封损坏',
  // 其他
  leak: '泄漏',
  other: '其他',
};

export const DEFECT_CASE_STATUS_LABELS: Record<DefectCaseStatus, string> = {
  draft: '候选草稿',
  confirmed: '已确认',
  processing: '处理中',
  resolved: '已解决',
  closed: '已归档',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const REPORT_DRAFT_STATUS_LABELS: Record<ReportDraftStatus, string> = {
  draft: '草稿',
  reviewing: '待审核',
  approved: '已确认',
  archived: '已归档',
};

// =============================================================================
// Core Domain Objects
// =============================================================================

/** 缺陷案例（一等公民） */
export interface DefectCase {
  id: number;
  tenant_id: string;
  title: string;
  family: DefectFamily;
  defect_type: DefectType;
  severity: Severity;
  status: DefectCaseStatus;

  // 位置
  location: string;
  latitude: number | null;
  longitude: number | null;

  // 设备
  stream_id: string | null;
  device_name: string;

  // 时间跨度
  first_seen_at: string;
  last_seen_at: string;

  // 统计
  evidence_count: number;
  duplicate_count: number;
  representative_id: number | null;

  // 报告状态
  report_status: 'none' | 'draft' | 'approved';

  // 描述
  summary: string;
  description: string;

  // 归并分数
  merge_score: number;

  // 操作
  created_by: number | null;
  updated_by: number | null;

  created_at: string;
  updated_at: string;
}

/** 缺陷证据 */
export interface DefectEvidence {
  id: number;
  tenant_id: string;
  case_id: number;

  // 来源
  source: 'yolo' | 'specialist' | 'manual';
  detection_id: string | null;
  media_id: number | null;

  // 检测结果
  family: DefectFamily;
  defect_type: DefectType;
  confidence: number;
  bbox: number[] | null;       // [x1, y1, x2, y2]
  mask: string | null;

  // 图像指纹
  phash: string;
  dhash: string;
  embedding_ref: string;

  // 位置与时间
  timestamp: string;
  location: string;
  latitude: number | null;
  longitude: number | null;

  // 去重
  duplicate_group_id: number | null;
  is_representative: boolean;

  // 文件
  file_url: string;
  thumbnail_url: string;
  mime_type: string;

  created_at: string;
  updated_at: string;
}

/** 重复组 */
export interface DuplicateGroup {
  id: number;
  tenant_id: string;
  case_id: number;
  method: 'phash' | 'dhash' | 'ssim' | 'clip' | 'dino' | 'siglip';
  score: number;
  representative_id: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

/** 报告草稿 */
export interface ReportDraft {
  id: number;
  tenant_id: string;
  case_id: number;

  title: string;
  status: ReportDraftStatus;

  // 结构化内容
  overview: string;
  conclusion: string;
  evidence_desc: string;
  time_info: string;
  location_info: string;
  severity_impact: string;
  suggestions: string;

  // 证据追溯
  representative_id: number | null;
  evidence_total: number;
  duplicate_folded: number;
  time_range_start: string | null;
  time_range_end: string | null;

  // AI
  generated_by: string;
  reviewed_by: number | null;
  approved_at: string | null;

  // 导出
  file_url: string;
  export_format: string;

  created_at: string;
  updated_at: string;
}

/** 缺陷案例详情（含关联数据） */
export interface DefectCaseDetail extends DefectCase {
  evidences: DefectEvidence[];
  duplicate_groups: DuplicateGroup[];
  report_drafts: ReportDraft[];
}

// =============================================================================
// Request Types
// =============================================================================

export interface CreateDefectCaseRequest {
  title: string;
  family: DefectFamily;
  defect_type: DefectType;
  severity?: Severity;
  location?: string;
  latitude?: number;
  longitude?: number;
  stream_id?: string;
  device_name?: string;
  summary?: string;
  detection_ids?: string[];
}

export interface UpdateDefectCaseRequest {
  title?: string;
  severity?: Severity;
  status?: DefectCaseStatus;
  location?: string;
  summary?: string;
  description?: string;
  report_status?: 'none' | 'draft' | 'approved';
}

export interface MergeCasesRequest {
  target_case_id: number;
  source_case_ids: number[];
}

export interface SplitCaseRequest {
  evidence_ids: number[];
  new_title?: string;
}

export interface SetRepresentativeRequest {
  evidence_id: number;
}

export interface CreateReportDraftRequest {
  title: string;
}

export interface UpdateReportDraftRequest {
  title?: string;
  overview?: string;
  conclusion?: string;
  evidence_desc?: string;
  time_info?: string;
  location_info?: string;
  severity_impact?: string;
  suggestions?: string;
  status?: ReportDraftStatus;
}

export interface ApproveReportDraftRequest {
  export_format?: string;
}

// =============================================================================
// Query / Response Types
// =============================================================================

export interface DefectCaseListParams extends PaginationParams {
  family?: DefectFamily;
  defect_type?: DefectType;
  severity?: Severity;
  status?: DefectCaseStatus;
  report_status?: string;
  keyword?: string;
  stream_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface DefectCaseStatistics {
  total: number;
  draft: number;
  confirmed: number;
  processing: number;
  resolved: number;
  closed: number;
  by_severity: Array<{ severity: Severity; count: number }>;
  by_family: Array<{ family: DefectFamily; count: number }>;
  draft_reports: number;
}

export type DefectCaseListResponse = PaginatedResponse<DefectCase>;
export type DefectCaseDetailResponse = ApiResponse<DefectCaseDetail>;
export type DefectCaseStatisticsResponse = ApiResponse<DefectCaseStatistics>;
export type ReportDraftResponse = ApiResponse<ReportDraft>;
