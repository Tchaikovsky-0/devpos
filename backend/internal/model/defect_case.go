package model

import "time"

// DefectFamily 缺陷分类（一级）
type DefectFamily string

const (
	DefectFamilySecurity  DefectFamily = "security"  // 安防
	DefectFamilyEnv       DefectFamily = "env"       // 环境
	DefectFamilyStructure DefectFamily = "structure" // 结构
	DefectFamilyEquipment DefectFamily = "equipment" // 设备
)

// DefectType 缺陷类型（二级）
type DefectType string

const (
	// 安全类 (security)
	DefectTypeIntrusion  DefectType = "intrusion"           // 入侵（人员闯入）
	DefectTypeFire       DefectType = "fire"                // 火情（火焰/烟雾）

	// 环境类 (env)
	DefectTypeAlgae          DefectType = "algae"               // 蓝藻/水面污染
	DefectTypeWaterPollution DefectType = "water_pollution"    // 水体污染（油污/废水）
	DefectTypeWasteAccum     DefectType = "waste_accumulation" // 固废堆积
	DefectTypeGasLeak        DefectType = "gas_leak"          // 气体泄漏
	DefectTypeSmoke          DefectType = "smoke"              // 烟雾

	// 结构类 (structure)
	DefectTypeCrack      DefectType = "crack"            // 裂缝
	DefectTypeWallDamage DefectType = "wall_damage"     // 墙损
	DefectTypeStairDamage DefectType = "stair_damage"   // 楼梯损伤
	DefectTypeCorrosion  DefectType = "corrosion"      // 金属腐蚀
	DefectTypeDeformation DefectType = "deformation"    // 结构变形
	DefectTypeSeepage    DefectType = "seepage"        // 渗水

	// 设备类 (equipment)
	DefectTypeVehicle         DefectType = "vehicle"              // 车辆异常
	DefectTypePersonnel       DefectType = "personnel"            // 人员异常
	DefectTypeMeterAbnormal   DefectType = "meter_abnormal"      // 仪表读数异常
	DefectTypeVibrationAbnor DefectType = "vibration_abnormal" // 振动异常
	DefectTypeTempExceed      DefectType = "temperature_exceed"  // 温度超标
	DefectTypeSealDamage      DefectType = "seal_damage"        // 密封损坏

	// 其他
	DefectTypeLeak  DefectType = "leak"  // 泄漏
	DefectTypeOther DefectType = "other" // 其他
)

// DefectCaseStatus 缺陷案例状态
type DefectCaseStatus string

const (
	DefectCaseStatusDraft     DefectCaseStatus = "draft"      // 候选草稿
	DefectCaseStatusConfirmed DefectCaseStatus = "confirmed"  // 已确认
	DefectCaseStatusProcessing DefectCaseStatus = "processing" // 处理中
	DefectCaseStatusResolved  DefectCaseStatus = "resolved"  // 已解决
	DefectCaseStatusClosed    DefectCaseStatus = "closed"    // 已归档
)

// Severity 严重度
type Severity string

const (
	SeverityCritical Severity = "critical" // 紧急
	SeverityHigh     Severity = "high"     // 高
	SeverityMedium   Severity = "medium"   // 中
	SeverityLow      Severity = "low"      // 低
)

// ReportDraftStatus 报告草稿状态
type ReportDraftStatus string

const (
	ReportDraftStatusDraft    ReportDraftStatus = "draft"    // 草稿
	ReportDraftStatusReviewing ReportDraftStatus = "reviewing" // 待审核
	ReportDraftStatusApproved ReportDraftStatus = "approved" // 已确认
	ReportDraftStatusArchived ReportDraftStatus = "archived" // 已归档
)

// =============================================================================
// DefectCase 缺陷案例（一等公民）
// =============================================================================

type DefectCase struct {
	ID          uint             `json:"id" gorm:"primaryKey"`
	TenantID    string           `json:"tenant_id" gorm:"size:64;index"`
	Title       string           `json:"title" gorm:"size:255;not null"`
	Family      DefectFamily     `json:"family" gorm:"size:32;not null;index"`
	DefectType  DefectType       `json:"defect_type" gorm:"size:32;not null;index"`
	Severity    Severity         `json:"severity" gorm:"size:16;not null;default:'medium';index"`
	Status      DefectCaseStatus `json:"status" gorm:"size:32;not null;default:'draft';index"`

	// 位置信息
	Location    string   `json:"location" gorm:"size:255"`     // 位置描述
	Latitude    *float64 `json:"latitude" gorm:"type:decimal(10,7)"`
	Longitude   *float64 `json:"longitude" gorm:"type:decimal(10,7)"`

	// 设备/源信息
	StreamID    *string  `json:"stream_id" gorm:"size:64;index"`
	DeviceName  string   `json:"device_name" gorm:"size:128"`

	// 时间跨度
	FirstSeenAt time.Time  `json:"first_seen_at" gorm:"index"`
	LastSeenAt  time.Time  `json:"last_seen_at" gorm:"index"`

	// 统计
	EvidenceCount      int `json:"evidence_count" gorm:"default:0"`
	DuplicateCount     int `json:"duplicate_count" gorm:"default:0"`
	RepresentativeID   *uint `json:"representative_id" gorm:"index"` // 代表图 ID (指向 DefectEvidence)

	// 报告状态
	ReportStatus string `json:"report_status" gorm:"size:32;default:'none'"` // none/draft/approved

	// 描述
	Summary     string  `json:"summary" gorm:"type:text"`
	Description string  `json:"description" gorm:"type:text"`

	// 归并分数
	MergeScore  float64 `json:"merge_score" gorm:"type:decimal(5,4);default:0"`

	// 操作人
	CreatedBy *uint `json:"created_by" gorm:"index"`
	UpdatedBy *uint `json:"updated_by"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at" gorm:"index"`
}

func (DefectCase) TableName() string {
	return "defect_cases"
}

// =============================================================================
// DefectEvidence 缺陷证据
// =============================================================================

type DefectEvidence struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	TenantID    string     `json:"tenant_id" gorm:"size:64;index"`
	CaseID      uint       `json:"case_id" gorm:"index;not null"`

	// 来源
	Source      string     `json:"source" gorm:"size:32;not null"` // yolo/specialist/manual
	DetectionID *string    `json:"detection_id" gorm:"size:64;index"` // 关联 YOLODetection.ID
	MediaID     *uint      `json:"media_id" gorm:"index"` // 关联 Media.ID

	// 检测结果
	Family      DefectFamily `json:"family" gorm:"size:32;not null"`
	DefectType  DefectType   `json:"defect_type" gorm:"size:32;not null"`
	Confidence  float64     `json:"confidence" gorm:"type:decimal(5,4)"`
	BBox        string      `json:"bbox" gorm:"type:json"` // [x1,y1,x2,y2]
	Mask        string      `json:"mask" gorm:"type:json"`  // 分割掩码

	// 图像指纹
	Phash       string      `json:"phash" gorm:"size:64"`
	DHash       string      `json:"dhash" gorm:"size:64"`
	EmbeddingRef string     `json:"embedding_ref" gorm:"size:255"` // 向量引用

	// 位置与时间
	Timestamp   time.Time   `json:"timestamp" gorm:"index"`
	Location    string      `json:"location" gorm:"size:255"`
	Latitude    *float64    `json:"latitude" gorm:"type:decimal(10,7)"`
	Longitude   *float64    `json:"longitude" gorm:"type:decimal(10,7)"`

	// 去重
	DuplicateGroupID *uint `json:"duplicate_group_id" gorm:"index"` // 归属的重复组
	IsRepresentative bool  `json:"is_representative" gorm:"default:false"`

	// 元信息
	FileURL     string     `json:"file_url" gorm:"size:512"`
	ThumbnailURL string    `json:"thumbnail_url" gorm:"size:512"`
	MimeType    string     `json:"mime_type" gorm:"size:128"`

	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at" gorm:"index"`
}

func (DefectEvidence) TableName() string {
	return "defect_evidences"
}

// =============================================================================
// DuplicateGroup 重复组
// =============================================================================

type DuplicateGroup struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	TenantID    string     `json:"tenant_id" gorm:"size:64;index"`
	CaseID      uint       `json:"case_id" gorm:"index;not null"`

	// 去重方式
	Method      string     `json:"method" gorm:"size:32;not null"` // phash/dhash/ssim/clip/dino/siglip
	Score       float64    `json:"score" gorm:"type:decimal(5,4)"`

	// 代表证据
	RepresentativeID uint   `json:"representative_id" gorm:"index;not null"`

	// 统计
	MemberCount int        `json:"member_count" gorm:"default:1"`

	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (DuplicateGroup) TableName() string {
	return "duplicate_groups"
}

// =============================================================================
// ReportDraft 报告草稿
// =============================================================================

type ReportDraft struct {
	ID          uint             `json:"id" gorm:"primaryKey"`
	TenantID    string           `json:"tenant_id" gorm:"size:64;index"`
	CaseID      uint             `json:"case_id" gorm:"index;not null"`

	Title       string           `json:"title" gorm:"size:255;not null"`
	Status      ReportDraftStatus `json:"status" gorm:"size:32;not null;default:'draft'"`

	// 结构化报告内容
	Overview    string           `json:"overview" gorm:"type:text"`       // 报告概述
	Conclusion  string           `json:"conclusion" gorm:"type:text"`     // 缺陷结论
	EvidenceDesc string          `json:"evidence_desc" gorm:"type:text"`  // 证据说明
	TimeInfo    string           `json:"time_info" gorm:"type:text"`      // 时间信息
	LocationInfo string         `json:"location_info" gorm:"type:text"`   // 地点/设备信息
	SeverityImpact string       `json:"severity_impact" gorm:"type:text"` // 严重度与影响
	Suggestions string           `json:"suggestions" gorm:"type:text"`    // 处置建议

	// 证据追溯
	RepresentativeID *uint `json:"representative_id" gorm:"index"`  // 代表图
	EvidenceTotal     int  `json:"evidence_total" gorm:"default:0"` // 证据总数
	DuplicateFolded   int  `json:"duplicate_folded" gorm:"default:0"` // 已折叠重复数
	TimeRangeStart    *time.Time `json:"time_range_start"`
	TimeRangeEnd      *time.Time `json:"time_range_end"`

	// AI 生成信息
	GeneratedBy  string    `json:"generated_by" gorm:"size:64"`  // 生成来源 (openclaw/manual)
	ReviewedBy   *uint     `json:"reviewed_by"`                   // 审核人
	ApprovedAt   *time.Time `json:"approved_at"`                  // 确认时间

	// 导出
	FileURL      string    `json:"file_url" gorm:"size:512"`      // 导出文件 URL
	ExportFormat string    `json:"export_format" gorm:"size:32"`  // pdf/docx

	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

func (ReportDraft) TableName() string {
	return "report_drafts"
}
