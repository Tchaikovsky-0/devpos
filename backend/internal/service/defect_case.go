package service

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/pkg/pagination"
)

// =============================================================================
// DefectCase Service
// =============================================================================

type DefectCaseService struct {
	db *gorm.DB
}

func NewDefectCaseService(db *gorm.DB) *DefectCaseService {
	return &DefectCaseService{db: db}
}

// --- Request / Response DTOs ---

type CreateDefectCaseRequest struct {
	Title      string           `json:"title" binding:"required"`
	Family     string           `json:"family" binding:"required"`
	DefectType string           `json:"defect_type" binding:"required"`
	Severity   string           `json:"severity"`
	Location   string           `json:"location"`
	Latitude   *float64         `json:"latitude"`
	Longitude  *float64         `json:"longitude"`
	StreamID   *string          `json:"stream_id"`
	DeviceName string           `json:"device_name"`
	Summary    string           `json:"summary"`
	DetectionIDs []string       `json:"detection_ids"` // 从检测创建时传入
}

type UpdateDefectCaseRequest struct {
	Title       *string `json:"title"`
	Severity    *string `json:"severity"`
	Status      *string `json:"status"`
	Location    *string `json:"location"`
	Summary     *string `json:"summary"`
	Description *string `json:"description"`
	ReportStatus *string `json:"report_status"`
}

type MergeCasesRequest struct {
	TargetCaseID  uint   `json:"target_case_id" binding:"required"`
	SourceCaseIDs []uint `json:"source_case_ids" binding:"required,min=1"`
}

type SplitCaseRequest struct {
	EvidenceIDs []uint `json:"evidence_ids" binding:"required,min=1"`
	NewTitle    string `json:"new_title"`
}

type SetRepresentativeRequest struct {
	EvidenceID uint `json:"evidence_id" binding:"required"`
}

type CreateReportDraftRequest struct {
	Title string `json:"title" binding:"required"`
}

type UpdateReportDraftRequest struct {
	Title            *string `json:"title"`
	Overview         *string `json:"overview"`
	Conclusion       *string `json:"conclusion"`
	EvidenceDesc     *string `json:"evidence_desc"`
	TimeInfo         *string `json:"time_info"`
	LocationInfo     *string `json:"location_info"`
	SeverityImpact   *string `json:"severity_impact"`
	Suggestions      *string `json:"suggestions"`
	Status           *string `json:"status"`
}

type ApproveReportDraftRequest struct {
	ExportFormat string `json:"export_format"`
}

// AddEvidenceRequest 向案例添加证据的请求
type AddEvidenceRequest struct {
	Source       string   `json:"source" binding:"required"`        // yolo/specialist/manual
	DetectionID  *string  `json:"detection_id"`                     // 关联 YOLODetection.ID
	MediaID      *uint    `json:"media_id"`                         // 关联 Media.ID
	Family       string   `json:"family" binding:"required"`        // security/env/structure/equipment
	DefectType   string   `json:"defect_type" binding:"required"`   // 具体缺陷类型
	Confidence   float64  `json:"confidence"`                       // 置信度
	BBox         string   `json:"bbox"`                             // JSON [x1,y1,x2,y2]
	Mask         string   `json:"mask"`                             // 分割掩码 JSON
	Phash        string   `json:"phash"`                            // 感知哈希
	DHash        string   `json:"dhash"`                            // 差值哈希
	EmbeddingRef string   `json:"embedding_ref"`                    // 向量引用
	Timestamp    string   `json:"timestamp"`                        // ISO8601 时间
	Location     string   `json:"location"`                         // 位置描述
	Latitude     *float64 `json:"latitude"`                         // 纬度
	Longitude    *float64 `json:"longitude"`                        // 经度
	FileURL      string   `json:"file_url"`                         // 原图 URL
	ThumbnailURL string   `json:"thumbnail_url"`                    // 缩略图 URL
	MimeType     string   `json:"mime_type"`                        // MIME 类型
}

// DefectCaseListParams 案例列表查询参数
type DefectCaseListParams struct {
	Family     string `form:"family"`
	DefectType string `form:"defect_type"`
	Severity   string `form:"severity"`
	Status     string `form:"status"`
	ReportStatus string `form:"report_status"`
	Keyword    string `form:"keyword"`
	StreamID   string `form:"stream_id"`
	StartDate  string `form:"start_date"`
	EndDate    string `form:"end_date"`
}

// --- List ---

func (s *DefectCaseService) List(tenantID string, params DefectCaseListParams, p pagination.Params) ([]model.DefectCase, int64, error) {
	var cases []model.DefectCase
	var total int64

	query := s.db.Where("tenant_id = ?", tenantID)

	if params.Family != "" {
		query = query.Where("family = ?", params.Family)
	}
	if params.DefectType != "" {
		query = query.Where("defect_type = ?", params.DefectType)
	}
	if params.Severity != "" {
		query = query.Where("severity = ?", params.Severity)
	}
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.ReportStatus != "" {
		query = query.Where("report_status = ?", params.ReportStatus)
	}
	if params.StreamID != "" {
		query = query.Where("stream_id = ?", params.StreamID)
	}
	if params.Keyword != "" {
		query = query.Where("title LIKE ? OR location LIKE ? OR summary LIKE ?",
			"%"+params.Keyword+"%", "%"+params.Keyword+"%", "%"+params.Keyword+"%")
	}
	if params.StartDate != "" {
		query = query.Where("first_seen_at >= ?", params.StartDate)
	}
	if params.EndDate != "" {
		query = query.Where("last_seen_at <= ?", params.EndDate)
	}

	query.Model(&model.DefectCase{}).Count(&total)

	if err := query.Order("created_at DESC").Offset(p.Offset).Limit(p.PageSize).Find(&cases).Error; err != nil {
		return nil, 0, err
	}

	return cases, total, nil
}

// --- GetByID with evidences ---

type DefectCaseDetail struct {
	model.DefectCase
	Evidences       []model.DefectEvidence `json:"evidences"`
	DuplicateGroups []model.DuplicateGroup `json:"duplicate_groups"`
	ReportDrafts    []model.ReportDraft     `json:"report_drafts"`
}

func (s *DefectCaseService) GetByID(tenantID string, id uint) (*DefectCaseDetail, error) {
	var defectCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&defectCase).Error; err != nil {
		return nil, ErrNotFound
	}

	detail := &DefectCaseDetail{DefectCase: defectCase}

	// 加载证据
	s.db.Where("case_id = ?", id).Order("timestamp DESC").Find(&detail.Evidences)

	// 加载重复组
	s.db.Where("case_id = ?", id).Find(&detail.DuplicateGroups)

	// 加载报告草稿
	s.db.Where("case_id = ?", id).Order("created_at DESC").Find(&detail.ReportDrafts)

	return detail, nil
}

// --- Create ---

func (s *DefectCaseService) Create(tenantID string, userID uint, req CreateDefectCaseRequest) (*model.DefectCase, error) {
	now := time.Now()
	defectCase := &model.DefectCase{
		TenantID:    tenantID,
		Title:       req.Title,
		Family:      model.DefectFamily(req.Family),
		DefectType:  model.DefectType(req.DefectType),
		Severity:    model.Severity(req.Severity),
		Status:      model.DefectCaseStatusDraft,
		Location:    req.Location,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		StreamID:    req.StreamID,
		DeviceName:  req.DeviceName,
		Summary:     req.Summary,
		FirstSeenAt: now,
		LastSeenAt:  now,
		CreatedBy:   &userID,
	}

	if defectCase.Severity == "" {
		defectCase.Severity = model.SeverityMedium
	}

	tx := s.db.Begin()
	if err := tx.Create(defectCase).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 如果传入了 detection_ids，创建对应证据
	if len(req.DetectionIDs) > 0 {
		for _, detID := range req.DetectionIDs {
			evidence := &model.DefectEvidence{
				TenantID:    tenantID,
				CaseID:      defectCase.ID,
				Source:      "yolo",
				DetectionID: &detID,
				Family:      defectCase.Family,
				DefectType:  defectCase.DefectType,
				Confidence:  0,
				Timestamp:   now,
				Location:    req.Location,
				Latitude:    req.Latitude,
				Longitude:   req.Longitude,
			}
			if err := tx.Create(evidence).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
		}
		defectCase.EvidenceCount = len(req.DetectionIDs)
		tx.Model(defectCase).Update("evidence_count", defectCase.EvidenceCount)

		// 设第一条为代表图
		if len(req.DetectionIDs) > 0 {
			var firstEvidence model.DefectEvidence
			tx.Where("case_id = ?", defectCase.ID).First(&firstEvidence)
			defectCase.RepresentativeID = &firstEvidence.ID
			tx.Model(defectCase).Update("representative_id", firstEvidence.ID)
			tx.Model(&firstEvidence).Update("is_representative", true)
		}
	}

	tx.Commit()

	// 重新加载
	s.db.Where("id = ?", defectCase.ID).First(defectCase)
	return defectCase, nil
}

// --- Update ---

func (s *DefectCaseService) Update(tenantID string, id uint, req UpdateDefectCaseRequest) (*model.DefectCase, error) {
	var defectCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&defectCase).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Severity != nil {
		updates["severity"] = *req.Severity
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.Summary != nil {
		updates["summary"] = *req.Summary
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.ReportStatus != nil {
		updates["report_status"] = *req.ReportStatus
	}

	if len(updates) > 0 {
		if err := s.db.Model(&defectCase).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	s.db.Where("id = ? AND tenant_id = ?", id, tenantID).First(&defectCase)
	return &defectCase, nil
}

// --- Delete ---

func (s *DefectCaseService) Delete(tenantID string, id uint) error {
	result := s.db.Where("id = ? AND tenant_id = ?", id, tenantID).Delete(&model.DefectCase{})
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return result.Error
}

// --- Merge Cases: 把多个案例合并到目标案例 ---

func (s *DefectCaseService) MergeCases(tenantID string, req MergeCasesRequest) (*DefectCaseDetail, error) {
	// 验证目标案例存在
	var targetCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", req.TargetCaseID, tenantID).First(&targetCase).Error; err != nil {
		return nil, ErrNotFound
	}

	tx := s.db.Begin()

	// 把源案例的证据全部转移到目标
	for _, sourceID := range req.SourceCaseIDs {
		var sourceCase model.DefectCase
		if err := tx.Where("id = ? AND tenant_id = ?", sourceID, tenantID).First(&sourceCase).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("source case %d not found: %w", sourceID, ErrNotFound)
		}

		// 转移证据
		tx.Model(&model.DefectEvidence{}).
			Where("case_id = ?", sourceID).
			Update("case_id", req.TargetCaseID)

		// 转移重复组
		tx.Model(&model.DuplicateGroup{}).
			Where("case_id = ?", sourceID).
			Update("case_id", req.TargetCaseID)

		// 删除源案例
		tx.Delete(&sourceCase)
	}

	// 更新目标案例统计
	var evidenceCount int64
	tx.Model(&model.DefectEvidence{}).Where("case_id = ?", req.TargetCaseID).Count(&evidenceCount)

	updates := map[string]interface{}{
		"evidence_count": evidenceCount,
	}

	// 更新时间跨度
	var firstSeen, lastSeen time.Time
	tx.Model(&model.DefectEvidence{}).
		Where("case_id = ?", req.TargetCaseID).
		Select("MIN(timestamp)").Scan(&firstSeen)
	tx.Model(&model.DefectEvidence{}).
		Where("case_id = ?", req.TargetCaseID).
		Select("MAX(timestamp)").Scan(&lastSeen)

	if !firstSeen.IsZero() {
		updates["first_seen_at"] = firstSeen
	}
	if !lastSeen.IsZero() {
		updates["last_seen_at"] = lastSeen
	}

	updates["status"] = model.DefectCaseStatusConfirmed
	tx.Model(&targetCase).Updates(updates)

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return s.GetByID(tenantID, req.TargetCaseID)
}

// --- Split Case: 从案例中拆出证据形成新案例 ---

func (s *DefectCaseService) SplitCase(tenantID string, caseID uint, userID uint, req SplitCaseRequest) (*model.DefectCase, error) {
	var originalCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", caseID, tenantID).First(&originalCase).Error; err != nil {
		return nil, ErrNotFound
	}

	tx := s.db.Begin()

	// 创建新案例
	title := req.NewTitle
	if title == "" {
		title = fmt.Sprintf("%s（拆分）", originalCase.Title)
	}
	newCase := &model.DefectCase{
		TenantID:    tenantID,
		Title:       title,
		Family:      originalCase.Family,
		DefectType:  originalCase.DefectType,
		Severity:    originalCase.Severity,
		Status:      model.DefectCaseStatusDraft,
		Location:    originalCase.Location,
		Latitude:    originalCase.Latitude,
		Longitude:   originalCase.Longitude,
		StreamID:    originalCase.StreamID,
		DeviceName:  originalCase.DeviceName,
		Summary:     "从案例「" + originalCase.Title + "」拆分",
		FirstSeenAt: time.Now(),
		LastSeenAt:  time.Now(),
		CreatedBy:   &userID,
	}
	if err := tx.Create(newCase).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 转移证据到新案例
	if err := tx.Model(&model.DefectEvidence{}).
		Where("id IN ? AND case_id = ?", req.EvidenceIDs, caseID).
		Update("case_id", newCase.ID).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 更新原案例统计
	var remainCount int64
	tx.Model(&model.DefectEvidence{}).Where("case_id = ?", caseID).Count(&remainCount)
	tx.Model(&originalCase).Update("evidence_count", remainCount)

	// 更新新案例统计
	var newEvidenceCount int64
	tx.Model(&model.DefectEvidence{}).Where("case_id = ?", newCase.ID).Count(&newEvidenceCount)
	tx.Model(newCase).Update("evidence_count", newEvidenceCount)

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	s.db.Where("id = ?", newCase.ID).First(newCase)
	return newCase, nil
}

// --- Set Representative: 指定代表图 ---

func (s *DefectCaseService) SetRepresentative(tenantID string, caseID uint, req SetRepresentativeRequest) (*model.DefectCase, error) {
	var defectCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", caseID, tenantID).First(&defectCase).Error; err != nil {
		return nil, ErrNotFound
	}

	var evidence model.DefectEvidence
	if err := s.db.Where("id = ? AND case_id = ?", req.EvidenceID, caseID).First(&evidence).Error; err != nil {
		return nil, ErrNotFound
	}

	tx := s.db.Begin()

	// 取消旧代表图标记
	tx.Model(&model.DefectEvidence{}).
		Where("case_id = ? AND is_representative = ?", caseID, true).
		Update("is_representative", false)

	// 设置新代表图
	tx.Model(&evidence).Update("is_representative", true)

	// 更新案例
	tx.Model(&defectCase).Update("representative_id", req.EvidenceID)

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	s.db.Where("id = ?", caseID).First(&defectCase)
	return &defectCase, nil
}

// --- Add Evidence to Case ---

func (s *DefectCaseService) AddEvidence(tenantID string, caseID uint, evidence model.DefectEvidence) (*model.DefectEvidence, error) {
	var defectCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", caseID, tenantID).First(&defectCase).Error; err != nil {
		return nil, ErrNotFound
	}

	evidence.TenantID = tenantID
	evidence.CaseID = caseID
	if evidence.Timestamp.IsZero() {
		evidence.Timestamp = time.Now()
	}

	if err := s.db.Create(&evidence).Error; err != nil {
		return nil, err
	}

	// 更新案例统计
	s.db.Model(&defectCase).Update("evidence_count", gorm.Expr("evidence_count + 1"))
	s.db.Model(&defectCase).Update("last_seen_at", time.Now())

	return &evidence, nil
}

// --- Batch Save Evidence from Media Analysis ---

// DefectEvidenceInput represents a single defect region from AI analysis
type DefectEvidenceInput struct {
	BBox       []float64 `json:"bbox" binding:"required"`        // [x1, y1, x2, y2] normalized 0-1
	DefectType string    `json:"defect_type" binding:"required"` // e.g., "crack", "intrusion"
	Family    string    `json:"family" binding:"required"`    // e.g., "security", "structure"
	Severity  string    `json:"severity"`                      // "low", "medium", "high", "critical"
	Confidence float64   `json:"confidence"`                     // 0-1
	Confirmed  bool     `json:"confirmed"`                     // user confirmed
}

// SaveEvidenceFromMediaAnalysis saves confirmed defect evidence from AI media analysis
func (s *DefectCaseService) SaveEvidenceFromMediaAnalysis(tenantID string, userID uint, mediaID uint, family, defectType string, severity string, confidence float64, bbox []float64) (*model.DefectEvidence, error) {
	// Find or create a defect case for this media
	defectCase, err := s.findOrCreateCaseFromMedia(tenantID, userID, mediaID, family, defectType, severity)
	if err != nil {
		return nil, err
	}

	// Serialize bbox to JSON
	bboxJSON, err := json.Marshal(bbox)
	if err != nil {
		return nil, fmt.Errorf("serialize bbox: %w", err)
	}

	// Create evidence record
	evidence := model.DefectEvidence{
		TenantID:   tenantID,
		CaseID:     defectCase.ID,
		Source:     "ai", // AI detected
		MediaID:    &mediaID,
		Family:     model.DefectFamily(family),
		DefectType: model.DefectType(defectType),
		Confidence: confidence,
		BBox:       string(bboxJSON),
		Timestamp:  time.Now(),
	}

	if err := s.db.Create(&evidence).Error; err != nil {
		return nil, fmt.Errorf("create evidence: %w", err)
	}

	// Update case statistics
	s.db.Model(defectCase).Updates(map[string]interface{}{
		"evidence_count": gorm.Expr("evidence_count + 1"),
		"last_seen_at":   time.Now(),
	})

	return &evidence, nil
}

// findOrCreateCaseFromMedia finds or creates a defect case for a given media
func (s *DefectCaseService) findOrCreateCaseFromMedia(tenantID string, userID uint, mediaID uint, family, defectType string, severity string) (*model.DefectCase, error) {
	// Check if there's already a case for this media with the same defect type
	var existingCase model.DefectCase
	err := s.db.Where(
		"tenant_id = ? AND family = ? AND defect_type = ? AND status != ?",
		tenantID, family, defectType, model.DefectCaseStatusClosed,
	).First(&existingCase).Error

	if err == nil {
		// Found existing case, return it
		return &existingCase, nil
	}

	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("query existing case: %w", err)
	}

	// Create new case
	newCase := &model.DefectCase{
		TenantID:    tenantID,
		Title:       fmt.Sprintf("AI检测 - %s - %s", family, defectType),
		Family:      model.DefectFamily(family),
		DefectType:  model.DefectType(defectType),
		Severity:    model.Severity(severity),
		Status:      model.DefectCaseStatusDraft,
		FirstSeenAt: time.Now(),
		LastSeenAt:  time.Now(),
	}

	if err := s.db.Create(newCase).Error; err != nil {
		return nil, fmt.Errorf("create case: %w", err)
	}

	return newCase, nil
}

// --- Report Draft ---

func (s *DefectCaseService) CreateReportDraft(tenantID string, caseID uint, req CreateReportDraftRequest) (*model.ReportDraft, error) {
	var defectCase model.DefectCase
	if err := s.db.Where("id = ? AND tenant_id = ?", caseID, tenantID).First(&defectCase).Error; err != nil {
		return nil, ErrNotFound
	}

	// 收集证据统计
	var evidenceCount int64
	s.db.Model(&model.DefectEvidence{}).Where("case_id = ?", caseID).Count(&evidenceCount)

	var duplicateFolded int
	s.db.Model(&model.DuplicateGroup{}).
		Where("case_id = ?", caseID).
		Select("COALESCE(SUM(member_count - 1), 0)").Scan(&duplicateFolded)

	draft := &model.ReportDraft{
		TenantID:       tenantID,
		CaseID:         caseID,
		Title:          req.Title,
		Status:         model.ReportDraftStatusDraft,
		GeneratedBy:    "openclaw",
		RepresentativeID: defectCase.RepresentativeID,
		EvidenceTotal:  int(evidenceCount),
		DuplicateFolded: duplicateFolded,
		TimeRangeStart: &defectCase.FirstSeenAt,
		TimeRangeEnd:   &defectCase.LastSeenAt,
	}

	if err := s.db.Create(draft).Error; err != nil {
		return nil, err
	}

	// 更新案例的报告状态
	s.db.Model(&defectCase).Update("report_status", "draft")

	return draft, nil
}

func (s *DefectCaseService) UpdateReportDraft(tenantID string, draftID uint, req UpdateReportDraftRequest) (*model.ReportDraft, error) {
	var draft model.ReportDraft
	if err := s.db.Where("id = ? AND tenant_id = ?", draftID, tenantID).First(&draft).Error; err != nil {
		return nil, ErrNotFound
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Overview != nil {
		updates["overview"] = *req.Overview
	}
	if req.Conclusion != nil {
		updates["conclusion"] = *req.Conclusion
	}
	if req.EvidenceDesc != nil {
		updates["evidence_desc"] = *req.EvidenceDesc
	}
	if req.TimeInfo != nil {
		updates["time_info"] = *req.TimeInfo
	}
	if req.LocationInfo != nil {
		updates["location_info"] = *req.LocationInfo
	}
	if req.SeverityImpact != nil {
		updates["severity_impact"] = *req.SeverityImpact
	}
	if req.Suggestions != nil {
		updates["suggestions"] = *req.Suggestions
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) > 0 {
		s.db.Model(&draft).Updates(updates)
	}

	s.db.Where("id = ?", draftID).First(&draft)
	return &draft, nil
}

func (s *DefectCaseService) ApproveReportDraft(tenantID string, draftID uint, userID uint, req ApproveReportDraftRequest) (*model.ReportDraft, error) {
	var draft model.ReportDraft
	if err := s.db.Where("id = ? AND tenant_id = ?", draftID, tenantID).First(&draft).Error; err != nil {
		return nil, ErrNotFound
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":      model.ReportDraftStatusApproved,
		"reviewed_by": userID,
		"approved_at": now,
	}
	if req.ExportFormat != "" {
		updates["export_format"] = req.ExportFormat
	}

	s.db.Model(&draft).Updates(updates)

	// 更新案例的报告状态
	s.db.Model(&model.DefectCase{}).Where("id = ?", draft.CaseID).
		Update("report_status", "approved")

	s.db.Where("id = ?", draftID).First(&draft)
	return &draft, nil
}

func (s *DefectCaseService) GetReportDraft(tenantID string, draftID uint) (*model.ReportDraft, error) {
	var draft model.ReportDraft
	if err := s.db.Where("id = ? AND tenant_id = ?", draftID, tenantID).First(&draft).Error; err != nil {
		return nil, ErrNotFound
	}
	return &draft, nil
}

// --- Statistics ---

func (s *DefectCaseService) Statistics(tenantID string) (map[string]interface{}, error) {
	var total int64
	var draft int64
	var confirmed int64
	var processing int64
	var resolved int64
	var closed int64

	s.db.Model(&model.DefectCase{}).Where("tenant_id = ?", tenantID).Count(&total)
	s.db.Model(&model.DefectCase{}).Where("tenant_id = ? AND status = ?", tenantID, model.DefectCaseStatusDraft).Count(&draft)
	s.db.Model(&model.DefectCase{}).Where("tenant_id = ? AND status = ?", tenantID, model.DefectCaseStatusConfirmed).Count(&confirmed)
	s.db.Model(&model.DefectCase{}).Where("tenant_id = ? AND status = ?", tenantID, model.DefectCaseStatusProcessing).Count(&processing)
	s.db.Model(&model.DefectCase{}).Where("tenant_id = ? AND status = ?", tenantID, model.DefectCaseStatusResolved).Count(&resolved)
	s.db.Model(&model.DefectCase{}).Where("tenant_id = ? AND status = ?", tenantID, model.DefectCaseStatusClosed).Count(&closed)

	// 按严重度统计
	type SeverityStat struct {
		Severity string `json:"severity"`
		Count    int64  `json:"count"`
	}
	var severityStats []SeverityStat
	s.db.Model(&model.DefectCase{}).
		Select("severity, count(*) as count").
		Where("tenant_id = ?", tenantID).
		Group("severity").
		Find(&severityStats)

	// 按家族统计
	type FamilyStat struct {
		Family string `json:"family"`
		Count  int64  `json:"count"`
	}
	var familyStats []FamilyStat
	s.db.Model(&model.DefectCase{}).
		Select("family, count(*) as count").
		Where("tenant_id = ?", tenantID).
		Group("family").
		Find(&familyStats)

	// 报告草稿统计
	var draftReportCount int64
	s.db.Model(&model.ReportDraft{}).
		Where("tenant_id = ? AND status = ?", tenantID, model.ReportDraftStatusDraft).
		Count(&draftReportCount)

	return map[string]interface{}{
		"total":            total,
		"draft":            draft,
		"confirmed":        confirmed,
		"processing":       processing,
		"resolved":         resolved,
		"closed":           closed,
		"by_severity":      severityStats,
		"by_family":        familyStats,
		"draft_reports":    draftReportCount,
	}, nil
}

// --- Batch create candidate cases from detections ---
// 从检测记录批量创建候选案例

func (s *DefectCaseService) CreateCandidateFromDetection(tenantID string, userID uint, detectionID string) (*model.DefectCase, error) {
	// 查找原始检测记录
	var detection model.YOLODetection
	if err := s.db.Where("id = ?", detectionID).First(&detection).Error; err != nil {
		return nil, ErrNotFound
	}

	// 解析检测对象
	var objects []map[string]interface{}
	if detection.Objects != "" {
		if err := json.Unmarshal([]byte(detection.Objects), &objects); err != nil {
			objects = []map[string]interface{}{}
		}
	}

	// 推断缺陷类型
	family, defectType := inferDefectType(objects)

	title := fmt.Sprintf("检测发现 %s - %s", family, detection.Timestamp.Format("01-02 15:04"))

	req := CreateDefectCaseRequest{
		Title:        title,
		Family:       string(family),
		DefectType:   string(defectType),
		Severity:     "medium",
		StreamID:     &detection.StreamID,
		Summary:      fmt.Sprintf("由检测 %s 自动创建候选案例，置信度 %.2f", detectionID, detection.Confidence),
		DetectionIDs: []string{detectionID},
	}

	return s.Create(tenantID, userID, req)
}

// inferDefectType 从检测对象推断缺陷分类
func inferDefectType(objects []map[string]interface{}) (model.DefectFamily, model.DefectType) {
	if len(objects) == 0 {
		return model.DefectFamilySecurity, model.DefectTypeOther
	}

	// 遍历检测对象，取置信度最高的分类
	bestLabel := ""
	bestConf := 0.0
	for _, obj := range objects {
		if label, ok := obj["label"].(string); ok {
			if conf, ok := obj["confidence"].(float64); ok && conf > bestConf {
				bestLabel = label
				bestConf = conf
			}
		}
		if class, ok := obj["class"].(string); ok {
			if conf, ok := obj["confidence"].(float64); ok && conf > bestConf {
				bestLabel = class
				bestConf = conf
			}
		}
	}

	switch bestLabel {
	case "fire", "smoke":
		return model.DefectFamilyEnv, model.DefectTypeFire
	case "person", "intruder":
		return model.DefectFamilySecurity, model.DefectTypeIntrusion
	case "crack":
		return model.DefectFamilyStructure, model.DefectTypeCrack
	case "vehicle":
		return model.DefectFamilyEquipment, model.DefectTypeVehicle
	case "algae", "cyanobacteria":
		return model.DefectFamilyEnv, model.DefectTypeAlgae
	default:
		return model.DefectFamilySecurity, model.DefectTypeOther
	}
}
