package service

import (
	"testing"
	"time"

	"xunjianbao-backend/internal/model"
)

func TestDefectCaseModel(t *testing.T) {
	now := time.Now()
	caseItem := model.DefectCase{
		ID:          1,
		TenantID:    "tenant-001",
		Title:       "Test Defect Case",
		Family:      model.DefectFamilySecurity,
		DefectType:  model.DefectTypeIntrusion,
		Severity:    model.SeverityHigh,
		Status:      model.DefectCaseStatusConfirmed,
		Location:    "Test Location",
		Description: "Test description",
		FirstSeenAt: now,
		LastSeenAt:  now,
	}

	if caseItem.Title != "Test Defect Case" {
		t.Errorf("Title = %q, want %q", caseItem.Title, "Test Defect Case")
	}
	if caseItem.Family != model.DefectFamilySecurity {
		t.Errorf("Family = %q, want %q", caseItem.Family, model.DefectFamilySecurity)
	}
	if caseItem.Severity != model.SeverityHigh {
		t.Errorf("Severity = %q, want %q", caseItem.Severity, model.SeverityHigh)
	}
}

func TestDefectEvidenceModel(t *testing.T) {
	evidence := model.DefectEvidence{
		ID:               1,
		CaseID:           1,
		Source:           "yolo",
		ThumbnailURL:      "/api/v1/media/files/test_thumb.jpg",
		IsRepresentative:  true,
		Confidence:       0.95,
		Timestamp:        time.Now(),
	}

	if evidence.IsRepresentative != true {
		t.Error("IsRepresentative should be true")
	}
	if evidence.Confidence != 0.95 {
		t.Errorf("Confidence = %f, want %f", evidence.Confidence, 0.95)
	}
}

func TestDuplicateGroupModel(t *testing.T) {
	group := model.DuplicateGroup{
		ID:          1,
		CaseID:      1,
		Method:      "hash",
		Score:       0.95,
		MemberCount: 3,
	}

	if group.Method != "hash" {
		t.Errorf("Method = %q, want %q", group.Method, "hash")
	}
	if group.Score != 0.95 {
		t.Errorf("Score = %f, want %f", group.Score, 0.95)
	}
	if group.MemberCount != 3 {
		t.Errorf("MemberCount = %d, want %d", group.MemberCount, 3)
	}
}

func TestReportDraftModel(t *testing.T) {
	draft := model.ReportDraft{
		ID:        1,
		CaseID:    1,
		Title:     "Test Report",
		Overview:  "Test overview",
		Status:    model.ReportDraftStatusDraft,
	}

	if draft.Status != model.ReportDraftStatusDraft {
		t.Errorf("Status = %q, want %q", draft.Status, model.ReportDraftStatusDraft)
	}
}

func TestDefectCaseStatusTransitions(t *testing.T) {
	validTransitions := map[string][]string{
		"draft":      {"confirmed", "resolved", "closed"},
		"confirmed":  {"processing", "resolved", "closed"},
		"processing": {"resolved", "closed"},
		"resolved":   {"closed"},
		"closed":     {},
	}

	for from, toList := range validTransitions {
		for _, to := range toList {
			t.Run(from+"_to_"+to, func(t *testing.T) {
				if !isValidStatusTransition(from, to) {
					t.Errorf("Transition from %q to %q should be valid", from, to)
				}
			})
		}
	}

	invalidTransitions := []struct{ from, to string }{
		{"closed", "draft"},
		{"resolved", "processing"},
	}

	for _, tt := range invalidTransitions {
		t.Run(tt.from+"_to_"+tt.to+"_invalid", func(t *testing.T) {
			if isValidStatusTransition(tt.from, tt.to) {
				t.Errorf("Transition from %q to %q should be invalid", tt.from, tt.to)
			}
		})
	}
}

func isValidStatusTransition(from, to string) bool {
	validTransitions := map[string][]string{
		"draft":      {"confirmed", "resolved", "closed"},
		"confirmed":  {"processing", "resolved", "closed"},
		"processing": {"resolved", "closed"},
		"resolved":   {"closed"},
		"closed":     {},
	}

	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}

	for _, a := range allowed {
		if a == to {
			return true
		}
	}
	return false
}

func TestSeverityOrder(t *testing.T) {
	severities := []string{"critical", "high", "medium", "low"}
	order := map[string]int{
		"critical": 0,
		"high":     1,
		"medium":   2,
		"low":      3,
	}

	for i, sev := range severities {
		for j, other := range severities {
			if i < j {
				if !isHigherSeverity(sev, other) {
					t.Errorf("%q should be higher severity than %q", sev, other)
				}
			}
		}
	}

	if order["critical"] != 0 || order["low"] != 3 {
		t.Error("Severity order is incorrect")
	}
}

func isHigherSeverity(sev1, sev2 string) bool {
	order := map[string]int{
		"critical": 0,
		"high":     1,
		"medium":   2,
		"low":      3,
	}
	return order[sev1] < order[sev2]
}

func TestDefectFamilyClassification(t *testing.T) {
	families := []string{"security", "env", "structure", "equipment"}

	for _, family := range families {
		t.Run(family, func(t *testing.T) {
			if !isValidFamily(family) {
				t.Errorf("%q is a valid family", family)
			}
		})
	}

	invalidFamilies := []string{"unknown", "other", "mixed", ""}

	for _, family := range invalidFamilies {
		t.Run("invalid_"+family, func(t *testing.T) {
			if isValidFamily(family) {
				t.Errorf("%q should be invalid family", family)
			}
		})
	}
}

func isValidFamily(family string) bool {
	validFamilies := map[string]bool{
		"security":  true,
		"env":       true,
		"structure": true,
		"equipment": true,
	}
	return validFamilies[family]
}

func TestDefectTypeClassification(t *testing.T) {
	types := []string{
		"intrusion", "fire", "algae", "crack",
		"wall_damage", "stair_damage", "vehicle",
		"personnel", "leak", "other",
	}

	for _, defectType := range types {
		t.Run(defectType, func(t *testing.T) {
			if !isValidDefectType(defectType) {
				t.Errorf("%q is a valid defect type", defectType)
			}
		})
	}
}

func isValidDefectType(defectType string) bool {
	validTypes := map[string]bool{
		"intrusion":    true,
		"fire":         true,
		"algae":        true,
		"crack":        true,
		"wall_damage":  true,
		"stair_damage": true,
		"vehicle":      true,
		"personnel":    true,
		"leak":         true,
		"other":        true,
	}
	return validTypes[defectType]
}

func TestSimilarityCalculation(t *testing.T) {
	tests := []struct {
		name     string
		score1   float64
		score2   float64
		expected bool
	}{
		{"Both high", 0.95, 0.95, true},
		{"One low", 0.5, 0.95, false},
		{"Both low", 0.3, 0.3, false},
		{"Above threshold", 0.85, 0.9, true},
	}

	threshold := 0.8

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.score1 >= threshold && tt.score2 >= threshold
			if result != tt.expected {
				t.Errorf("Similarity check = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestConfidenceThreshold(t *testing.T) {
	thresholds := map[string]float64{
		"critical": 0.9,
		"high":     0.8,
		"medium":   0.7,
		"low":      0.6,
	}

	for severity, threshold := range thresholds {
		t.Run(severity, func(t *testing.T) {
			confidence := threshold + 0.05
			if confidence < threshold {
				t.Errorf("Confidence %f should meet threshold %f for %q",
					confidence, threshold, severity)
			}
		})
	}
}

func TestEvidenceValidation(t *testing.T) {
	tests := []struct {
		name      string
		evidence  model.DefectEvidence
		shouldErr bool
	}{
		{
			name: "Valid evidence",
			evidence: model.DefectEvidence{
				FileURL:    "/api/v1/media/files/test.jpg",
				Confidence: 0.95,
			},
			shouldErr: false,
		},
		{
			name: "Low confidence",
			evidence: model.DefectEvidence{
				FileURL:    "/api/v1/media/files/test.jpg",
				Confidence: 0.3,
			},
			shouldErr: true,
		},
		{
			name: "Empty FileURL",
			evidence: model.DefectEvidence{
				FileURL:    "",
				Confidence: 0.95,
			},
			shouldErr: true,
		},
	}

	minConfidence := 0.5

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateEvidence(tt.evidence, minConfidence)
			hasErr := err != nil
			if hasErr != tt.shouldErr {
				t.Errorf("validateEvidence() error = %v, shouldErr = %v", err, tt.shouldErr)
			}
		})
	}
}

func validateEvidence(evidence model.DefectEvidence, minConfidence float64) error {
	if evidence.FileURL == "" {
		return &ValidationError{Field: "FileURL", Message: "FileURL is required"}
	}
	if evidence.Confidence < minConfidence {
		return &ValidationError{Field: "Confidence", Message: "Confidence below threshold"}
	}
	return nil
}

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + ": " + e.Message
}
