package service

import (
	"encoding/json"
	"testing"
	"time"

	"xunjianbao-backend/internal/model"
)

// setupAlertRuleTestDB creates a test DB with all needed tables for alert rule tests.
func setupAlertRuleTestDB(t *testing.T) *AlertRuleService {
	t.Helper()
	db := setupTestDB(t)
	// Migrate extra models needed for alert rules
	if err := db.AutoMigrate(&model.AlertRule{}, &model.Role{}, &model.Alert{}); err != nil {
		t.Fatalf("failed to migrate alert rule models: %v", err)
	}

	wsHub := NewWebSocketHub()
	alertSvc := NewAlertService(db, wsHub)
	notifSvc := NewNotificationService()
	return NewAlertRuleService(db, alertSvc, notifSvc)
}

func validConditionsJSON() string {
	cond := model.AlertRuleCondition{
		Metric:    "temperature",
		Operator:  "gt",
		Threshold: 80,
		Duration:  60,
	}
	b, _ := json.Marshal(cond)
	return string(b)
}

func validActionsJSON() string {
	actions := []model.AlertRuleAction{
		{Type: "webhook", Target: "https://example.com/hook"},
	}
	b, _ := json.Marshal(actions)
	return string(b)
}

// ---------- CreateRule ----------

func TestCreateRule_Success(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "High Temperature",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(),
		Actions:    validActionsJSON(),
		Severity:   "critical",
	}

	rule, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rule.ID == 0 {
		t.Error("expected rule.ID > 0")
	}
	if rule.Name != "High Temperature" {
		t.Errorf("expected name 'High Temperature', got %q", rule.Name)
	}
	if rule.Severity != "critical" {
		t.Errorf("expected severity 'critical', got %q", rule.Severity)
	}
	if !rule.Enabled {
		t.Error("expected rule to be enabled by default")
	}
	if rule.CooldownSec != 300 {
		t.Errorf("expected default cooldown 300, got %d", rule.CooldownSec)
	}
}

func TestCreateRule_InvalidConditions(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "Bad Rule",
		Type:       "sensor_threshold",
		Conditions: "not-json",
		Actions:    validActionsJSON(),
	}

	_, err := svc.CreateRule("tenant_1", req)
	if err == nil {
		t.Fatal("expected error for invalid conditions JSON, got nil")
	}
}

func TestCreateRule_InvalidActions(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "Bad Actions Rule",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(),
		Actions:    "{invalid}",
	}

	_, err := svc.CreateRule("tenant_1", req)
	if err == nil {
		t.Fatal("expected error for invalid actions JSON, got nil")
	}
}

// ---------- EvaluateRules ----------

func TestEvaluateRules_MatchCreatesAlert(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	// Create a rule that triggers on temperature > 80
	req := CreateAlertRuleRequest{
		Name:       "High Temp Rule",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(),
		Actions:    validActionsJSON(),
		Severity:   "critical",
	}
	_, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("setup: create rule failed: %v", err)
	}

	// Send an event that matches (temperature=90 > 80)
	event := AlertEvent{
		Metric:   "temperature",
		Value:    90,
		Location: "Building A",
		Message:  "Temperature spike",
	}

	alerts, err := svc.EvaluateRules("tenant_1", event)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(alerts) != 1 {
		t.Fatalf("expected 1 alert, got %d", len(alerts))
	}
	if alerts[0].Title != "High Temp Rule" {
		t.Errorf("expected alert title 'High Temp Rule', got %q", alerts[0].Title)
	}
	if alerts[0].Level != "CRIT" {
		t.Errorf("expected level CRIT, got %q", alerts[0].Level)
	}
}

func TestEvaluateRules_NoMatch(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "High Temp Rule",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(), // temperature > 80
		Actions:    validActionsJSON(),
	}
	_, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("setup: create rule failed: %v", err)
	}

	// Send event that does NOT match (temperature=50 < 80)
	event := AlertEvent{
		Metric:   "temperature",
		Value:    50,
		Location: "Building B",
		Message:  "Normal temp",
	}

	alerts, err := svc.EvaluateRules("tenant_1", event)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(alerts) != 0 {
		t.Errorf("expected 0 alerts for non-matching event, got %d", len(alerts))
	}
}

func TestEvaluateRules_CooldownDebounce(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	cooldown := 3600 // 1 hour cooldown
	req := CreateAlertRuleRequest{
		Name:        "Debounce Rule",
		Type:        "sensor_threshold",
		Conditions:  validConditionsJSON(),
		Actions:     validActionsJSON(),
		CooldownSec: &cooldown,
	}
	rule, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("setup: create rule failed: %v", err)
	}

	// Set last_fired_at to now (simulate recently fired)
	now := time.Now()
	svc.db.Model(&model.AlertRule{}).Where("id = ?", rule.ID).Update("last_fired_at", now)

	event := AlertEvent{
		Metric:   "temperature",
		Value:    90,
		Location: "Building A",
		Message:  "Temperature spike again",
	}

	alerts, err := svc.EvaluateRules("tenant_1", event)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(alerts) != 0 {
		t.Errorf("expected 0 alerts due to cooldown, got %d", len(alerts))
	}
}

// ---------- ToggleRule ----------

func TestToggleRule_EnableDisable(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "Toggle Test",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(),
		Actions:    validActionsJSON(),
	}
	rule, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("setup: create rule failed: %v", err)
	}

	// Disable the rule
	if err := svc.ToggleRule("tenant_1", rule.ID, false); err != nil {
		t.Fatalf("failed to disable rule: %v", err)
	}
	updated, err := svc.GetRule("tenant_1", rule.ID)
	if err != nil {
		t.Fatalf("failed to get rule: %v", err)
	}
	if updated.Enabled {
		t.Error("expected rule to be disabled")
	}

	// Re-enable the rule
	if err := svc.ToggleRule("tenant_1", rule.ID, true); err != nil {
		t.Fatalf("failed to enable rule: %v", err)
	}
	updated, err = svc.GetRule("tenant_1", rule.ID)
	if err != nil {
		t.Fatalf("failed to get rule: %v", err)
	}
	if !updated.Enabled {
		t.Error("expected rule to be enabled")
	}
}

func TestToggleRule_NotFound(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	err := svc.ToggleRule("tenant_1", 99999, true)
	if err != ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

// ---------- ListRules ----------

func TestListRules_Pagination(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	// Create 5 rules
	for i := 0; i < 5; i++ {
		req := CreateAlertRuleRequest{
			Name:       "Rule " + string(rune('A'+i)),
			Type:       "sensor_threshold",
			Conditions: validConditionsJSON(),
			Actions:    validActionsJSON(),
		}
		if _, err := svc.CreateRule("tenant_1", req); err != nil {
			t.Fatalf("setup: failed to create rule %d: %v", i, err)
		}
	}

	rules, total, err := svc.ListRules("tenant_1", nil, "", 1, 2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 5 {
		t.Errorf("expected total=5, got %d", total)
	}
	if len(rules) != 2 {
		t.Errorf("expected 2 rules on page 1, got %d", len(rules))
	}
}

func TestListRules_FilterByType(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	for _, typ := range []string{"sensor_threshold", "yolo_detection", "sensor_threshold"} {
		req := CreateAlertRuleRequest{
			Name:       "Rule " + typ,
			Type:       typ,
			Conditions: validConditionsJSON(),
			Actions:    validActionsJSON(),
		}
		if _, err := svc.CreateRule("tenant_1", req); err != nil {
			t.Fatalf("setup: failed to create rule: %v", err)
		}
	}

	rules, total, err := svc.ListRules("tenant_1", nil, "yolo_detection", 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total=1 for yolo_detection, got %d", total)
	}
	if len(rules) != 1 {
		t.Errorf("expected 1 rule, got %d", len(rules))
	}
}

func TestListRules_FilterByEnabled(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	enabledTrue := true

	req1 := CreateAlertRuleRequest{
		Name: "Enabled Rule", Type: "sensor_threshold",
		Conditions: validConditionsJSON(), Actions: validActionsJSON(),
		Enabled: &enabledTrue,
	}
	svc.CreateRule("tenant_1", req1)

	// Disable via ToggleRule to ensure it's actually disabled in DB
	req2 := CreateAlertRuleRequest{
		Name: "Disabled Rule", Type: "sensor_threshold",
		Conditions: validConditionsJSON(), Actions: validActionsJSON(),
		Enabled: &enabledTrue,
	}
	rule2, _ := svc.CreateRule("tenant_1", req2)
	svc.ToggleRule("tenant_1", rule2.ID, false)

	enabled := true
	rules, total, err := svc.ListRules("tenant_1", &enabled, "", 1, 20)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 1 {
		t.Errorf("expected total=1 enabled rules, got %d", total)
	}
	if len(rules) != 1 || rules[0].Name != "Enabled Rule" {
		t.Errorf("expected 'Enabled Rule', got %+v", rules)
	}
}

// ---------- DeleteRule ----------

func TestDeleteRule_SoftDelete(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	req := CreateAlertRuleRequest{
		Name:       "To Delete",
		Type:       "sensor_threshold",
		Conditions: validConditionsJSON(),
		Actions:    validActionsJSON(),
	}
	rule, err := svc.CreateRule("tenant_1", req)
	if err != nil {
		t.Fatalf("setup: create rule failed: %v", err)
	}

	if err := svc.DeleteRule("tenant_1", rule.ID); err != nil {
		t.Fatalf("failed to delete rule: %v", err)
	}

	// Should not be found after soft delete
	_, err = svc.GetRule("tenant_1", rule.ID)
	if err != ErrNotFound {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}

	// But record should still exist in DB (soft deleted)
	var count int64
	svc.db.Unscoped().Model(&model.AlertRule{}).Where("id = ?", rule.ID).Count(&count)
	if count != 1 {
		t.Errorf("expected soft-deleted record in DB, got count=%d", count)
	}
}

func TestDeleteRule_NotFound(t *testing.T) {
	svc := setupAlertRuleTestDB(t)

	err := svc.DeleteRule("tenant_1", 99999)
	if err != ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
