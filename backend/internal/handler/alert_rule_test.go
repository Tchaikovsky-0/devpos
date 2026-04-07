package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"xunjianbao-backend/internal/model"
	"xunjianbao-backend/internal/service"
)

func setupAlertRuleHandlerTest(t *testing.T) (*gin.Engine, *service.AlertRuleService) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	db.AutoMigrate(&model.AlertRule{}, &model.Alert{}, &model.User{}, &model.Stream{})

	wsHub := service.NewWebSocketHub()
	alertSvc := service.NewAlertService(db, wsHub)
	notifSvc := service.NewNotificationService()
	alertRuleSvc := service.NewAlertRuleService(db, alertSvc, notifSvc)

	h := NewAlertRuleHandler(alertRuleSvc)

	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Mock auth middleware
	api := r.Group("/api/v1")
	api.Use(func(c *gin.Context) {
		c.Set("user_id", uint(1))
		c.Set("tenant_id", "tenant_test")
		c.Next()
	})
	h.RegisterRoutes(api)

	return r, alertRuleSvc
}

func validCondJSON() string {
	b, _ := json.Marshal(model.AlertRuleCondition{
		Metric: "temperature", Operator: "gt", Threshold: 80, Duration: 60,
	})
	return string(b)
}

func validActJSON() string {
	b, _ := json.Marshal([]model.AlertRuleAction{
		{Type: "webhook", Target: "https://example.com/hook"},
	})
	return string(b)
}

// ---------- Create ----------

func TestAlertRuleHandler_Create_Success(t *testing.T) {
	r, _ := setupAlertRuleHandlerTest(t)

	payload := map[string]interface{}{
		"name":       "Handler Test Rule",
		"type":       "sensor_threshold",
		"conditions": validCondJSON(),
		"actions":    validActJSON(),
		"severity":   "warning",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/alert-rules", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["code"].(float64) != 201 {
		t.Errorf("expected code 201, got %v", resp["code"])
	}
}

func TestAlertRuleHandler_Create_ValidationError(t *testing.T) {
	r, _ := setupAlertRuleHandlerTest(t)

	// Missing required fields (name, type, conditions, actions)
	payload := map[string]interface{}{
		"description": "no required fields",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/alert-rules", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d, body: %s", w.Code, w.Body.String())
	}
}

// ---------- List ----------

func TestAlertRuleHandler_List(t *testing.T) {
	r, svc := setupAlertRuleHandlerTest(t)

	// Create some rules
	for i := 0; i < 3; i++ {
		svc.CreateRule("tenant_test", service.CreateAlertRuleRequest{
			Name:       fmt.Sprintf("Rule %d", i),
			Type:       "sensor_threshold",
			Conditions: validCondJSON(),
			Actions:    validActJSON(),
		})
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/alert-rules?page=1&page_size=10", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Code int `json:"code"`
		Data struct {
			Items []interface{} `json:"items"`
			Total float64       `json:"total"`
		} `json:"data"`
	}
	json.Unmarshal(w.Body.Bytes(), &resp)

	if resp.Data.Total != 3 {
		t.Errorf("expected total=3, got %v", resp.Data.Total)
	}
	if len(resp.Data.Items) != 3 {
		t.Errorf("expected 3 items, got %d", len(resp.Data.Items))
	}
}

// ---------- Toggle ----------

func TestAlertRuleHandler_Toggle(t *testing.T) {
	r, svc := setupAlertRuleHandlerTest(t)

	rule, _ := svc.CreateRule("tenant_test", service.CreateAlertRuleRequest{
		Name:       "Toggle Handler Rule",
		Type:       "sensor_threshold",
		Conditions: validCondJSON(),
		Actions:    validActJSON(),
	})

	payload := map[string]interface{}{"enabled": false}
	body, _ := json.Marshal(payload)

	url := fmt.Sprintf("/api/v1/alert-rules/%d/toggle", rule.ID)
	req := httptest.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	data := resp["data"].(map[string]interface{})
	if data["enabled"] != false {
		t.Errorf("expected enabled=false, got %v", data["enabled"])
	}
}
